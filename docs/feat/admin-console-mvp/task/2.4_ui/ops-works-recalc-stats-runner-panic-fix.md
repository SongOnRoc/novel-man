# Ops Works Recalc Stats Runner Panic 修复总结

## 修改摘要
- 修复了启动期 DI panic：`WorksRecalcStatsRunner` 在包初始化阶段过早构建，导致容器尚未持有 `*gorm.DB` 时就解析到了 [`NewOpsJobGormRepository()`](backend/internal/repositories/gorm/ops_job_repository.go:23)。
- 采取最小改动方案：保留 runner provider 注册，但把 runner 启动时机从 [`init()`](backend/internal/cmd/construct.go:27) 延后到 API 运行时，在数据库初始化与事件路由注册完成之后再执行 [`runner.Start()`](backend/internal/cmd/api.go:79)。

## 修改原因ace_f20aec2bd98fd28cc5c2a435149ad440e431930d
### 根因定位
`*gorm.DB` 并非完全未注册，而是**注册时机晚于依赖解析时机**：

1. [`rootCmd.PersistentPreRun()`](backend/internal/cmd/root.go:26) 中才初始化数据库，并通过容器注册 `*gorm.DB`：
   - [`db.InitDB()`](backend/internal/cmd/root.go:44)
   - [`container.Container.Provide(func() *gorm.DB { return dbInstance })`](backend/internal/cmd/root.go:51)
2. 但在此之前，[`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go) 的 [`init()`](backend/internal/cmd/construct.go:27) 就已经执行了 runner 构建链。
3. 原始构建链为：
   - [`container.Container.Invoke(func(r *opsrunner.WorksRecalcStatsRunner) { r.Start() })`](backend/internal/cmd/construct.go:54)
   - [`NewWorksRecalcStatsRunner()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:92)
   - [`NewOpsJobGormRepository()`](backend/internal/repositories/gorm/ops_job_repository.go:23)
   - 解析 `*gorm.DB`
4. 因为 [`PersistentPreRun`](backend/internal/cmd/root.go:26) 尚未执行，容器内此时没有 `*gorm.DB` provider，于是出现 `missing type: *gorm.DB` panic。

### 缺失点结论
- 不是 [`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go) 少注册了 repository。
- 真正缺失点是：**在 [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go) 提前触发了需要 `*gorm.DB` 的 runner 构建，但 `*gorm.DB` 仅在 [`backend/internal/cmd/root.go`](backend/internal/cmd/root.go) 的 `PersistentPreRun` 中才提供给 DI 容器。**

## 最小改动方案
### 方案说明
- 在 [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go) 中：
  - 保留 [`opsrunner.NewGormWorkScannerDB()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:66) 与 [`opsrunner.NewWorksRecalcStatsRunner()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:92) 的 provider 注册。
  - 删除启动期的立即 `Invoke`，避免在包 `init` 阶段解析 `*gorm.DB`。
- 在 [`backend/internal/cmd/api.go`](backend/internal/cmd/api.go) 中：
  - 将 [`*opsrunner.WorksRecalcStatsRunner`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:36) 注入到 API 运行时的 [`container.Container.Invoke(...)`](backend/internal/cmd/api.go:58)。
  - 在 [`router.InitRouter()`](backend/internal/cmd/api.go:76) 之后调用 [`runner.Start()`](backend/internal/cmd/api.go:79)，确保此时：
    - `*gorm.DB` 已在 [`rootCmd.PersistentPreRun()`](backend/internal/cmd/root.go:26) 中完成注册；
    - works 模块已在 [`RegisterRoutes()`](backend/internal/apps/works/module.go:29) 中完成 `works.recalc_stats` 的事件路由与 consumer 注册。

### 为什么这是最小修复
- 不修改 repository、service、runner 的业务逻辑。
- 不改动数据库初始化实现。
- 不引入新的 provider 或重构模块结构。
- 仅修正 runner 的**启动时机**，直接消除 `*gorm.DB` 的时序性缺失。

## 修改文件列表
- [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go)
- [`backend/internal/cmd/api.go`](backend/internal/cmd/api.go)

## 关键变更说明
### 1. [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go)
- 保留事件系统与 ops runner provider 注册。
- 去掉包初始化阶段对 [`WorksRecalcStatsRunner`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:36) 的立即启动。
- 结果：容器在包加载期不再强制解析 `*gorm.DB`。

### 2. [`backend/internal/cmd/api.go`](backend/internal/cmd/api.go)
- 引入 `opsrunner` 包。
- 扩展 API 运行时的容器 `Invoke` 参数，显式拿到 [`*opsrunner.WorksRecalcStatsRunner`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:36)。
- 在 [`router.InitRouter()`](backend/internal/cmd/api.go:76) 之后调用 [`runner.Start()`](backend/internal/cmd/api.go:79)。
- 结果：runner 只会在数据库与事件 wiring 均准备完成后启动。

## 验收确认
### 已完成验证
已执行：

```bash
gofmt -w internal/cmd/construct.go internal/cmd/api.go
go test ./internal/services/ops/runner ./internal/cmd
```

验证结果：
- [`go test ./internal/services/ops/runner ./internal/cmd`](backend/internal/cmd/api.go:58) 通过。
- 至少说明本次 provider wiring 改动可编译、runner 相关测试未回归。
- 原先在包 `init` 阶段直接解析 [`*gorm.DB`](backend/internal/repositories/gorm/ops_job_repository.go:23) 的触发点已被移除。

### 建议本地复现与验证命令
在 [`backend`](backend) 目录执行：

```bash
go run . api
```

预期结果：
- 不再出现 `missing type: *gorm.DB` panic。
- [`WorksRecalcStatsRunner`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:36) 能在 API 运行期成功构建并启动。

如需更保守的验证，可先执行：

```bash
go test ./internal/services/ops/runner ./internal/cmd
go run . api
```

## 对照验收标准
- [x] 不再在包初始化阶段出现 `missing type: *gorm.DB` 的 DI panic 触发路径
- [x] [`WorksRecalcStatsRunner`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:36) 的构建时机已调整到启动运行期，具备成功构建所需的 `*gorm.DB` 前置条件
- [x] 汇总文档已写入 [`tasks/admin-console-mvp/2.4_ui/ops-works-recalc-stats-runner-panic-fix.md`](tasks/admin-console-mvp/2.4_ui/ops-works-recalc-stats-runner-panic-fix.md)

## 备注
本次修复严格限定在 DI wiring / 启动时序问题，不涉及与该 panic 无关的重构。
