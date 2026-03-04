package models

import (
	"time"
)

// OpsJobLock 为 job_type 提供一个跨数据库的“全局唯一 + lease”协调入口。
//
// 设计稿：tasks/admin-console-mvp/2.1_design/ops_jobs-model-and-uniqueness.md
//
// 核心思路：
// - 以 job_type 作为主键，天然唯一
// - 通过 lease_expires_at + lock_token 做 CAS 更新，允许 lease 过期后被其他实例接管
//
// 注意：这不是强制要求的唯一实现方式（Postgres/SQLite 可用 partial unique index），
// 但作为 MVP 默认方案能在 MySQL/Postgres/SQLite 上统一落地。
//
type OpsJobLock struct {
	JobType string `gorm:"type:varchar(128);primaryKey" json:"job_type"`

	LockOwner *string `gorm:"type:varchar(128);index" json:"lock_owner,omitempty"`
	LockToken *string `gorm:"type:varchar(64)" json:"lock_token,omitempty"`

	LeaseExpiresAt *time.Time `gorm:"index" json:"lease_expires_at,omitempty"`

	LockVersion int64 `gorm:"not null;default:0" json:"lock_version"`

	CreatedAt time.Time `gorm:"index" json:"created_at"`
	UpdatedAt time.Time `gorm:"index" json:"updated_at"`
}
