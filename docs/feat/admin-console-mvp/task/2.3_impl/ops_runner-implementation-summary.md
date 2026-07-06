# Ops Runner 实现汇总：`works.recalc_stats`

> 对齐设计稿：[`tasks/admin-console-mvp/2.2_design/ops_runner-detailed-design.md`](tasks/admin-console-mvp/2.2_design/ops_runner-detailed-design.md:1)
> 
> 对齐落点方案：[`tasks/admin-console-mvp/2.2_design/ops_runner-implementation-placement.md`](tasks/admin-console-mvp/2.2_design/ops_runner-implementation-placement.md:1)

## 1. 修改摘要

本次实现新增了 `works.recalc_stats` 的 Ops Runner（进程内常驻 goroutine），用于扫描 `ops_jobs` 里 `running` 的 `works.recalc_stats` 作业并推进到终态：

- 扩展 `OpsJobGormRepository`：实现 runner 所需的 **scan running / steal lease / renew lease / progress 单调更新 / cancel ack / finalize / release**，所有写操作遵循设计稿要求的 lease where 保护。
- 新增 `events.EventTypeWorksRecalcStats`，并在 works module 注册 route 到 `events.ModuleWorks`，确保投递路径走 `EventManager.Dispatch()`。
- 新增 runner 实现：ticker 扫描、抢占 lease、分页扫描 works id、Dispatch 投递、queue full backoff、progress flush、cancel ack、finalize。
- DI 启动：在 `construct.go` Provide + Invoke runner，并对齐 `NotifierWorker` 的自启动模式。
- 最小测试：覆盖 repo 的 lease where 保护、runner Start 不 panic。

## 2. 修改原因 / 设计取舍

### 2.1 复用 works consumer
runner 投递到 `events.ModuleWorks`，由现有 consumer：[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68) 执行重算逻辑，避免产生第二套统计口径。

### 2.2 关键约束的落地

- **lease where**：除 scan 读取外，所有 `UPDATE ops_jobs` 都带 `job_id + status=running + lease_owner + lease_token`，并在续租/进度更新时附加 `lease_expires_at > now`。
- **cancel 两段式**：Ops API 只写 request（`cancel_requested_at`）；runner 读到 request 后调用 repo `AckCancel` 将状态推进到 `canceled` 并写入 `canceled_at/finished_at`。
- **progress 单调**：runner 仅做 `progress_done/progress_failed` 的 DB 原子自增（delta >= 0），并做批量 flush。
- **分页扫描 works**：按 `id asc`，使用 `WHERE id > after` 分页（避免全表加载）。
- **背压处理**：遇到 `queue is full`（来自 [`QueueScheduler.Enqueue()`](backend/internal/events/scheduler.go:63)）采用指数退避，避免忙等。

### 2.3 MVP 范围内的简化
- `predicate` mode 暂不执行过滤，仅审计存档（与 Ops API 设计一致）。
- `progress_total` 仅在可得时设置：`work_id` 模式为 1；`all` 模式为 works count；失败时不阻断执行。

## 3. 修改文件列表（完整路径）

- [`backend/internal/repositories/gorm/ops_job_repository.go`](backend/internal/repositories/gorm/ops_job_repository.go)
- [`backend/internal/events/contracts.go`](backend/internal/events/contracts.go)
- [`backend/internal/apps/works/module.go`](backend/internal/apps/works/module.go)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go)
- [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go)
- [`backend/internal/repositories/gorm/ops_job_repository_lease_test.go`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner_test.go`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go)

## 4. 关键实现说明（入口索引）

- repo lease where：[`(*OpsJobGormRepository).TryStealLease()`](backend/internal/repositories/gorm/ops_job_repository.go:1)、[`(*OpsJobGormRepository).RenewLease()`](backend/internal/repositories/gorm/ops_job_repository.go:1)、[`(*OpsJobGormRepository).UpdateProgressMonotonic()`](backend/internal/repositories/gorm/ops_job_repository.go:1)、[`(*OpsJobGormRepository).AckCancel()`](backend/internal/repositories/gorm/ops_job_repository.go:1)、[`(*OpsJobGormRepository).Finalize()`](backend/internal/repositories/gorm/ops_job_repository.go:1)
- event type + route：[`events.EventTypeWorksRecalcStats`](backend/internal/events/contracts.go:1)、[`worksModule.RegisterRoutes()`](backend/internal/apps/works/module.go:29)
- runner 主逻辑：[`runner.(*WorksRecalcStatsRunner).Start()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:1)、[`runner.(*WorksRecalcStatsRunner).processJob()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:1)
- DI wiring：[`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go:1)

> 注：以上索引行号以当前仓库为准；如需精确定位可直接在文件内搜索函数名。

## 5. 如何运行测试

在仓库根目录执行：

```bash
cd backend

go test ./...
```

（已包含：repo where 保护测试、runner 启动不 panic 测试）

## 6. 扩展性说明：后续新增其他 runner 怎么做？

当前实现是 **针对 `works.recalc_stats` 的专用 runner**，这是刻意的：

- MVP 阶段优先把关键约束（lease where / cancel 两段式 / 分页扫描 / Dispatch 投递）可靠落地，而不是一次性抽象出“大而全”的框架。
- 专用 runner 代码路径更短、更便于审计与测试（尤其是 lease where 的正确性）。

后续扩展到更多 ops job type，推荐两条路径（按复杂度递进）：

### 路径 A（最简单）：每种 job type 一个 runner 文件 + 各自扫描自己的 jobType

- 在同一目录下新增实现文件：[`backend/internal/services/ops/runner/`](backend/internal/services/ops/runner/)
- 每个 runner 只处理单一 `job_type`，scan 也只扫自己的 `job_type`。
- 在启动 wiring：[`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go:1) 里按现有方式 Provide + Invoke 新 runner。

优点：改动小、风险低；缺点：当 job type 多起来会有重复代码（lease/flush/backoff/scan 循环）。

### 路径 B（推荐的中长期）：抽取“通用引擎 + job 执行器”的结构

当新增第二个/第三个 ops job type 时，建议把公共逻辑抽为一个“引擎”，每个 job type 只实现自己的执行细节：

- **引擎负责**：ticker、scan running jobs、抢占/续租 lease、progress flush、cancel ack、finalize、背压退避。
- **执行器负责**：解析 params、分页产生目标（例如 work_id 列表）、构造并投递事件（仍走 [`EventManager.Dispatch()`](backend/internal/events/manager.go:66)）。

这样新增 job type 时主要改动是：

1) 在 `models` 增加新的 `job_type` 常量（如需要）。
2) 为该 job type 新增事件类型（如需要）并在对应 module 注册 routes（模式可参考 works 现有注册：[`backend/internal/apps/works/module.go`](backend/internal/apps/works/module.go:29)）。
3) 新增一个“执行器实现文件”，并在 `construct.go` 注入到引擎（让引擎按 job_type 分发）。

这条路径能让 ops runner 逐步演进为“多 job type 的通用 runner”，但建议在确实有第二个 job type 需求时再做抽象，避免过早复杂化。
