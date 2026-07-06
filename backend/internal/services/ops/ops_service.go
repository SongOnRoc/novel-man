package ops

import (
	"encoding/json"
	"errors"
	"time"

	opsc "novel-man/backend/internal/contracts/ops"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models"
	repo_gorm "novel-man/backend/internal/repositories/gorm"
	"novel-man/backend/utils/context"

	"github.com/google/uuid"
)

// opsService 为 Ops API 提供最小可用的作业能力（创建/查询/取消请求）。
//
// 注意：runner（真正执行 works.recalc_stats）不在本 Service 内实现，后续阶段再补。
// 当前阶段重点是：
// - 通过 ops_job_locks 保证同 job_type 全局唯一（running）
// - 写入审计字段与 params
// - 提供 list/detail/cancel(request) API 依赖的方法
//
// noinspection GoUnusedType
// (由 DI 提供)
type opsService struct {
	jobs  *repo_gorm.OpsJobGormRepository
	locks *repo_gorm.OpsJobLockGormRepository
}

func NewOpsService(jobs *repo_gorm.OpsJobGormRepository, locks *repo_gorm.OpsJobLockGormRepository) opsc.OpsService {
	return &opsService{jobs: jobs, locks: locks}
}

func (s *opsService) CreateWorksRecalcStatsJob(
	ctx context.Context,
	createdByUserID uint,
	createdByUsername *string,
	traceID *string,
	req opsc.CreateWorksRecalcStatsJobRequest,
) (*models.OpsJob, error) {
	// 1) 轻量校验（binding 已做一部分，这里补必填关系校验）
	switch req.Mode {
	case opsc.CreateWorksRecalcStatsJobModeAll:
		// ok
	case opsc.CreateWorksRecalcStatsJobModeWorkID:
		if req.WorkID == nil || *req.WorkID <= 0 {
			return nil, errors.New("work_id is required when mode=work_id")
		}
	case opsc.CreateWorksRecalcStatsJobModePredicate:
		// MVP：允许 predicate 为空（仅审计存档）。真正执行逻辑后续实现。
	default:
		return nil, errors.New("invalid mode")
	}

	now := time.Now()
	jobType := models.OpsJobTypeWorksRecalcStats
	owner := "api"
	token := uuid.NewString()
	leaseTTL := 60 * time.Second

	// 2) 抢锁：只有获得 ops_job_locks 才允许创建 running job（跨 DB 全局唯一入口）
	acquired, err := s.locks.AcquireOrSteal(ctx, jobType, owner, token, leaseTTL, now)
	if err != nil {
		return nil, err
	}
	if !acquired {
		return nil, errors.New("job already running (lock not acquired)")
	}

	// 3) 组装 params（JSON string）
	paramsPayload := map[string]any{
		"mode":       req.Mode,
		"work_id":    req.WorkID,
		"predicate":  req.Predicate,
		"dry_run":    req.DryRun,
		"created_at": now.Format(time.RFC3339Nano),
	}
	paramsBytes, err := json.Marshal(paramsPayload)
	if err != nil {
		return nil, err
	}
	paramsStr := string(paramsBytes)

	// 4) 创建 ops_jobs 记录（running）
	jobID := uuid.NewString()
	startedAt := now
	status := models.OpsJobStatusRunning

	job := &models.OpsJob{
		JobID: jobID,

		JobType: jobType,
		Status:  status,

		StartedAt: &startedAt,

		CreatedByUserID:   createdByUserID,
		CreatedByUsername: createdByUsername,
		TraceID:           traceID,

		Params: &paramsStr,

		ProgressTotal:  0,
		ProgressDone:   0,
		ProgressFailed: 0,
	}

	if err := s.jobs.Create(ctx, job); err != nil {
		// 这里不释放锁：锁会通过 lease 过期自动回收；MVP 先保证一致性与可观测。
		logger.Warn(&ctx, "create ops job failed after lock acquired: {}", err)
		return nil, err
	}

	return job, nil
}

func (s *opsService) GetJob(ctx context.Context, jobID string) (*models.OpsJob, error) {
	return s.jobs.GetByJobID(ctx, jobID)
}

func (s *opsService) ListJobs(ctx context.Context, page, limit int, jobType, status string) ([]models.OpsJob, int64, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 200 {
		limit = 200
	}
	return s.jobs.List(ctx, page, limit, jobType, status)
}

func (s *opsService) RequestCancel(ctx context.Context, jobID string, canceledByUserID uint, reason string) (bool, error) {
	now := time.Now()
	return s.jobs.RequestCancel(ctx, jobID, canceledByUserID, reason, now)
}

func (s *opsService) DeleteJob(ctx context.Context, jobID string) (bool, error) {
	return s.jobs.DeleteByJobID(ctx, jobID)
}

func (s *opsService) ClearJobs(ctx context.Context, page, limit int, jobType, status string) (int64, error) {
	// 与 ListJobs 保持一致的默认/上限。
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 200 {
		limit = 200
	}
	return s.jobs.ClearByFilterWithPagination(ctx, page, limit, jobType, status)
}
