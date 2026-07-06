package models

import (
	"time"
)

// OpsJob 表示一个运维作业（例如 works 统计重算）。
//
// 注意：本项目同时支持 MySQL/Postgres/SQLite（见 backend/internal/db/db.go），
// 因此这里尽量使用最小类型交集（uuid 用 string，params 用 text/json string）。
//
// 关键语义参考：docs/guides/admin-console-mvp-guide.md
// - status: running/succeeded/failed/canceled
// - lease_expires_at: 避免 worker 异常退出永久占用
// - created_by + params + progress 字段用于审计与可观测
//
// 全局唯一（同 job_type 仅 1 个 running）与分布式锁推荐使用 ops_job_locks 表协调，
// 详细见 tasks/admin-console-mvp/2.1_design/ops_jobs-model-and-uniqueness.md
//
type OpsJob struct {
	ID uint `gorm:"primarykey" json:"id"`

	JobID      string  `gorm:"type:varchar(36);unique;not null" json:"job_id"`
	JobType    string  `gorm:"type:varchar(128);index;not null" json:"job_type"`
	JobVersion *string `gorm:"type:varchar(64);index" json:"job_version,omitempty"`

	Status string `gorm:"type:varchar(16);index;not null" json:"status"`

	StartedAt  *time.Time `gorm:"index" json:"started_at,omitempty"`
	FinishedAt *time.Time `gorm:"index" json:"finished_at,omitempty"`

	LeaseOwner     *string    `gorm:"type:varchar(128);index" json:"lease_owner,omitempty"`
	LeaseToken     *string    `gorm:"type:varchar(64)" json:"lease_token,omitempty"`
	LeaseExpiresAt *time.Time `gorm:"index" json:"lease_expires_at,omitempty"`

	CreatedByUserID   uint    `gorm:"index;not null" json:"created_by_user_id"`
	CreatedByUsername *string `gorm:"type:varchar(255)" json:"created_by_username,omitempty"`
	TraceID           *string `gorm:"type:varchar(64);index" json:"trace_id,omitempty"`

	Params *string `gorm:"type:text" json:"params,omitempty"`

	ProgressTotal  int64 `gorm:"not null;default:0" json:"progress_total"`
	ProgressDone   int64 `gorm:"not null;default:0" json:"progress_done"`
	ProgressFailed int64 `gorm:"not null;default:0" json:"progress_failed"`

	ErrorSummary *string `gorm:"type:text" json:"error_summary,omitempty"`
	ErrorDetails *string `gorm:"type:text" json:"error_details,omitempty"`

	CancelRequestedAt *time.Time `gorm:"index" json:"cancel_requested_at,omitempty"`
	CanceledAt        *time.Time `gorm:"index" json:"canceled_at,omitempty"`
	CanceledByUserID  *uint      `gorm:"index" json:"canceled_by_user_id,omitempty"`
	CancelReason      *string    `gorm:"type:varchar(255)" json:"cancel_reason,omitempty"`

	LockVersion int64 `gorm:"not null;default:0" json:"lock_version"`

	CreatedAt time.Time `gorm:"index" json:"created_at"`
	UpdatedAt time.Time `gorm:"index" json:"updated_at"`
}

const (
	OpsJobStatusRunning   = "running"
	OpsJobStatusSucceeded = "succeeded"
	OpsJobStatusFailed    = "failed"
	OpsJobStatusCanceled  = "canceled"
)

const (
	OpsJobTypeWorksRecalcStats = "works.recalc_stats"
)
