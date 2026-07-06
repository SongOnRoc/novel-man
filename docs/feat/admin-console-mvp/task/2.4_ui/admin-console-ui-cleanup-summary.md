# Admin Console UI Cleanup Summary

## 修改摘要

本次针对 Admin Console 做了三轮整理：

1. 第一轮清理掉伪功能、说明性大段文案和无关壳层信息。
2. 第二轮基于实际页面反馈，修复 [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx) 与 [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx) 的真实字段展示问题，并重命名侧边栏导航标签。
3. 第三轮补齐作业队列真实管理能力：支持删除指定 job 与按当前筛选清理队列，并在前端提供入口。

核心结果：
- [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx) 不再错误依赖单一字段命名，能够兼容 `snake_case` / `camelCase` 映射并展示真实作业数据。
- [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx) 增加详情数据归一化，避免详情页因字段命名差异而出现空白。
- [`frontend/src/lib/config/admin-nav.ts`](frontend/src/lib/config/admin-nav.ts) 导航标签由技术化命名改为面向后台使用的中文命名，并调整顺序为“后台首页 → 作业队列 → 统计修复”。
- 作业队列新增“删除单条 / 清理队列（当前筛选）”真实管理能力入口。见 [`OpsJobsPage`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:157)。
- 前一轮已完成的减噪改动仍然保留：页面聚焦真实功能，不再塞入实施说明式文案。

## 修改文件列表

- [`frontend/src/app/(main)/admin/page.tsx`](frontend/src/app/(main)/admin/page.tsx)
- [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx)
- [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx)
- [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx)
- [`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx)
- [`frontend/src/components/admin/AdminSidebar.tsx`](frontend/src/components/admin/AdminSidebar.tsx)
- [`frontend/src/lib/config/admin-nav.ts`](frontend/src/lib/config/admin-nav.ts)
- [`backend/internal/controllers/ops/handler.go`](backend/internal/controllers/ops/handler.go)
- [`backend/internal/services/ops/ops_service.go`](backend/internal/services/ops/ops_service.go)
- [`backend/internal/repositories/gorm/ops_job_repository.go`](backend/internal/repositories/gorm/ops_job_repository.go)
- [`tasks/admin-console-mvp/2.4_ui/ops-jobs-queue-management.md`](tasks/admin-console-mvp/2.4_ui/ops-jobs-queue-management.md)

## 各页面删除内容与保留能力

### [`frontend/src/app/(main)/admin/page.tsx`](frontend/src/app/(main)/admin/page.tsx)

删除内容：
- 首页大面积“后台定位”说明卡。
- 独立认证、关键能力、运行方式等说明型卡片。
- 快速入口中的解释性补充文案。

保留能力：
- Admin 首页标题。
- 进入 [`/admin/ops-jobs`](frontend/src/app/(main)/admin/ops-jobs/page.tsx) 的入口。
- 进入 [`/admin/works-stats-repair`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx) 的入口。

### [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx)

删除内容：
- 右侧说明卡与设计理念型文案。
- 空态中的冗长解释。

新增/修正内容：
- 增加 [`normalizeOpsJob()`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:82) 归一化逻辑。
- 同时兼容 `job_id` / `jobId`、`job_type` / `jobType`、`progress_done` / `progressDone`、`updated_at` / `updatedAt` 等字段命名。
- 修正列表真实数据渲染，避免页面只显示 `succeeded` 而其他列大面积空白。

保留能力：
- `type` 筛选。
- `status` 筛选。
- 跳转到 [`/admin/works-stats-repair`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx) 创建修复任务。
- Jobs 列表展示：`job_id`、`type`、`status`、`progress`、`error_summary`、`updated_at`。
- 跳转到 Job 详情页。
- 分页浏览。

### [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx)

删除内容：
- 页面头部关于“完整执行视图”的说明性文案。
- 从详情页直接跳去创建修复任务的入口。
- 取消区域的提示性说明块。

新增/修正内容：
- 增加 [`normalizeOpsJobDetail()`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:95) 归一化逻辑。
- 同时兼容详情接口中的 `snake_case` / `camelCase` 字段。
- 修正状态、进度、trace、lease、时间、错误、取消信息的真实数据读取。
- 修正取消能力判断，从旧字段访问切换到归一化后的 [`cancelRequestedAt`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:213)。

保留能力：
- 返回列表。
- 刷新当前 Job。
- 查看状态与执行进度。
- 查看 Trace、Lease、时间信息。
- 查看元数据、错误摘要、错误详情、参数。
- 提交取消请求。

### [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx)

删除内容：
- 引用后端实现细节的说明文字。
- “Execution Tips” 说明面板。
- 冗长的执行链路讲解。

保留能力：
- 模式选择：`all` / `work_id` / `predicate`。
- `work_id` 输入。
- `predicate` JSON 输入与校验。
- `dry_run` 开关。
- 提交创建修复任务。
- 返回 Jobs 列表。
- 请求体预览。

### [`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx)

删除内容：
- 顶部大段后台说明文案。
- 壳层中的介绍卡、状态卡、导航说明卡。

保留能力：
- Admin 会话状态徽标。
- 移动端菜单按钮。
- 退出管理后台按钮。
- 鉴权与登录跳转逻辑。
- 页面内容容器。

### [`frontend/src/components/admin/AdminSidebar.tsx`](frontend/src/components/admin/AdminSidebar.tsx)

删除内容：
- `Ops · Repair · Monitoring` 副标题。
- 底部说明块。

保留能力：
- Sidebar 标题。
- 导航分组与链接。
- 当前激活态。
- 独立认证域标识。

### [`frontend/src/lib/config/admin-nav.ts`](frontend/src/lib/config/admin-nav.ts)

调整内容：
- `运维` → `作业管理`
- `Ops Jobs` → `作业队列`
- `Works Stats Repair` → `统计修复`
- `管理` → `总览`
- `管理后台首页` → `后台首页`

目标：
- 导航标签从实现术语改成后台实际使用语义，降低理解门槛。

## 最小验证方式

1. 进入 [`/admin/ops-jobs`](frontend/src/app/(main)/admin/ops-jobs/page.tsx)，确认作业列表不再只显示 `status`，其余列可以展示真实返回数据。
2. 进入任一 [`/admin/ops-jobs/[jobId]`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx)，确认详情页可正常展示状态、进度、trace、时间、错误与取消相关字段。
3. 查看侧边栏，确认导航文案与顺序已变更为“后台首页 → 作业队列 → 统计修复”。
4. 进入 [`/admin/works-stats-repair`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx)，确认前一轮精简后的表单功能仍可使用。
5. 在 [`/admin/ops-jobs`](frontend/src/app/(main)/admin/ops-jobs/page.tsx)，确认：
   - 可对单条 job 执行删除（行内“删除”→ 二次确认）。
   - 可按当前筛选条件执行清理（“清理队列（当前筛选）”→ 二次确认）。
6. 创建后即时可见验证：
   - 在 [`/admin/works-stats-repair`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx) 创建作业后，应立即跳转回 [`/admin/ops-jobs`](frontend/src/app/(main)/admin/ops-jobs/page.tsx) 并在列表顶部显示该 job（不必等待轮询）。
   - 该 job 的进度条随后会随接口返回的 `progress_*` 字段推进。
7. 进度条动态刷新验证：
   - 进入任一 running 的 [`/admin/ops-jobs/[jobId]`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx)，确认进度条会在无需手动刷新下自动推进（running 时 2s 轮询）。
   - 在 [`/admin/ops-jobs`](frontend/src/app/(main)/admin/ops-jobs/page.tsx) 列表页，确认 running 任务的进度条会以低频自动更新（4s 轻量轮询），且对 `created_job_id` 会额外拉取详情用于乐观插入。
8. 最小类型验证已尝试执行 [`pnpm --dir frontend exec tsc --noEmit --pretty false "src/app/(main)/admin/ops-jobs/page.tsx" "src/app/(main)/admin/ops-jobs/[jobId]/page.tsx"`](frontend/package.json)，但该命令在当前仓库环境下会触发 Next/TypeScript 配置级问题（如 JSX 编译上下文、模块解析、Next 内部类型依赖），不能作为本次页面局部改动的有效通过性依据；不过本次针对页面代码的直接类型问题已逐步修正到不再出现先前的隐式 `any` 与字段名不匹配报错方向。
