package gorm

import (
	"errors"
	"time"

	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// OpsJobGormRepository 提供 ops_jobs 的 DB 访问。
//
// 注意：这里暂不实现通用 contracts 接口（本模块为 MVP 新增），先以最小方法集支撑 Ops API。
// 后续若需要复用，可补充 internal/contracts/ops 的 repository + service。
//
// Runner 约束：除扫描读取外，任何 UPDATE 都必须带 lease where（status=running + lease_owner + lease_token，建议再加 lease_expires_at > now）。
type OpsJobGormRepository struct {
	db *gorm.DB
}

func NewOpsJobGormRepository(db *gorm.DB) *OpsJobGormRepository {
	return &OpsJobGormRepository{db: db}
}

func (r *OpsJobGormRepository) Create(ctx context.Context, job *models.OpsJob) error {
	return r.db.WithContext(ctx).Create(job).Error
}

func (r *OpsJobGormRepository) GetByJobID(ctx context.Context, jobID string) (*models.OpsJob, error) {
	var job models.OpsJob
	if err := r.db.WithContext(ctx).Where("job_id = ?", jobID).First(&job).Error; err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *OpsJobGormRepository) List(ctx context.Context, page, limit int, jobType, status string) ([]models.OpsJob, int64, error) {
	var jobs []models.OpsJob
	var total int64

	db := r.db.WithContext(ctx).Model(&models.OpsJob{})
	if jobType != "" {
		db = db.Where("job_type = ?", jobType)
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := db.Order("id desc").Offset(offset).Limit(limit).Find(&jobs).Error; err != nil {
		return nil, 0, err
	}
	return jobs, total, nil
}

func (r *OpsJobGormRepository) RequestCancel(ctx context.Context, jobID string, canceledBy uint, reason string, now time.Time) (bool, error) {
	updates := map[string]any{
		"cancel_requested_at": now,
		"canceled_by_user_id": canceledBy,
		"cancel_reason":       reason,
		"updated_at":          now,
	}

	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Updates(updates)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

// DeleteByJobID 硬删除单条 job。
func (r *OpsJobGormRepository) DeleteByJobID(ctx context.Context, jobID string) (bool, error) {
	res := r.db.WithContext(ctx).
		Where("job_id = ?", jobID).
		Delete(&models.OpsJob{})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

// ClearByFilterWithPagination 按筛选条件 + 分页范围（offset/limit）批量硬删除。
// 注意：这里故意把分页纳入“清理范围”，以匹配产品定义：清理当前筛选条件（包含分页）。
func (r *OpsJobGormRepository) ClearByFilterWithPagination(ctx context.Context, page, limit int, jobType, status string) (int64, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 200 {
		limit = 200
	}
	offset := (page - 1) * limit

	// 先确定要删的主键集合（避免不同 DB 对 DELETE+ORDER+LIMIT 语法兼容性差）。
	ids := make([]uint, 0, limit)
	db := r.db.WithContext(ctx).Model(&models.OpsJob{})
	if jobType != "" {
		db = db.Where("job_type = ?", jobType)
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if err := db.
		Select("id").
		Order("id desc").
		Offset(offset).
		Limit(limit).
		Pluck("id", &ids).Error; err != nil {
		return 0, err
	}
	if len(ids) == 0 {
		return 0, nil
	}

	res := r.db.WithContext(ctx).
		Where("id IN ?", ids).
		Delete(&models.OpsJob{})
	if res.Error != nil {
		return 0, res.Error
	}
	return res.RowsAffected, nil
}

func (r *OpsJobGormRepository) ScanRunningJobs(ctx context.Context, jobType string, limit int, now time.Time) ([]models.OpsJob, error) {
	if limit <= 0 {
		limit = 50
	}
	var jobs []models.OpsJob
	err := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_type = ? AND status = ?", jobType, models.OpsJobStatusRunning).
		Order("updated_at asc").
		Limit(limit).
		Find(&jobs).Error
	if err != nil {
		return nil, err
	}
	return jobs, nil
}

type OpsJobLease struct {
	Owner string
	Token string
}

func (r *OpsJobGormRepository) TryStealLease(ctx context.Context, jobID string, lease OpsJobLease, leaseTTL time.Duration, now time.Time) (bool, error) {
	expiresAt := now.Add(leaseTTL)
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("cancel_requested_at IS NULL").
		Where(r.db.WithContext(ctx).Where("lease_expires_at IS NULL").Or("lease_expires_at <= ?", now)).
		Updates(map[string]any{
			"lease_owner":      lease.Owner,
			"lease_token":      lease.Token,
			"lease_expires_at": expiresAt,
			"updated_at":       now,
			"lock_version":     gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) RenewLease(ctx context.Context, jobID string, lease OpsJobLease, leaseTTL time.Duration, now time.Time) (bool, error) {
	expiresAt := now.Add(leaseTTL)
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Where("lease_expires_at IS NOT NULL AND lease_expires_at > ?", now).
		Updates(map[string]any{
			"lease_expires_at": expiresAt,
			"updated_at":       now,
			"lock_version":     gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) UpdateProgressMonotonic(ctx context.Context, jobID string, lease OpsJobLease, deltaDone, deltaFailed int64, now time.Time) (bool, error) {
	if deltaDone < 0 || deltaFailed < 0 {
		return false, errors.New("delta must be non-negative")
	}
	if deltaDone == 0 && deltaFailed == 0 {
		return true, nil
	}
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Where("lease_expires_at IS NOT NULL AND lease_expires_at > ?", now).
		Updates(map[string]any{
			"progress_done":   gorm.Expr("progress_done + ?", deltaDone),
			"progress_failed": gorm.Expr("progress_failed + ?", deltaFailed),
			"updated_at":      now,
			"lock_version":    gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) SetProgressTotal(ctx context.Context, jobID string, lease OpsJobLease, total int64, now time.Time) (bool, error) {
	if total < 0 {
		return false, errors.New("total must be non-negative")
	}
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Where("lease_expires_at IS NOT NULL AND lease_expires_at > ?", now).
		Updates(map[string]any{
			"progress_total": total,
			"updated_at":     now,
			"lock_version":   gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) AckCancel(ctx context.Context, jobID string, lease OpsJobLease, now time.Time) (bool, error) {
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Updates(map[string]any{
			"status":       models.OpsJobStatusCanceled,
			"canceled_at":  now,
			"finished_at":  now,
			"updated_at":   now,
			"lock_version": gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) Finalize(ctx context.Context, jobID string, lease OpsJobLease, status string, errorSummary *string, now time.Time) (bool, error) {
	if status != models.OpsJobStatusSucceeded && status != models.OpsJobStatusFailed {
		return false, errors.New("invalid finalize status")
	}
	updates := map[string]any{
		"status":       status,
		"finished_at":  now,
		"updated_at":   now,
		"lock_version": gorm.Expr("lock_version + 1"),
	}
	if errorSummary != nil {
		updates["error_summary"] = *errorSummary
	}
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Updates(updates)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobGormRepository) ReleaseLease(ctx context.Context, jobID string, lease OpsJobLease, now time.Time) (bool, error) {
	res := r.db.WithContext(ctx).
		Model(&models.OpsJob{}).
		Where("job_id = ? AND status = ?", jobID, models.OpsJobStatusRunning).
		Where("lease_owner = ? AND lease_token = ?", lease.Owner, lease.Token).
		Updates(map[string]any{
			"lease_owner":      nil,
			"lease_token":      nil,
			"lease_expires_at": nil,
			"updated_at":       now,
			"lock_version":     gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

// OpsJobLockGormRepository 提供 ops_job_locks 的“全局唯一 + lease”协调访问。
type OpsJobLockGormRepository struct {
	db *gorm.DB
}

func NewOpsJobLockGormRepository(db *gorm.DB) *OpsJobLockGormRepository {
	return &OpsJobLockGormRepository{db: db}
}

// AcquireOrSteal 尝试获取（或在 lease 过期后抢占）指定 jobType 的锁。
// 返回：acquired=true 表示当前调用方成为锁持有者。
func (r *OpsJobLockGormRepository) AcquireOrSteal(ctx context.Context, jobType, owner, token string, leaseTTL time.Duration, now time.Time) (bool, error) {
	leaseExpiresAt := now.Add(leaseTTL)

	// 1) 先确保行存在（并发下可能有多个 insert，利用 PK 保证幂等）。
	lock := &models.OpsJobLock{JobType: jobType}
	if err := r.db.WithContext(ctx).FirstOrCreate(lock, &models.OpsJobLock{JobType: jobType}).Error; err != nil {
		return false, err
	}

	// 2) 条件更新：
	// - 未持有（owner/token 为空）
	// - 或 lease 已过期
	// - 或我就是当前 owner（允许续租/幂等 acquire）
	updates := map[string]any{
		"lock_owner":       owner,
		"lock_token":       token,
		"lease_expires_at": leaseExpiresAt,
		"updated_at":       now,
		"lock_version":     gorm.Expr("lock_version + 1"),
	}

	res := r.db.WithContext(ctx).
		Model(&models.OpsJobLock{}).
		Where("job_type = ?", jobType).
		Where(r.db.WithContext(ctx).Where("lease_expires_at IS NULL").
			Or("lease_expires_at < ?", now).
			Or("lock_owner = ? AND lock_token = ?", owner, token)).
		Updates(updates)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

// Renew 仅允许当前 owner+token 续租。
func (r *OpsJobLockGormRepository) Renew(ctx context.Context, jobType, owner, token string, leaseTTL time.Duration, now time.Time) (bool, error) {
	leaseExpiresAt := now.Add(leaseTTL)
	res := r.db.WithContext(ctx).
		Model(&models.OpsJobLock{}).
		Where("job_type = ? AND lock_owner = ? AND lock_token = ?", jobType, owner, token).
		Where("lease_expires_at IS NULL OR lease_expires_at >= ?", now).
		Updates(map[string]any{
			"lease_expires_at": leaseExpiresAt,
			"updated_at":       now,
			"lock_version":     gorm.Expr("lock_version + 1"),
		})
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (r *OpsJobLockGormRepository) Get(ctx context.Context, jobType string) (*models.OpsJobLock, error) {
	var lock models.OpsJobLock
	if err := r.db.WithContext(ctx).Where("job_type = ?", jobType).First(&lock).Error; err != nil {
		return nil, err
	}
	return &lock, nil
}

func (r *OpsJobLockGormRepository) ErrLockNotAcquired() error {
	return errors.New("ops job lock not acquired")
}
