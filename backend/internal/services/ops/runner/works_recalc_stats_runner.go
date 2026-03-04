package runner

import (
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/rand"
	"strings"
	"sync"
	"time"

	"novel-man/backend/internal/events"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	repo_gorm "novel-man/backend/internal/repositories/gorm"
	"novel-man/backend/utils/context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WorksRecalcStatsRunner 扫描 ops_jobs（works.recalc_stats），抢占/续租 lease，分页扫描 works，并通过 EventManager.Dispatch 投递到 works consumer。
//
// 关键约束（对齐设计稿）：
// - 除扫描读取外，所有 ops_jobs UPDATE 必须带 lease where（status=running + lease_owner + lease_token，建议 + lease_expires_at>now）。
// - cancel 两段式：API 仅 request（cancel_requested_at），runner 读到后 ack 落盘 status=canceled。
// - progress 单调递增；MVP 以“成功投递数量”计 done。
// - works 扫描必须分页（按 id 升序，where id > last）。
//
// TODO(ops-runner): 当前为单 job_type 专用 runner（MVP 优先“先能用”）。
// 后续版本稳定继续迭代 需求时，需要抽取通用引擎（scan/lease/progress/cancel/backoff/finalize），
// 每个 job_type 仅实现 executor（params 解析 + 目标分页扫描 + Dispatch 事件构造）。
// 参考扩展建议文档：[`tasks/admin-console-mvp/2.3_impl/ops_runner-implementation-summary.md`](tasks/admin-console-mvp/2.3_impl/ops_runner-implementation-summary.md:1)

type WorksRecalcStatsRunner struct {
	jobsRepo *repo_gorm.OpsJobGormRepository
	db       WorkScannerDB
	em       *events.EventManager

	identity string

	tickerInterval time.Duration
	leaseTTL       time.Duration
	renewInterval  time.Duration

	workScanBatchSize int

	progressFlushEveryN  int64
	progressFlushEvery   time.Duration
	queueFullBackoffBase time.Duration
	queueFullBackoffMax  time.Duration

	started sync.Once
}

type WorkScannerDB interface {
	ListWorkIDsAfter(ctx context.Context, afterID int64, limit int) ([]int64, error)
	CountWorks(ctx context.Context) (int64, error)
}

type gormWorkScannerDB struct {
	db *gorm.DB
}

func NewGormWorkScannerDB(db *gorm.DB) WorkScannerDB {
	return &gormWorkScannerDB{db: db}
}

func (s *gormWorkScannerDB) ListWorkIDsAfter(ctx context.Context, afterID int64, limit int) ([]int64, error) {
	if limit <= 0 {
		limit = 200
	}
	var ids []int64
	q := s.db.WithContext(ctx).Model(&models.Work{}).Select("id").Where("deleted_at IS NULL")
	if afterID > 0 {
		q = q.Where("id > ?", afterID)
	}
	if err := q.Order("id asc").Limit(limit).Pluck("id", &ids).Error; err != nil {
		return nil, err
	}
	return ids, nil
}

func (s *gormWorkScannerDB) CountWorks(ctx context.Context) (int64, error) {
	var total int64
	err := s.db.WithContext(ctx).Model(&models.Work{}).Where("deleted_at IS NULL").Count(&total).Error
	return total, err
}

// NewWorksRecalcStatsRunner 构造 runner，并自启动（在 construct.go Invoke 阶段触发 Start）。
func NewWorksRecalcStatsRunner(
	jobsRepo *repo_gorm.OpsJobGormRepository,
	scanner WorkScannerDB,
	em *events.EventManager,
) *WorksRecalcStatsRunner {
	return &WorksRecalcStatsRunner{jobsRepo: jobsRepo, db: scanner, em: em}
}

func (r *WorksRecalcStatsRunner) Start() {
	r.started.Do(func() {
		r.ensureDefaults()
		ctx := *context.New()
		logger.Info(&ctx, "ops works recalc runner started identity={} ticker_interval={} lease_ttl={} renew_interval={}", r.identity, r.tickerInterval, r.leaseTTL, r.renewInterval)
		go r.loop()
	})
}

func (r *WorksRecalcStatsRunner) ensureDefaults() {
	if r.jobsRepo == nil || r.em == nil || r.db == nil {
		panic("works recalc stats runner missing dependencies")
	}

	if r.identity == "" {
		r.identity = "ops-runner:" + uuid.NewString()
	}
	if r.tickerInterval <= 0 {
		r.tickerInterval = 5 * time.Second
	}
	if r.leaseTTL <= 0 {
		r.leaseTTL = 60 * time.Second
	}
	if r.renewInterval <= 0 {
		r.renewInterval = 20 * time.Second
	}
	if r.workScanBatchSize <= 0 {
		r.workScanBatchSize = 200
	}
	if r.progressFlushEveryN <= 0 {
		r.progressFlushEveryN = 10
	}
	if r.progressFlushEvery <= 0 {
		r.progressFlushEvery = 2 * time.Second
	}
	if r.queueFullBackoffBase <= 0 {
		r.queueFullBackoffBase = 200 * time.Millisecond
	}
	if r.queueFullBackoffMax <= 0 {
		r.queueFullBackoffMax = 2 * time.Second
	}
}

func (r *WorksRecalcStatsRunner) loop() {
	ticker := time.NewTicker(r.tickerInterval)
	defer ticker.Stop()

	for range ticker.C {
		ctx := *context.New()
		if err := r.tick(ctx); err != nil {
			logger.Warn(&ctx, "ops works recalc runner tick failed: {}", err)
		}
	}
}

func (r *WorksRecalcStatsRunner) tick(ctx context.Context) error {
	r.ensureDefaults()

	jobs, err := r.jobsRepo.ScanRunningJobs(ctx, models.OpsJobTypeWorksRecalcStats, 20, time.Now())
	if err != nil {
		return err
	}
	logger.Info(&ctx, "ops works recalc runner scanned running jobs count={}", len(jobs))

	for i := range jobs {
		job := jobs[i]
		logger.Info(&ctx, "ops works recalc runner picked job job_id={} status={} progress_done={} progress_failed={} progress_total={}", job.JobID, job.Status, job.ProgressDone, job.ProgressFailed, job.ProgressTotal)
		if err := r.processJob(ctx, &job); err != nil {
			logger.Warn(&ctx, "process job failed job_id={} err={}", job.JobID, err)
		}
	}
	return nil
}

type worksRecalcParams struct {
	Mode      string                 `json:"mode"`
	WorkID    *int64                 `json:"work_id"`
	Predicate map[string]any         `json:"predicate"`
	DryRun    bool                   `json:"dry_run"`
	Raw       map[string]interface{} `json:"-"`
}

func (r *WorksRecalcStatsRunner) processJob(ctx context.Context, job *models.OpsJob) error {
	if job == nil {
		return nil
	}
	if job.Status != models.OpsJobStatusRunning {
		return nil
	}
	if job.JobType != models.OpsJobTypeWorksRecalcStats {
		return nil
	}

	now := time.Now()
	lease := repo_gorm.OpsJobLease{Owner: r.identity, Token: uuid.NewString()}
	acquired, err := r.jobsRepo.TryStealLease(ctx, job.JobID, lease, r.leaseTTL, now)
	if err != nil {
		logger.Warn(&ctx, "ops works recalc runner lease attempt failed job_id={} lease_owner={} lease_token={} err={}", job.JobID, lease.Owner, lease.Token, err)
		return err
	}
	if !acquired {
		logger.Info(&ctx, "ops works recalc runner lease skipped job_id={} lease_owner={} lease_token={}", job.JobID, lease.Owner, lease.Token)
		// 可能 lease 还没过期或已 cancel requested。
		return nil
	}
	logger.Info(&ctx, "ops works recalc runner lease acquired job_id={} lease_owner={} lease_token={} lease_ttl={}", job.JobID, lease.Owner, lease.Token, r.leaseTTL)

	// reload job to read cancel flag + params under current view
	fresh, err := r.jobsRepo.GetByJobID(ctx, job.JobID)
	if err != nil {
		return err
	}

	// cancel ack
	if fresh.CancelRequestedAt != nil {
		logger.Info(&ctx, "ops works recalc runner cancel acknowledged job_id={} lease_owner={} lease_token={}", fresh.JobID, lease.Owner, lease.Token)
		_, _ = r.jobsRepo.AckCancel(ctx, fresh.JobID, lease, time.Now())
		return nil
	}

	params, err := parseWorksRecalcParams(fresh.Params)
	if err != nil {
		summary := fmt.Sprintf("invalid params: %v", err)
		_, _ = r.jobsRepo.Finalize(ctx, fresh.JobID, lease, models.OpsJobStatusFailed, &summary, time.Now())
		return err
	}

	// init progress_total if possible
	if fresh.ProgressTotal == 0 {
		total := int64(0)
		switch params.Mode {
		case string("work_id"):
			total = 1
		case string("all"):
			cnt, cErr := r.db.CountWorks(ctx)
			if cErr == nil {
				total = cnt
			}
		default:
			// predicate: MVP store only; treat as 0
		}
		if total > 0 {
			_, _ = r.jobsRepo.SetProgressTotal(ctx, fresh.JobID, lease, total, time.Now())
			logger.Info(&ctx, "ops works recalc runner initialized progress total job_id={} progress_total={} mode={}", fresh.JobID, total, params.Mode)
		}
	}

	// execute
	done, failed, execErr := r.execute(ctx, fresh, lease, params)
	_ = done
	_ = failed
	if execErr != nil {
		summary := execErr.Error()
		logger.Warn(&ctx, "ops works recalc runner execution failed job_id={} lease_owner={} lease_token={} done={} failed={} err={}", fresh.JobID, lease.Owner, lease.Token, done, failed, execErr)
		_, _ = r.jobsRepo.Finalize(ctx, fresh.JobID, lease, models.OpsJobStatusFailed, &summary, time.Now())
		return execErr
	}

	logger.Info(&ctx, "ops works recalc runner execution succeeded job_id={} lease_owner={} lease_token={} done={} failed={}", fresh.JobID, lease.Owner, lease.Token, done, failed)
	_, _ = r.jobsRepo.Finalize(ctx, fresh.JobID, lease, models.OpsJobStatusSucceeded, nil, time.Now())
	return nil
}

func parseWorksRecalcParams(raw *string) (*worksRecalcParams, error) {
	if raw == nil || *raw == "" {
		return nil, errors.New("params is empty")
	}
	var m map[string]any
	if err := json.Unmarshal([]byte(*raw), &m); err != nil {
		return nil, err
	}
	p := &worksRecalcParams{Raw: make(map[string]interface{})}
	if v, ok := m["mode"].(string); ok {
		p.Mode = v
	}
	if v, ok := m["dry_run"].(bool); ok {
		p.DryRun = v
	}
	if v, ok := m["predicate"].(map[string]any); ok {
		p.Predicate = v
	}
	if v, ok := m["work_id"]; ok {
		switch t := v.(type) {
		case float64:
			vv := int64(t)
			p.WorkID = &vv
		case int64:
			vv := t
			p.WorkID = &vv
		case int:
			vv := int64(t)
			p.WorkID = &vv
		}
	}
	if p.Mode == "" {
		return nil, errors.New("mode missing")
	}
	return p, nil
}

func (r *WorksRecalcStatsRunner) execute(ctx context.Context, job *models.OpsJob, lease repo_gorm.OpsJobLease, params *worksRecalcParams) (done int64, failed int64, err error) {
	lastFlush := time.Now()
	pendingDone := int64(0)
	pendingFailed := int64(0)
	flush := func(force bool) error {
		if !force {
			if pendingDone+pendingFailed < r.progressFlushEveryN && time.Since(lastFlush) < r.progressFlushEvery {
				return nil
			}
		}
		ok, uErr := r.jobsRepo.UpdateProgressMonotonic(ctx, job.JobID, lease, pendingDone, pendingFailed, time.Now())
		if uErr != nil {
			return uErr
		}
		if !ok {
			return errors.New("lost lease when flushing progress")
		}
		logger.Info(&ctx, "ops works recalc runner progress flushed job_id={} lease_owner={} lease_token={} delta_done={} delta_failed={} force={}", job.JobID, lease.Owner, lease.Token, pendingDone, pendingFailed, force)
		done += pendingDone
		failed += pendingFailed
		pendingDone = 0
		pendingFailed = 0
		lastFlush = time.Now()
		return nil
	}

	renewOrStop := func() error {
		ok, rErr := r.jobsRepo.RenewLease(ctx, job.JobID, lease, r.leaseTTL, time.Now())
		if rErr != nil {
			logger.Warn(&ctx, "ops works recalc runner lease renew failed job_id={} lease_owner={} lease_token={} err={}", job.JobID, lease.Owner, lease.Token, rErr)
			return rErr
		}
		if !ok {
			logger.Warn(&ctx, "ops works recalc runner lease lost job_id={} lease_owner={} lease_token={}", job.JobID, lease.Owner, lease.Token)
			return errors.New("lost lease")
		}
		logger.Info(&ctx, "ops works recalc runner lease renewed job_id={} lease_owner={} lease_token={} lease_ttl={}", job.JobID, lease.Owner, lease.Token, r.leaseTTL)
		// check cancel
		fresh, gErr := r.jobsRepo.GetByJobID(ctx, job.JobID)
		if gErr == nil && fresh.CancelRequestedAt != nil {
			logger.Info(&ctx, "ops works recalc runner cancel observed during execution job_id={} lease_owner={} lease_token={}", job.JobID, lease.Owner, lease.Token)
			_, _ = r.jobsRepo.AckCancel(ctx, job.JobID, lease, time.Now())
			return errors.New("canceled")
		}
		return nil
	}

	backoffAttempt := 0
	enqueueWork := func(workID int64) error {
		evt := events.FactEvent{
			EventID:       fmt.Sprintf("opsjob:%s:work:%d:recalc_stats:v1", job.JobID, workID),
			EventType:     events.EventTypeWorksRecalcStats,
			AggregateType: events.AggregateTypeWork,
			AggregateID:   fmt.Sprintf("%d", workID),
			OccurredAt:    time.Now(),
			Producer:      "ops.runner",
			TraceID:       job.JobID,
			Payload: map[string]any{
				"work_id":      workID,
				"ops_job_id":   job.JobID,
				"triggered_by": "ops_runner",
			},
		}

		plan := r.em.BuildDispatchPlan(evt.EventType)
		logger.Info(&ctx, "ops works recalc runner enqueue prepared job_id={} work_id={} event_id={} modules={} missing_consumers={} dry_run={}", job.JobID, workID, evt.EventID, strings.Join(plan.Modules, ","), strings.Join(plan.MissingConsumers, ","), params.DryRun)
		if len(plan.Modules) == 0 {
			return fmt.Errorf("no route registered for event_type=%s", evt.EventType)
		}
		if len(plan.MissingConsumers) > 0 {
			return fmt.Errorf("missing consumer for event_type=%s modules=%s", evt.EventType, strings.Join(plan.MissingConsumers, ","))
		}

		if params.DryRun {
			logger.Info(&ctx, "ops works recalc runner enqueue skipped by dry_run job_id={} work_id={} event_id={}", job.JobID, workID, evt.EventID)
			return nil
		}

		err := r.em.Dispatch(ctx, evt)
		if err == nil {
			backoffAttempt = 0
			logger.Info(&ctx, "ops works recalc runner enqueue dispatched job_id={} work_id={} event_id={} trace_id={}", job.JobID, workID, evt.EventID, evt.TraceID)
			return nil
		}
		if isQueueFullErr(err) {
			sleep := backoffDuration(r.queueFullBackoffBase, r.queueFullBackoffMax, backoffAttempt)
			backoffAttempt++
			logger.Warn(&ctx, "ops works recalc runner enqueue backoff job_id={} work_id={} event_id={} attempt={} sleep={} err={}", job.JobID, workID, evt.EventID, backoffAttempt, sleep, err)
			time.Sleep(sleep)
			return err
		}
		logger.Warn(&ctx, "ops works recalc runner enqueue failed job_id={} work_id={} event_id={} err={}", job.JobID, workID, evt.EventID, err)
		return err
	}

	switch params.Mode {
	case string("work_id"):
		if params.WorkID == nil || *params.WorkID <= 0 {
			return 0, 0, errors.New("work_id missing")
		}
		logger.Info(&ctx, "ops works recalc runner executing single work job_id={} work_id={}", job.JobID, *params.WorkID)
		if err := renewOrStop(); err != nil {
			return 0, 0, err
		}
		if err := enqueueWork(*params.WorkID); err != nil {
			pendingFailed++
			_ = flush(true)
			return done, failed, err
		}
		pendingDone++
		_ = flush(true)
		return done, failed, nil

	case string("all"):
		// NOTE: 先预扫描全部 work_id，再逐个 dispatch。
		// 这样可以避免在 SQLite（尤其是 shared in-memory）测试场景下：
		// runner 持续扫描 works 表的同时，consumer 异步更新 works 表，导致 "database table is locked"。
		// 对生产环境而言，这也能减少“扫描与执行并发交错”带来的读写竞争。
		allIDs := make([]int64, 0, 256)
		after := int64(0)
		for {
			ids, sErr := r.db.ListWorkIDsAfter(ctx, after, r.workScanBatchSize)
			if sErr != nil {
				return done, failed, sErr
			}
			logger.Info(&ctx, "ops works recalc runner scanned work batch job_id={} after_id={} batch_size={}", job.JobID, after, len(ids))
			if len(ids) == 0 {
				break
			}
			allIDs = append(allIDs, ids...)
			after = ids[len(ids)-1]
		}

		for _, id := range allIDs {
			if err := renewOrStop(); err != nil {
				return done, failed, err
			}
			if err := enqueueWork(id); err != nil {
				if isQueueFullErr(err) {
					// backpressure: retry current id on next outer loop iteration
					continue
				}
				pendingFailed++
				_ = flush(true)
				return done, failed, err
			}
			pendingDone++
			_ = flush(false)
		}
		_ = flush(true)
		return done, failed, nil

	case string("predicate"):
		// MVP：predicate 仅审计存档，不执行真正过滤。
		return 0, 0, nil

	default:
		return 0, 0, fmt.Errorf("unsupported mode: %s", params.Mode)
	}
}

func isQueueFullErr(err error) bool {
	// scheduler.Enqueue returns fmt.Errorf("queue is full") wrapped by EventManager.Dispatch.
	return err != nil && strings.Contains(err.Error(), "queue is full")
}

func backoffDuration(base, max time.Duration, attempt int) time.Duration {
	if attempt < 0 {
		attempt = 0
	}
	pow := math.Pow(2, float64(attempt))
	d := time.Duration(float64(base) * pow)
	if d > max {
		d = max
	}
	// add jitter 0~100ms
	j := time.Duration(rand.Intn(100)) * time.Millisecond
	if d+j > max {
		return max
	}
	return d + j
}
