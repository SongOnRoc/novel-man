package ops

import (
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

const (
	// OpsRoleAdmin / OpsRoleOperator 是当前 MVP 的权限模型（见 docs/guides/admin-console-mvp-guide.md）。
	OpsRoleAdmin    = "admin"
	OpsRoleOperator = "operator"
)

type CreateWorksRecalcStatsJobMode string

const (
	CreateWorksRecalcStatsJobModeAll       CreateWorksRecalcStatsJobMode = "all"
	CreateWorksRecalcStatsJobModeWorkID    CreateWorksRecalcStatsJobMode = "work_id"
	CreateWorksRecalcStatsJobModePredicate CreateWorksRecalcStatsJobMode = "predicate"
)

// CreateWorksRecalcStatsJobRequest 对应指南中的：POST /ops/jobs/works/recalc-stats
// 参考：docs/guides/admin-console-mvp-guide.md
// - mode: all | work_id | predicate
// - work_id: mode=work_id 时必填
// - predicate: mode=predicate 时可选（MVP 可先透传/存档，不实现真正过滤）
// - dry_run: 可选
//
// 注意：predicate 用 map[string]any 保持跨 DB/跨前端客户端的兼容性，服务端只做审计存档。
// 真正的 predicate 执行可在 runner 阶段逐步实现。
//
// 约束：Gin validator 支持 oneof 标签，但对复杂条件的校验保持 MVP 轻量。
//
// noinspection GoUnusedType
// (上面的提示为 IDE 辅助，不影响编译)
//
// NOTE: 不要在 contracts 层引用 gin。
//
// (DTO 名称保持与指南一致)
//
//lint:ignore U1000 该 DTO 由 controller 绑定请求使用
//nolint:revive
//go:generate echo "contracts only"
type CreateWorksRecalcStatsJobRequest struct {
	Mode      CreateWorksRecalcStatsJobMode `json:"mode" binding:"required,oneof=all work_id predicate"`
	WorkID    *int64                        `json:"work_id,omitempty"`
	Predicate map[string]any                `json:"predicate,omitempty"`
	DryRun    bool                          `json:"dry_run"`
}

type RequestCancelJobRequest struct {
	Reason string `json:"reason"`
}

// OpsService 是 Ops API 的业务层契约。
//
// MVP 目标：支持创建/查询/取消（请求取消）作业。
// 作业执行（runner）在后续阶段实现。
type OpsService interface {
	CreateWorksRecalcStatsJob(ctx context.Context, createdByUserID uint, createdByUsername *string, traceID *string, req CreateWorksRecalcStatsJobRequest) (*models.OpsJob, error)
	GetJob(ctx context.Context, jobID string) (*models.OpsJob, error)
	ListJobs(ctx context.Context, page, limit int, jobType, status string) ([]models.OpsJob, int64, error)
	RequestCancel(ctx context.Context, jobID string, canceledByUserID uint, reason string) (bool, error)

	// DeleteJob 硬删除指定 job_id。
	// 注意：该接口用于管理后台“永久删除”，调用后 job 记录将从数据库物理移除。
	DeleteJob(ctx context.Context, jobID string) (bool, error)

	// ClearJobs 按筛选条件批量硬删除。
	// 约束：筛选条件包含分页参数（page/limit），即仅清理当前页范围内的记录。
	// 返回删除行数。
	ClearJobs(ctx context.Context, page, limit int, jobType, status string) (int64, error)
}
