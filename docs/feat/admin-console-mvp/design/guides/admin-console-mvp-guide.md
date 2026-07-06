# 管理后台（Admin Console）MVP 指导文档（面向集群/分布式部署）

> 目标：为“数据治理/修复（一次性 backfill）+ 运维能力”提供**可控入口**，并逐步演进为可视化管理后台。
>
> 本文档不包含具体实现代码改动；用于指导后续实现与验收。

---

## 1. 背景与问题定义

### 1.1 为什么必须建设管理后台

当前系统存在“派生字段 + 事件驱动写回”的架构：

- 作品统计字段（如 `works.total_word_count` / `works.total_chapter_count`）是派生数据。
- 章节变更后，works 统计可能通过事件消费侧重算写回：[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68)
- 读接口（作品列表/详情）仅从 DB 返回，不做读时重算：[`WorkController.ListWorks()`](backend/internal/controllers/works/handler.go:328) / [`WorkController.GetWork()`](backend/internal/controllers/works/handler.go:179)

因此，一旦历史数据（例如 mock 直接写库）在统计字段上“脏”，且后续没有触发章节事件，就不会自愈。

同时，集群/分布式部署环境下，任何“一次性修复”都必须具备：

- **全局只执行一次**（或具备幂等可重入）
- **可观测**（进度/失败/重试/DLQ）
- **可授权**（管理员/运维权限边界）

没有管理后台（或管理面 API + Job 系统）会导致：修复路径只能“绑启动链路/绑业务逻辑/靠人工 SQL”，风险不可控。

### 1.2 当前代码中已存在的“隐式管理面”信号

- settings 列表接口已经存在一个临时的 admin 判定（`userID == 1`）：[`SettingController.ListSettings()`](backend/internal/controllers/settings/handler.go:239)

这说明：项目已经进入需要“管理权限/运维入口”的阶段，但目前缺少系统化方案。

---

## 2. 设计目标（MVP）

### 2.1 必须达成（MVP）

1. **提供管理面入口**：可触发作品统计重算（全量/按 work_id/按条件）。
2. **作业状态机**：支持查看作业状态与进度（running/succeeded/failed/canceled）。
3. **集群安全**：同一作业全局唯一，避免多实例并发触发导致 DB 被打满。
4. **安全与审计**：只有管理员/运维角色可触发；记录 `created_by` 与关键参数。
5. **限流与节流**：避免对 DB 造成尖峰压力（批处理 + 并发上限）。

### 2.2 暂不做（MVP 不强求）

- 完整 RBAC/多角色多策略（先做 admin/operator 两级）
- UI 上的实时日志流（先做摘要/计数/分页）
- 多租户隔离（如后续引入再扩展）

---

## 3. 总体架构建议（先管理面 API，再 UI）

### 3.1 两层拆分

- **管理面 API（Ops API）**：提供“创建作业/查询作业/取消作业”。
- **管理后台 UI**：调用管理面 API，展示作业与执行按钮。

这样做的好处：

- 即便 UI 未完成，也能通过 curl/脚本完成治理；
- UI 只是“消费能力”，不会让治理能力被 UI 阻塞。

### 3.2 作业执行引擎（复用现有事件/队列骨架）

你们已有 in-app 队列调度器能力：

- 事件路由为任务并入队：[`EventManager.Dispatch()`](backend/internal/events/manager.go:66)
- 队列具备去重/重试/DLQ/并发限制：[`QueueScheduler.Enqueue()`](backend/internal/events/scheduler.go:63)
- 模块并发可配置：[`applySchedulerConcurrency()`](backend/internal/cmd/events_runtime.go:26)

建议将“重算 works 统计”实现为一种 **ops job**：

- job 创建后，批量 enqueue “按 work_id 重算”任务
- 消费侧复用既有重算逻辑：[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68)

> 关键原则：不要再造第三套统计口径；统一使用重算逻辑，保证一致性。

---

## 4. 权限模型（MVP）

### 4.1 现状风险

当前 `userID == 1` 的方式只适用于开发期：

- 生产环境 userID 不稳定
- 无法审计
- 无法分层授权

### 4.2 建议（MVP）

- `role` 两级：`admin` / `operator`（至少 admin）
- Ops API 路由必须校验 `role in {admin, operator}`
- 审计字段：`created_by_user_id`、`created_by_username`（如有）、`trace_id`

---

## 5. 数据治理能力：作品统计重算（Backfill）

### 5.1 触发方式（MVP）

支持三种模式（建议都支持，难度递增）：

1. **按单个作品**：传 `work_id`
2. **按条件过滤**：如 `total_* = 0 且存在章节`（需要定义条件）
3. **全量重算**：扫描全部 works（分页/批处理）

### 5.2 集群安全：全局唯一执行

#### 方案：job 表 + 分布式锁（DB 协调）

建议创建一张 `ops_jobs`（或 `admin_jobs`）表：

- `job_id`（uuid）
- `job_type`（如 `works.recalc_stats`）
- `job_version`（可选：用于“只跑一次”的版本标记）
- `status`（running/succeeded/failed/canceled）
- `started_at` / `finished_at`
- `lease_expires_at`（避免 worker 异常退出导致永久占用）
- `created_by` / `params`（JSON）
- `progress_total` / `progress_done` / `progress_failed`

并通过 DB 的唯一约束实现“同类型作业在同一时间只能存在一个 running”：

- unique(job_type, status=running)（实现方式取决于 DB 能力；也可以用单独锁表）

> 这比“启动时全量回填”更可控；并且适用于多实例滚动更新。

### 5.3 节流策略（避免 DB 尖峰）

- works 扫描必须分页（例如每批 100/500）
- 每批 enqueue N 个 work_id 任务
- 通过模块并发限制控制消费速度：[`QueueScheduler.SetModuleConcurrencyLimit()`](backend/internal/events/scheduler.go:165)

> 可将 `events.ModuleWorks` 的并发限制设置为可配置项（已有配置框架）。

---

## 6. 管理面 API 设计（建议）

> 路由前缀建议 `/ops` 或 `/admin`，与业务 API 隔离。

### 6.1 创建作业

- `POST /ops/jobs/works/recalc-stats`

请求参数示例：

- `mode`: `all | work_id | predicate`
- `work_id`: number（mode=work_id 时必填）
- `predicate`: object（mode=predicate）
- `dry_run`: boolean（可选：只统计将处理的 work 数）

返回：`job_id`

### 6.2 查询作业

- `GET /ops/jobs/:job_id`
- `GET /ops/jobs?type=works.recalc_stats&status=running&page=1&limit=20`

返回：状态、进度、失败摘要、DLQ 数（如接入）。

### 6.3 取消作业（可选）

- `POST /ops/jobs/:job_id/cancel`

取消语义建议：

- 停止继续 enqueue 后续任务
- 已入队/已执行的不回滚（幂等重算型任务通常不需要回滚）

---

## 7. 管理后台 UI（MVP 页面）

建议先做 3 个页面（足够形成闭环）：

1. **Ops Jobs**：作业列表 + 详情（进度、失败摘要）
2. **Works Stats Repair**：创建“作品统计重算”作业（表单）
3. **Settings（可选）**：复用现有 settings 能力，但替换掉 `userID==1` 的临时 admin 判定

---

## 8. 与“启动时修复”的关系（建议定位）

在集群/分布式部署下：

- 不建议把“全量回填”直接塞入启动链路（启动链路已有迁移与 seed：[`rootCmd.PersistentPreRun`](backend/internal/cmd/root.go:21)、[`apiCmd`](backend/internal/cmd/api.go:27)）。
- 如果你仍想在“启动时”提供自动触发：
  - 启动时仅**尝试创建一个 job**（抢锁成功才创建）
  - 作业执行异步进行，不阻塞服务 ready

这样可以兼顾“自动化”与“可控治理”。

---

## 9. 里程碑与验收

### Milestone 0：只做 Ops API + Job（无 UI）

- [ ] 能创建 `works.recalc_stats` 作业
- [ ] 能查询 job 状态与进度
- [ ] 集群下并发创建不会重复执行（全局唯一）

### Milestone 1：补 UI（管理后台 MVP）

- [ ] jobs 列表/详情可视化
- [ ] “作品统计重算”表单可触发 job

### Milestone 2：权限与审计硬化

- [ ] role-based 权限（替代 `userID==1`）
- [ ] 审计记录（谁触发、参数、时间、结果）

---

## 10. 附录：关键代码参考点

- 作品统计重算消费逻辑：[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68)
- 事件路由到任务：[`EventManager.Dispatch()`](backend/internal/events/manager.go:66)
- 队列去重/重试/DLQ/并发：[`QueueScheduler`](backend/internal/events/scheduler.go:28)
- 现有临时 admin 判定示例：[`SettingController.ListSettings()`](backend/internal/controllers/settings/handler.go:239)
- 章节写入时增量更新 works 统计：[`ChapterController.updateWorkWordCount()`](backend/internal/controllers/chapters/handler.go:85)
