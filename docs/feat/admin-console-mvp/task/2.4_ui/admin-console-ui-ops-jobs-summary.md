# Milestone 1 — Admin Console UI（Ops Jobs + Works Stats Repair）实现汇总/交付说明

> 目标受众：维护者 / 评审
>
> 期望影响：读者能快速理解本次 Milestone 1 交付了什么、为什么这么做、当前验证状态如何、以及如何本地复核。

---

## 1. 里程碑范围（Milestone 1）

本里程碑当前交付了三层能力：

- 独立的 Admin Console UI：
  - Ops Jobs 列表页：分页 + type/status 过滤 + progress/status/error_summary 展示
  - Ops Job 详情页：字段展示 + cancel request
  - Works Stats Repair：创建 `works.recalc_stats` 后台任务
- 独立的 Admin 认证入口：
  - 独立的管理后台登录页
  - 独立的 admin token / admin session 存储
  - `/admin/*` 不再复用普通用户 [`/dashboard`](frontend/src/app/(main)/dashboard/page.tsx:1) 的会话与角色判定
- 管理后台 UI/UX 升级：
  - AdminShell / Sidebar / 首页视觉重构
  - 登录页双栏信息布局与更明确的后台身份提示
  - Ops Jobs 列表页、Job 详情页、Works Stats Repair 页卡片化与状态优先化

相关前端路由：

- [`frontend/src/app/(main)/admin/page.tsx`](frontend/src/app/(main)/admin/page.tsx:1)
- [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:1)
- [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:1)
- [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx:1)
- [`frontend/src/app/admin/login/page.tsx`](frontend/src/app/admin/login/page.tsx:1)
- [`frontend/src/app/admin/layout.tsx`](frontend/src/app/admin/layout.tsx:1)

---

## 2. 强约束与实现原则

### 2.1 `swagger -> api-gen` 仍是主链路

本任务最初的 Ops UI 仍然遵循：

- 后端 swagger 导出：`swag init --v3.1` 更新 [`backend/docs/swagger.json`](backend/docs/swagger.json:1)
- 前端 API client 生成：`pnpm api-gen` 更新 [`frontend/src/lib/api/generated/ops/ops.ts`](frontend/src/lib/api/generated/ops/ops.ts:1)
- 相关 schema：[`frontend/src/lib/api/generated/api10.schemas.ts`](frontend/src/lib/api/generated/api10.schemas.ts:1)

> 说明：后续新增的独立 admin auth 接口（`/auth/admin/login`、`/auth/admin/me`）已经先在后端代码落地，但**尚未重新执行** swagger / api-gen，因此当前前端 admin 登录服务使用的是直接 `fetch` 到 [`/api/proxy`](frontend/src/app/api/proxy/[...path]/route.ts:1) 的方式，而不是新增的 Orval 生成函数。

### 2.2 管理后台 UI 必须完全独立

被明确否决的方案：

- 将管理后台入口塞入普通用户导航（例如 [`frontend/src/lib/config/nav.ts`](frontend/src/lib/config/nav.ts:1)）
- 在普通用户 Sidebar / UserNav 中根据 role 做管理入口分流（例如 [`frontend/src/components/common/layout/sider/Sidebar.tsx`](frontend/src/components/common/layout/sider/Sidebar.tsx:1)）

最终方案：

- `/admin/*` 使用独立的 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:1) + [`AdminSidebar`](frontend/src/components/admin/AdminSidebar.tsx:1) + [`admin-nav`](frontend/src/lib/config/admin-nav.ts:1)
- 在 [`frontend/src/app/(main)/layout.tsx`](frontend/src/app/(main)/layout.tsx:1) 中基于 pathname 分流：
  - `/admin/*` → 独立 AdminShell
  - 其它主站路由 → 原 [`MainLayoutGuard`](frontend/src/components/common/layout/MainLayoutGuard.tsx:1)

### 2.3 管理后台认证必须与普通用户系统分离

这次落地的关键决策是：

- `/admin/*` 不再依赖 [`NextAuth`](frontend/src/lib/auth.ts:102)
- `/admin/*` 不再依赖普通用户 [`useAuth()`](frontend/src/hooks/auth/useAuth.ts:23) / [`useUserQuery()`](frontend/src/hooks/auth/useUserQuery.ts:14)
- `/ops/*` 后端路由不再读取普通用户上下文里的 `userID/role`，而是读取独立的 `adminID/adminRole`
- 代理层 [`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts:1) 对 admin 路径不再回退到普通用户 session

---

## 3. 实现清单（页面 / 组件 / 配置 / 认证）

### 3.1 Admin 首页

文件：[`frontend/src/app/(main)/admin/page.tsx`](frontend/src/app/(main)/admin/page.tsx:1)

- 作用：Admin Console landing，提供到 Ops Jobs / Works Stats Repair 的入口链接
- 已升级为：
  - Hero 区 + 快速入口卡片
  - 身份域说明 / Ops 定位说明
  - 更明确的信息层级与视觉分区

### 3.2 Ops Jobs 列表页

文件：[`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:1)

- 列表：调用生成的 Ops hooks 拉取 jobs
- 过滤：type/status
- 分页：page/limit
- 展示：job_id、job_type、status、progress、error_summary、updated_at
- 点击条目进入详情页
- 已升级为：
  - 筛选区与操作区分栏
  - 进度条可视化
  - 错误摘要前置展示
  - 空态与数量信息增强

依赖：[`useGetOpsJobs()`](frontend/src/lib/api/generated/ops/ops.ts:96)

### 3.3 Ops Job 详情页

文件：[`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:1)

- 拉取单个 job 详情
- 当 status=`running` 时自动轮询刷新
- 支持 cancel request，并在提交后 toast + refetch
- 已升级为：
  - 顶部概览卡片
  - Timeline / Metadata / Actions 分区
  - 进度与 lease 信息前置
  - 取消请求操作上下文更明确

依赖：

- [`useGetOpsJobsJobId()`](frontend/src/lib/api/generated/ops/ops.ts:379)
- [`usePostOpsJobsJobIdCancel()`](frontend/src/lib/api/generated/ops/ops.ts:588)

### 3.4 Works Stats Repair 表单页

文件：[`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx:1)

- 表单字段：`mode`、`work_id`、`predicate JSON`、`dry_run`
- 提交后创建 `works.recalc_stats` 任务
- 成功后跳转到 job 详情或 jobs 列表
- 已升级为：
  - 修复配置卡片 + 侧栏执行建议
  - payload preview 卡片化展示
  - 模式选择、dry-run、风险提示更清晰

依赖：[`usePostOpsJobsWorksRecalcStats()`](frontend/src/lib/api/generated/ops/ops.ts:279)

### 3.5 独立 Admin 登录页与前端 Admin Session

新增文件：

- [`frontend/src/app/admin/login/page.tsx`](frontend/src/app/admin/login/page.tsx:1)
- [`frontend/src/app/admin/layout.tsx`](frontend/src/app/admin/layout.tsx:1)
- [`frontend/src/lib/admin-auth.ts`](frontend/src/lib/admin-auth.ts:1)
- [`frontend/src/lib/services/admin-auth.service.ts`](frontend/src/lib/services/admin-auth.service.ts:1)
- [`frontend/src/hooks/auth/useAdminAuth.ts`](frontend/src/hooks/auth/useAdminAuth.ts:1)

职责：

- `/admin/login` 提供独立管理员登录表单
- [`admin-auth.service.ts`](frontend/src/lib/services/admin-auth.service.ts:1) 调用 `/api/proxy/auth/admin/login` 与 `/api/proxy/auth/admin/me`
- [`admin-auth.ts`](frontend/src/lib/admin-auth.ts:1) 负责 admin access token / profile / session 的 `sessionStorage` 持久化
- [`useAdminAuth()`](frontend/src/hooks/auth/useAdminAuth.ts:1) 暴露独立 admin 会话状态与 login/logout 动作
- 登录页已升级为：
  - 双栏信息布局
  - “独立认证 / Admin Role / 高风险操作隔离”可视化说明
  - 更强的后台身份感与状态反馈

### 3.6 独立 Admin Shell 守卫

文件：[`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx:1)

当前职责：

- 启动时从 [`getStoredAdminSession()`](frontend/src/lib/admin-auth.ts:92) 恢复 admin session
- 未登录且访问 `/admin/*` 时跳转到 [`/admin/login`](frontend/src/app/admin/login/page.tsx:1)
- 已登录时渲染独立 admin shell
- 点击“退出管理后台”只清理 admin session，不影响普通用户 NextAuth 会话
- 已升级为：
  - 顶部工作区说明条
  - Session 状态卡片
  - 后台能力概览卡片
  - 视觉上更像真实运维控制台，而非普通 CRUD 页面

---

## 4. 接口映射（UI → API）

| UI / Shell | 交互 | 接口 | 说明 |
|---|---|---|---|
| `/admin/login` | 管理员登录 | `POST /auth/admin/login` | 独立 admin 登录契约 |
| `/admin/login` | 拉取当前管理员信息 | `GET /auth/admin/me` | 用于建立/恢复 admin session |
| `/admin/ops-jobs` | 获取作业列表 | `GET /ops/jobs` | 独立 admin Bearer 鉴权 |
| `/admin/ops-jobs/[jobId]` | 获取作业详情 | `GET /ops/jobs/{job_id}` | 独立 admin Bearer 鉴权 |
| `/admin/ops-jobs/[jobId]` | 请求取消作业 | `POST /ops/jobs/{job_id}/cancel` | 独立 admin Bearer 鉴权 |
| `/admin/works-stats-repair` | 创建 stats repair job | `POST /ops/jobs/works/recalc-stats` | 独立 admin Bearer 鉴权 |

---

## 5. 后端分离认证实现摘要

### 5.1 Auth Service 契约扩展

修改：[`backend/internal/contracts/auth/service.go`](backend/internal/contracts/auth/service.go:1)

新增：

- `TokenKindUser`
- `TokenKindAdmin`
- `ErrAdminAccessDenied`
- `AdminLogin()`
- `GetCurrentAdmin()`

### 5.2 Auth Service 实现扩展

修改：[`backend/internal/services/auth/auth_service.go`](backend/internal/services/auth/auth_service.go:1)

新增能力：

- 普通用户 token 与 admin token 分开生成
- admin claims 包含 `admin_id`、`admin_role`、`token_kind=admin`
- `AdminLogin()` 仅允许 `admin/operator` 角色
- `GetCurrentAdmin()` 回库再次校验管理员身份

### 5.3 独立 Admin Middleware

修改：[`backend/internal/middlewares/auth/auth.go`](backend/internal/middlewares/auth/auth.go:1)

新增：

- [`AdminAuthMiddlewareName`](backend/internal/middlewares/auth/auth.go:24)
- [`AdminJWTClaims`](backend/internal/middlewares/auth/auth.go:43)
- [`AdminAuthMiddleware`](backend/internal/middlewares/auth/auth.go:57)
- 对 admin token 强制要求 `token_kind=admin`
- 成功后向上下文写入 `adminID`、`adminRole`

### 5.4 独立 Admin Auth 路由

修改：[`backend/internal/controllers/auth/handler.go`](backend/internal/controllers/auth/handler.go:1)、[`backend/internal/apps/auth/module.go`](backend/internal/apps/auth/module.go:1)

新增接口：

- `POST /auth/admin/login`
- `GET /auth/admin/me`

### 5.5 Ops 路由切换到 Admin Context

修改：[`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go:1)、[`backend/internal/controllers/ops/handler.go`](backend/internal/controllers/ops/handler.go:1)

变化：

- `/ops/*` 由普通 [`AuthMiddleware`](backend/internal/middlewares/auth/auth.go:51) 切换到 [`AdminAuthMiddleware`](backend/internal/middlewares/auth/auth.go:57)
- role 校验改为读取 `adminRole`
- create/cancel 等接口的审计发起人改为读取 `adminID`

### 5.6 默认后台管理员引导配置

新增能力：

- 后端配置结构扩展：[`backend/internal/config/config.go`](backend/internal/config/config.go:22)
- 示例配置：[`backend/config.example.yaml`](backend/config.example.yaml:1)
- 当前实际配置：[`backend/config.yaml`](backend/config.yaml)
- 启动引导逻辑：[`backend/internal/cmd/root.go`](backend/internal/cmd/root.go:90)

当前支持：

- `admin.enabled`
- `admin.username`
- `admin.email`
- `admin.password`
- `admin.reset_password_on_boot`

行为：

- 服务启动后，在数据库迁移完成后自动执行 bootstrap admin 检查
- 若用户不存在，则自动创建 `role=admin` 的后台管理员
- 若用户已存在，则同步用户名 / 邮箱 / role，并按 `reset_password_on_boot` 决定是否覆盖密码

当前默认配置（已写入本地 [`backend/config.yaml`](backend/config.yaml)）：

- 用户名：`admin`
- 邮箱：`admin@example.com`
- 密码：`Admin@123456`
- `reset_password_on_boot=false`

---

## 6. 前端独立认证实现摘要

### 6.1 代理层隔离

修改：[`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts:1)

- 将 `/auth/admin/login` 加入公开白名单
- `/ops/*` 仍然只接受显式 Bearer，不回退到普通用户 session
- admin 登录页可以经 `/api/proxy/auth/admin/login` 直达后端 admin 登录接口

### 6.2 HTTP 客户端隔离

修改：[`frontend/src/lib/fetch.ts`](frontend/src/lib/fetch.ts:1)

- admin 路径统一由 [`isAdminApiPath()`](frontend/src/lib/admin-auth.ts:16) 判定
- admin 请求从 [`getStoredAdminAccessToken()`](frontend/src/lib/admin-auth.ts:31) 注入 Bearer
- admin 请求发生 401 时，只清理 admin session 并跳转 [`/admin/login`](frontend/src/app/admin/login/page.tsx:1)
- 普通用户请求仍沿用 NextAuth 的 `signOut -> /login`

### 6.3 `AdminShell` 已从“手填 token”升级为“独立 admin session 守卫”

文件：[`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx:1)

- 旧逻辑：手工输入 token
- 新逻辑：读取存储的 admin session；无会话则跳 `/admin/login`
- 退出时仅清理 admin session，不跳普通用户 `/dashboard`

---

## 7. 文件改动列表

### 7.1 新增文件

前端：

- [`frontend/src/app/admin/layout.tsx`](frontend/src/app/admin/layout.tsx:1)
- [`frontend/src/app/admin/login/page.tsx`](frontend/src/app/admin/login/page.tsx:1)
- [`frontend/src/lib/services/admin-auth.service.ts`](frontend/src/lib/services/admin-auth.service.ts:1)
- [`frontend/src/hooks/auth/useAdminAuth.ts`](frontend/src/hooks/auth/useAdminAuth.ts:1)

后端分析 / 修复总结：

- [`tasks/admin-console-mvp/2.4_ui/admin-login-gap-analysis.md`](tasks/admin-console-mvp/2.4_ui/admin-login-gap-analysis.md:1)
- [`tasks/admin-console-mvp/2.4_ui/admin-auth-minimal-design.md`](tasks/admin-console-mvp/2.4_ui/admin-auth-minimal-design.md:1)
- [`tasks/admin-console-mvp/2.4_ui/works-stats-repair-root-cause.md`](tasks/admin-console-mvp/2.4_ui/works-stats-repair-root-cause.md:1)
- [`tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md`](tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md:1)

### 7.2 修改文件

前端：

- [`frontend/src/lib/admin-auth.ts`](frontend/src/lib/admin-auth.ts:1)
- [`frontend/src/lib/fetch.ts`](frontend/src/lib/fetch.ts:1)
- [`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts:1)
- [`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx:1)
- [`frontend/src/components/admin/AdminSidebar.tsx`](frontend/src/components/admin/AdminSidebar.tsx:1)
- [`frontend/src/app/(main)/layout.tsx`](frontend/src/app/(main)/layout.tsx:1)
- [`frontend/src/app/(main)/admin/page.tsx`](frontend/src/app/(main)/admin/page.tsx:1)
- [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:1)
- [`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:1)
- [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx:1)

后端：

- [`backend/internal/contracts/auth/service.go`](backend/internal/contracts/auth/service.go:1)
- [`backend/internal/services/auth/auth_service.go`](backend/internal/services/auth/auth_service.go:1)
- [`backend/internal/middlewares/auth/auth.go`](backend/internal/middlewares/auth/auth.go:1)
- [`backend/internal/controllers/auth/handler.go`](backend/internal/controllers/auth/handler.go:1)
- [`backend/internal/apps/auth/module.go`](backend/internal/apps/auth/module.go:1)
- [`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go:1)
- [`backend/internal/controllers/ops/handler.go`](backend/internal/controllers/ops/handler.go:1)
- [`backend/internal/config/config.go`](backend/internal/config/config.go:22)
- [`backend/internal/cmd/root.go`](backend/internal/cmd/root.go:24)
- [`backend/config.example.yaml`](backend/config.example.yaml:1)
- [`backend/config.yaml`](backend/config.yaml)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:1)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner_test.go`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go:1)

---

## 8. 当前验证状态

### 8.1 后端

已执行定向 Go 校验：

- `go test ./internal/services/auth ./internal/middlewares/auth ./internal/controllers/auth ./internal/apps/auth ./internal/apps/ops ./internal/controllers/ops`
- `go test ./internal/config ./internal/services/auth ./internal/middlewares/auth ./internal/controllers/auth ./internal/apps/auth ./internal/apps/ops ./internal/controllers/ops ./internal/cmd`
- `go test ./internal/cmd`
- 子任务修复验证：`go test ./internal/services/ops/runner ./internal/repositories/gorm ./internal/services/ops -v`

结果：通过。

### 8.2 前端

已执行定向 ESLint：

- `pnpm exec eslint "src/app/admin/login/page.tsx" "src/app/admin/layout.tsx" "src/components/admin/AdminShell.tsx" "src/lib/admin-auth.ts" "src/lib/services/admin-auth.service.ts" "src/hooks/auth/useAdminAuth.ts" "src/lib/fetch.ts" "src/app/api/proxy/[...path]/route.ts"`
- `pnpm exec eslint "src/components/admin/AdminShell.tsx" "src/components/admin/AdminSidebar.tsx" "src/app/(main)/admin/page.tsx" "src/app/(main)/admin/ops-jobs/page.tsx" "src/app/(main)/admin/ops-jobs/[jobId]/page.tsx" "src/app/(main)/admin/works-stats-repair/page.tsx" "src/app/admin/login/page.tsx"`

结果：0 error，仅剩既有 warnings（主要在 [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:1)、[`frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/[jobId]/page.tsx:1)、[`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx:1) 的 `any` 告警，以及基础 fetch/proxy 的既有 warnings）。

### 8.3 仍未完成的验证

- 未执行 repo 全量 `pnpm lint`
- 未执行全量 `pnpm build`
- 未做完整浏览器级 UI walkthrough（升级后的视觉/交互回归）

---

## 9. 手动验证步骤（建议）

1. 未登录访问 [`/admin`](frontend/src/app/(main)/admin/page.tsx:1)
   - 预期：跳转到 [`/admin/login`](frontend/src/app/admin/login/page.tsx:1)
2. 使用后台管理员账号登录 [`/admin/login`](frontend/src/app/admin/login/page.tsx:1)
   - 预期：写入独立 admin session，进入 `/admin`
3. 访问：
   - `/admin/ops-jobs`
   - `/admin/ops-jobs/{jobId}`
   - `/admin/works-stats-repair`
4. 点击“退出管理后台”
   - 预期：仅清理 admin session，跳回 [`/admin/login`](frontend/src/app/admin/login/page.tsx:1)
5. 普通用户 [`/login`](frontend/src/app/(auth)/login/page.tsx:1) / [`/dashboard`](frontend/src/app/(main)/dashboard/page.tsx:1) 不应受到 admin 登录 / 登出的联动影响
6. UI/UX 重点检查：
   - 首页是否呈现 Hero + 快速入口 + 能力说明
   - Shell 是否呈现工作区信息与后台状态卡片
   - 列表页是否更强调错误摘要与进度
   - 详情页与 Repair 页是否具备更清晰的操作上下文与风险提示

---

## 10. `works.recalc_stats` 问题排查与修复结论

本轮还单独排查了一个与 Admin UI 独立的后端问题：

- 用户反馈：执行 `works.recalc_stats` 后，作品列表中的 `total_word_count / total_chapter_count` 仍保留历史 mock 值，没有按真实章节数据更新
- 子任务排查文档：[`tasks/admin-console-mvp/2.4_ui/works-stats-repair-root-cause.md`](tasks/admin-console-mvp/2.4_ui/works-stats-repair-root-cause.md:1)
- 修复总结文档：[`tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md`](tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md:1)

关键结论：

- 真正问题不在 [`HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68) 的统计计算逻辑
- 根因在 [`works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:1) 的 runner 默认参数初始化时机：`tick()` 直接执行路径下默认 lease / identity 未初始化，导致 lease 生命周期异常，job 无法稳定 finalize
- 已修复：抽出 `ensureDefaults()` 并在 `tick()` 前强制初始化，保证 runner 在直接执行路径下也能完成作业扫描、进度刷新与 works 表统计写回
- 已验证：works 表统计字段会从历史值覆盖为真实章节汇总值（见子任务测试与文档）

---

## 11. 关键实现原因（Why）

### 11.1 为什么后端也要分离

如果只在前端做独立页面，但后端继续复用普通 [`/auth/login`](backend/internal/apps/auth/module.go:35)，那么本质仍是一套身份域，只是入口不同；这与“管理后台是两套系统”的目标不一致。

### 11.2 为什么 `/ops/*` 必须切到 admin context

只要 `/ops/*` 继续读取普通 `userID/role`，管理后台就仍然是“普通用户 token + 更高权限页面”的变体。切换到 `adminID/adminRole` 后，`/ops/*` 才真正成为独立的 admin 能力域。

### 11.3 为什么代理层不能回退到普通用户 session

只要 [`/api/proxy`](frontend/src/app/api/proxy/[...path]/route.ts:1) 对 admin 请求还会回退到 [`NextAuth`](frontend/src/lib/auth.ts:102) session，那么 `/admin/*` 仍然可能被普通用户登录链路隐式接管。当前实现已经阻断这条回退路径。

### 11.4 为什么要做 UI/UX 升级

管理后台面向的是高风险、低容错的操作场景。若页面仅停留在“能用”的基础 CRUD 风格，会导致：

- 重要状态（running/failed/cancel requested）不够突出
- 错误摘要与风险说明埋得太深
- 切换页面时上下文信息不足
- 登录与后台身份边界感不足

因此本次把“状态优先、错误优先、操作上下文优先”作为后台 UI 的核心设计原则。

---

## 12. Reader Test（零上下文阅读者自测）

以“零上下文读者”视角检查后，本文档已补齐以下容易遗漏的信息：

- 管理后台不仅是 UI 分离，还包括认证域分离与默认管理员引导配置
- 后端新增了哪些接口、中间件、启动期 bootstrap 行为
- 前端为什么新增 `/admin/login`，以及为什么 `/admin/*` 不再回退 `/login` / `/dashboard`
- UI/UX 升级不是表面美化，而是为了突出状态、错误和高风险操作上下文
- `works.recalc_stats` 的真实问题与主线 UI/认证问题是两条独立链路，并且已给出单独文档闭环

当前文档已能支持接手者快速回答这些问题：

1. 现在 `/admin` 和 `/dashboard` 的登录链路如何分离？
2. 默认管理员账号是如何被引导创建的？
3. 后台 UI 到底升级了哪些地方？
4. `works.recalc_stats` 为什么之前没更新真实统计，现在又是怎么修的？
5. 如果要继续做全量 lint/build、api-gen 或后续前端美化，应该从哪里接手？

---

## 13. 附录：相关实现入口

- 普通用户登录基线：[`frontend/src/lib/auth.ts`](frontend/src/lib/auth.ts:102)
- 独立 admin session：[`frontend/src/lib/admin-auth.ts`](frontend/src/lib/admin-auth.ts:1)
- 独立 admin 登录页：[`frontend/src/app/admin/login/page.tsx`](frontend/src/app/admin/login/page.tsx:1)
- 独立 admin shell：[`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx:1)
- 独立 admin sidebar：[`frontend/src/components/admin/AdminSidebar.tsx`](frontend/src/components/admin/AdminSidebar.tsx:1)
- proxy 认证分流：[`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts:1)
- admin auth contract：[`backend/internal/contracts/auth/service.go`](backend/internal/contracts/auth/service.go:1)
- admin auth service：[`backend/internal/services/auth/auth_service.go`](backend/internal/services/auth/auth_service.go:1)
- admin middleware：[`backend/internal/middlewares/auth/auth.go`](backend/internal/middlewares/auth/auth.go:1)
- admin auth routes：[`backend/internal/apps/auth/module.go`](backend/internal/apps/auth/module.go:1)
- admin bootstrap config：[`backend/internal/config/config.go`](backend/internal/config/config.go:22)
- admin bootstrap runtime：[`backend/internal/cmd/root.go`](backend/internal/cmd/root.go:24)
- ops route admin context：[`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go:1)
- ops controller：admin 审计 ID 读取：[`backend/internal/controllers/ops/handler.go`](backend/internal/controllers/ops/handler.go:44)
- works stats fix summary：[`tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md`](tasks/admin-console-mvp/2.4_ui/works-stats-repair-fix-summary.md:1)
