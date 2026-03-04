# Admin 独立登录缺口分析

## 1. 结论摘要

当前仓库已经把 [`/admin/*`](frontend/src/app/(main)/layout.tsx:20) 的页面壳与普通用户 [`/dashboard`](frontend/src/app/(main)/layout.tsx:25) 会话解耦，并且把 [`/ops/*`](backend/internal/apps/ops/module.go:42) 后端接口收口为“必须显式提供 Bearer Token”的独立鉴权路径；但这条 admin 链路目前**只有手动录入 token 的消费能力**，没有“Admin 自己登录并拿到 token、维持会话、刷新失效、退出登录”的完整流程。

因此，若要补齐“真正独立 Admin 登录流程”，现阶段最小可落地方案不是继续复用普通用户 [`NextAuth`](frontend/src/lib/auth.ts:102) 会话，而是新增一条**独立于用户端 session 的 Admin 认证子系统**：

- 前端：独立 Admin 登录页、独立 Admin session 状态管理、独立失效/退出处理
- 后端：独立 Admin 登录接口或明确的 admin 登录契约、独立 token 续期/退出策略、Admin 身份模型约束

---

## 2. 现状结构图

```mermaid
flowchart TD
    A[普通用户 /login] --> B[useAuth.login -> signIn credentials]
    B --> C[NextAuth authorize]
    C --> D[POST /auth/login]
    C --> E[GET /auth/me]
    E --> F[jwt/session 回调写入 NextAuth Session]
    F --> G[customFetch 从 session.accessToken 注入 Bearer]
    G --> H[/api/proxy 自动补 Authorization]
    H --> I[后端 auth middleware]

    J[/admin/* 页面] --> K[AdminShell 手动录入 Token]
    K --> L[sessionStorage 保存 admin token]
    L --> M[customFetch 命中 /ops/* 时直接注入该 Bearer]
    M --> N[/api/proxy 要求显式 Authorization]
    N --> O[后端 auth middleware]
    O --> P[ops role guard(admin/operator)]
```

---

## 3. 普通用户登录链路梳理

### 3.1 前端登录入口

普通用户登录页在 [`LoginPage()`](frontend/src/app/(auth)/login/page.tsx:34)，表单提交后调用 [`useAuth()`](frontend/src/hooks/auth/useAuth.ts:23) 暴露的 [`login()`](frontend/src/hooks/auth/useAuth.ts:26)。

链路如下：

1. 用户访问 [`frontend/src/app/(auth)/login/page.tsx`](frontend/src/app/(auth)/login/page.tsx)
2. [`onSubmit()`](frontend/src/app/(auth)/login/page.tsx:48) 调用 [`login()`](frontend/src/hooks/auth/useAuth.ts:26)
3. [`login()`](frontend/src/hooks/auth/useAuth.ts:26) 本质上调用 [`signIn("credentials")`](frontend/src/hooks/auth/useAuth.ts:27)
4. 登录成功后页面跳转 [`/dashboard`](frontend/src/app/(auth)/login/page.tsx:57)

关键文件：

- [`frontend/src/app/(auth)/login/page.tsx`](frontend/src/app/(auth)/login/page.tsx)
- [`useAuth()`](frontend/src/hooks/auth/useAuth.ts:23)
- [`frontend/src/lib/auth.ts`](frontend/src/lib/auth.ts)

### 3.2 会话建立：NextAuth Credentials -> 后端 auth API

普通用户会话的核心配置在 [`authOptions`](frontend/src/lib/auth.ts:102)。

#### 登录认证

在 [`authorize()`](frontend/src/lib/auth.ts:110) 中：

- 调用 [`loginService()`](frontend/src/lib/services/auth.service.ts:52)
- [`loginService()`](frontend/src/lib/services/auth.service.ts:52) 实际发起后端 [`POST /auth/login`](backend/internal/apps/auth/module.go:35)
- 成功后取得 `accessToken`，再直接请求 [`/auth/me`](frontend/src/lib/auth.ts:139)
- 将后端用户信息与 `accessToken` 组合后返回给 NextAuth

对应后端：

- 路由注册：[`authGroup.POST("/login", controller.Login)`](backend/internal/apps/auth/module.go:35)
- 控制器：[`AuthController.Login()`](backend/internal/controllers/auth/handler.go:101)
- 服务层：[`authService.Login()`](backend/internal/services/auth/auth_service.go:55)

#### JWT / Session 持久化

NextAuth 在：

- [`jwt()`](frontend/src/lib/auth.ts:210) 中把 `accessToken` 和 `user` 写入 token
- [`session()`](frontend/src/lib/auth.ts:227) 中把 token 映射到前端 session

Session 类型扩展在 [`frontend/src/types/next-auth.d.ts`](frontend/src/types/next-auth.d.ts:5)：

- [`Session.accessToken`](frontend/src/types/next-auth.d.ts:7)
- [`Session.user`](frontend/src/types/next-auth.d.ts:8)

结论：普通用户侧“token 存储”并不是手写 localStorage/sessionStorage，而是**存入 NextAuth 的 JWT/session 体系**。

### 3.3 受保护数据访问：session/token 注入

前端统一请求封装在 [`customFetch()`](frontend/src/lib/fetch.ts:64)。

对于非 admin 请求：

- 浏览器端如果没有显式 `Authorization`，会先调用 [`getSession()`](frontend/src/lib/fetch.ts:96)
- 若存在 [`session.accessToken`](frontend/src/lib/fetch.ts:97)，自动注入 [`Authorization: Bearer ...`](frontend/src/lib/fetch.ts:98)

这意味着普通用户所有业务请求默认依赖 NextAuth session，而不是单独管理 token。

### 3.4 代理注入：`/api/proxy` 如何补认证

代理入口在 [`handler()`](frontend/src/app/api/proxy/[...path]/route.ts:168)。

其认证逻辑分两层：

1. 先调用 [`ensureAuthorized()`](frontend/src/app/api/proxy/[...path]/route.ts:132)
2. 再在真正转发前根据 session/header 组装 Authorization

对于普通用户请求：

- 如果前端已经带 Bearer，则直接透传 [`Authorization`](frontend/src/app/api/proxy/[...path]/route.ts:192)
- 如果没带 Bearer，且不是 admin ops 路径，则代理会从 [`getServerSession(authOptions)`](frontend/src/app/api/proxy/[...path]/route.ts:184) 取 session
- 若 session 中有 token，则自动补上 [`Bearer ${session.accessToken}`](frontend/src/app/api/proxy/[...path]/route.ts:188)
- 未登录时 [`ensureAuthorized()`](frontend/src/app/api/proxy/[...path]/route.ts:157) 会直接返回 401

结论：普通用户的 SSR / Route Handler / 浏览器访问，都是围绕 NextAuth session 做统一注入。

### 3.5 后端认证接口与鉴权

后端 auth 模块定义在 [`backend/internal/apps/auth/module.go`](backend/internal/apps/auth/module.go:25)：

- 公开接口：[`POST /auth/register`](backend/internal/apps/auth/module.go:34)、[`POST /auth/login`](backend/internal/apps/auth/module.go:35)
- 需鉴权接口：[`GET /auth/me`](backend/internal/apps/auth/module.go:47)、[`POST /auth/logout`](backend/internal/apps/auth/module.go:48)

JWT 生成在 [`generateJWT()`](backend/internal/services/auth/auth_service.go:91)，claims 包含：

- `user_id`：[`auth_service.go`](backend/internal/services/auth/auth_service.go:97)
- `username`：[`auth_service.go`](backend/internal/services/auth/auth_service.go:99)
- `role`：[`auth_service.go`](backend/internal/services/auth/auth_service.go:100)
- `exp`：72 小时过期 [`auth_service.go`](backend/internal/services/auth/auth_service.go:101)

后端鉴权中间件为 [`AuthMiddleware.Handler()`](backend/internal/middlewares/auth/auth.go:55)：

- 从 Header 提取 Bearer：[`extractToken()`](backend/internal/middlewares/auth/auth.go:89)
- 校验 JWT：[`parseAndValidateToken()`](backend/internal/middlewares/auth/auth.go:104)
- 根据 `user_id` 回库取当前用户，重新确定 role：[`GetCurrentUser()`](backend/internal/middlewares/auth/auth.go:70)
- 写入上下文：[`c.Set("userID", ...)`](backend/internal/middlewares/auth/auth.go:82)、[`c.Set("role", ...)`](backend/internal/middlewares/auth/auth.go:83)

### 3.6 普通用户链路总结

普通用户链路已经完整具备：

- 登录页
- 登录接口
- session 建立
- token 注入
- 会话读取
- 统一 401 处理
- 登出入口

它是一条完整的“UI -> NextAuth -> 后端 `/auth/*` -> session -> 代理注入 -> 后端鉴权”的闭环。

---

## 4. 当前 `/admin/*` 独立 token 方案梳理

### 4.1 `/admin/*` 已与普通用户 UI 壳解耦

[`MainRouteLayout()`](frontend/src/app/(main)/layout.tsx:13) 里按 pathname 分流：

- [`/admin/*`](frontend/src/app/(main)/layout.tsx:20) 走 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:20)
- 其它主站路由走 [`MainLayoutGuard`](frontend/src/app/(main)/layout.tsx:26)

这说明 admin UI 已经不再复用普通用户的主布局守卫。

### 4.2 Admin token 从哪里来

当前 admin token **不是登录得到**，而是人工录入。

证据：

- [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:20) 顶部直接渲染 token 输入框 [`Input`](frontend/src/components/admin/AdminShell.tsx:123)
- 用户点击 [`handleSaveAdminToken()`](frontend/src/components/admin/AdminShell.tsx:55) 保存 token
- 保存逻辑使用 [`setStoredAdminAccessToken()`](frontend/src/lib/admin-auth.ts:21)
- token 持久化位置是浏览器 [`sessionStorage`](frontend/src/lib/admin-auth.ts:17)

[`frontend/src/lib/admin-auth.ts`](frontend/src/lib/admin-auth.ts:1) 的职责非常明确：

- 存储 key：[`ADMIN_ACCESS_TOKEN_STORAGE_KEY`](frontend/src/lib/admin-auth.ts:1)
- 路径判定：[`isAdminApiPath()`](frontend/src/lib/admin-auth.ts:3)
- 规范化 Bearer：[`normalizeAdminAccessToken()`](frontend/src/lib/admin-auth.ts:7)
- 从 [`sessionStorage`](frontend/src/lib/admin-auth.ts:17) 读取 token
- 写入 [`sessionStorage`](frontend/src/lib/admin-auth.ts:31)
- 清除 token：[`clearStoredAdminAccessToken()`](frontend/src/lib/admin-auth.ts:35)

这条链路里完全没有“账号密码 -> 登录接口 -> 返回 token”的过程。

### 4.3 Admin token 如何注入 `/ops/*`

admin 请求仍经由统一的 [`customFetch()`](frontend/src/lib/fetch.ts:64)，但分支逻辑不同。

当 URL 命中 [`isAdminApiPath()`](frontend/src/lib/fetch.ts:86) 时：

- 从 [`getStoredAdminAccessToken()`](frontend/src/lib/fetch.ts:91) 读取 token
- 若 token 存在，则直接写入 [`headers["Authorization"]`](frontend/src/lib/fetch.ts:93)
- 这一步不会调用 [`getSession()`](frontend/src/lib/fetch.ts:96)

因此，admin 请求与普通用户 session 的关键差异是：

- 普通用户：依赖 NextAuth session
- Admin：依赖 sessionStorage 里的手工 Bearer

### 4.4 `/api/proxy` 如何对待 admin ops 请求

[`ensureAuthorized()`](frontend/src/app/api/proxy/[...path]/route.ts:132) 对 admin 路径有特殊规则：

- 只要是 [`isAdminOpsPath()`](frontend/src/app/api/proxy/[...path]/route.ts:128) 命中的 `/ops/*`
- 若没有 Bearer，直接返回 401：[`"Admin Authorization header is required"`](frontend/src/app/api/proxy/[...path]/route.ts:151)
- 代理**不会**像普通用户那样自动回退到 NextAuth session

而在真正转发时：

- 代理先读原始请求头里的 [`Authorization`](frontend/src/app/api/proxy/[...path]/route.ts:186)
- 只有“非 admin ops 路径”才允许从 session 自动补 token：[`!isAdminOpsPath(path) && session?.accessToken`](frontend/src/app/api/proxy/[...path]/route.ts:188)

结论：`/api/proxy` 已经明确禁止 `/ops/*` 复用普通用户 session。

### 4.5 后端 `/ops/*` 当前接受什么凭证

后端 ops 模块在 [`opsGroup := router.Group("/ops")`](backend/internal/apps/ops/module.go:42) 注册，并挂载：

- [`authMiddleware`](backend/internal/apps/ops/module.go:47)
- [`requireOpsRole()`](backend/internal/apps/ops/module.go:48)

这意味着后端只认标准 Bearer JWT，然后再要求 role 属于：

- [`admin`](backend/internal/contracts/ops/service.go:10)
- [`operator`](backend/internal/contracts/ops/service.go:11)

role 校验在 [`requireOpsRole()`](backend/internal/apps/ops/module.go:71)，而 JWT/用户身份解析仍由通用 [`AuthMiddleware.Handler()`](backend/internal/middlewares/auth/auth.go:55) 完成。

因此，当前所谓“独立 admin token”并不是一套独立 token 格式，而是：

- 仍然使用后端通用 JWT 体系
- 但在前端消费层把它与普通用户 NextAuth session 分开
- 且要求该 JWT 对应用户具备 `admin/operator` 角色

### 4.6 为什么当前只有“手动 token”，没有登录页

因为现有 admin 侧代码只实现了“消费 token”，未实现“生成 token”的入口：

- 有 token 输入框：[`AdminShell`](frontend/src/components/admin/AdminShell.tsx:123)
- 有 token 存取工具：[`admin-auth.ts`](frontend/src/lib/admin-auth.ts:14)
- 有 `/ops/*` Bearer 注入逻辑：[`customFetch()`](frontend/src/lib/fetch.ts:86)
- 有代理强制 Bearer 校验：[`ensureAuthorized()`](frontend/src/app/api/proxy/[...path]/route.ts:146)

但缺少：

- 独立 admin 登录页面（仓库中未见 [`/admin/login`](frontend/src/app/(main)/admin/page.tsx:1) 或同类入口）
- Admin 登录专用 Hook / Service
- Admin 登录成功后的 session 建立机制
- Admin token 刷新或续期逻辑
- Admin 401 失效后的回跳登录逻辑

也就是说，当前 admin 链路的起点是“人已经在别处拿到了 token”，而不是“系统内完成登录”。

---

## 5. 两套链路的核心差异

| 维度 | 普通用户链路 | 当前 Admin 链路 |
| --- | --- | --- |
| 登录入口 | [`/login`](frontend/src/app/(auth)/login/page.tsx:34) | 无独立登录页 |
| 登录动作 | [`signIn("credentials")`](frontend/src/hooks/auth/useAuth.ts:27) | 手动粘贴 Bearer Token [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:123) |
| token 来源 | 后端 [`POST /auth/login`](backend/internal/apps/auth/module.go:35) | 外部人工提供 |
| 会话容器 | NextAuth JWT / Session [`authOptions`](frontend/src/lib/auth.ts:102) | 浏览器 [`sessionStorage`](frontend/src/lib/admin-auth.ts:17) |
| 请求注入 | [`getSession()`](frontend/src/lib/fetch.ts:96) 自动注入 | [`getStoredAdminAccessToken()`](frontend/src/lib/fetch.ts:91) 注入 |
| 代理兜底 | 可从 [`getServerSession()`](frontend/src/app/api/proxy/[...path]/route.ts:184) 自动补 token | 明确禁止兜底，必须显式 Bearer [`ensureAuthorized()`](frontend/src/app/api/proxy/[...path]/route.ts:146) |
| 401 处理 | 自动 [`signOut(.../login)`](frontend/src/lib/fetch.ts:148) | 无独立 admin 失效恢复 |
| 后端角色 | 任意合法用户 | 必须 `admin/operator` [`requireOpsRole()`](backend/internal/apps/ops/module.go:86) |

---

## 6. 独立 Admin 登录流程当前缺口清单

## 6.1 前端缺口

### 6.1.1 缺独立 Admin 登录页

当前没有独立的 admin 登录页面与路由，例如：

- 缺少类似 [`frontend/src/app/(auth)/login/page.tsx`](frontend/src/app/(auth)/login/page.tsx:34) 的 admin 版本
- 也没有 `/admin/login` 之类入口页

### 6.1.2 缺 Admin 登录表单提交链路

普通用户已有：

- [`useAuth().login`](frontend/src/hooks/auth/useAuth.ts:26)
- [`loginService()`](frontend/src/lib/services/auth.service.ts:52)
- [`CredentialsProvider.authorize()`](frontend/src/lib/auth.ts:110)

Admin 侧缺少对应的：

- `useAdminAuth()`
- `adminLoginService()`
- admin 登录成功后的统一状态写入

### 6.1.3 缺独立 Admin session 状态模型

当前 admin 只有一个裸 token 字符串保存在 [`sessionStorage`](frontend/src/lib/admin-auth.ts:17)。缺少：

- 当前 admin 身份信息（id / username / role）
- 初始化恢复逻辑（页面刷新后能否恢复 admin 身份，而非只知道 token 存在）
- “已登录 / 未登录 / 刷新中 / 失效”状态机
- 面向 React 的 provider/hook 抽象

### 6.1.4 缺 Admin 路由守卫与跳转规则

当前 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:146) 的守卫只是：

- 有 token 就放行
- 无 token 就显示提示文案 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:149)

这不是一个真正的登录守卫，缺少：

- 未登录自动跳转到 admin 登录页
- 登录成功后回跳目标 admin 页面
- token 失效后自动清理并跳转 admin 登录页

### 6.1.5 缺独立 401/403 UX 处理

[`customFetch()`](frontend/src/lib/fetch.ts:146) 对普通用户 401 会自动 [`signOut()`](frontend/src/lib/fetch.ts:148)，但 admin 请求被刻意排除在外。

因此 admin 侧缺少：

- 401 时清理 admin token
- 401 时跳转 `/admin/login`
- 403 时给出“账号无 ops 权限”提示

### 6.1.6 缺 token 生命周期管理

当前仅支持：

- 保存 token
- 清除 token

缺少：

- 过期感知
- 刷新 token
- 续期策略
- 主动退出登录

## 6.2 后端缺口

### 6.2.1 缺“独立 Admin 登录”的明确接口契约

当前后端只有通用：

- [`POST /auth/login`](backend/internal/apps/auth/module.go:35)
- [`GET /auth/me`](backend/internal/apps/auth/module.go:47)

它们从能力上能返回 JWT，但没有单独表达：

- Admin 登录是否走单独接口
- Admin 登录是否只允许 `admin/operator`
- Admin 登录失败时与普通用户的错误语义是否不同

换言之，后端目前有“通用用户登录”，没有“admin console 专用登录契约”。

### 6.2.2 缺 admin 身份自描述接口约束

如果前端要做真正独立 admin session，登录后至少需要确认当前 admin 身份。当前虽然可复用 [`GET /auth/me`](backend/internal/apps/auth/module.go:47)，但缺少清晰约束：

- 是否允许 admin 前端复用该接口
- 是否需要单独的 `/admin/me` / `/ops/me`
- 是否需要返回更适合 admin console 的权限信息

### 6.2.3 缺 refresh 机制

JWT 由 [`generateJWT()`](backend/internal/services/auth/auth_service.go:91) 直接签发，当前代码中未见 refresh token / rotation / renewal 接口。

因此独立 admin 登录若要长期稳定使用，目前缺少：

- refresh token 模型
- refresh endpoint
- refresh 失败后的失效策略

如果接受 MVP 简化，也至少需要在方案中明确：

- 暂不做 refresh
- access token 过期后强制重新登录

### 6.2.4 缺 logout 的服务端语义

[`Logout()`](backend/internal/services/auth/auth_service.go:81) 当前是 no-op；控制器也说明 stateless JWT 下主要是客户端清理 [`handler.go`](backend/internal/controllers/auth/handler.go:172)。

对独立 admin 来说，需要至少明确：

- MVP 是否只做前端清理 token
- 未来是否需要 token blacklist / revoke

### 6.2.5 缺 admin 登录失败与权限失败的分层语义

当前 `/ops/*` 上的权限控制是：

- 认证失败 -> [`AuthMiddleware.Handler()`](backend/internal/middlewares/auth/auth.go:57)
- 角色不符 -> [`requireOpsRole()`](backend/internal/apps/ops/module.go:86)

但如果引入独立 admin 登录，还需要更清晰地区分：

- 凭据错误（401）
- 已登录但非 admin/operator（403）
- admin 已停用/用户不存在（401 或 403）

这对前端登录页提示和会话恢复逻辑都很重要。

---

## 7. “最小可落地”的 Admin 登录方案输入项

以下是**输入项**，不是实现方案代码。

### 7.1 前端最小输入项

1. 新增独立登录路由：例如 [`/admin/login`](frontend/src/app/(main)/admin/page.tsx:1)
2. 新增 admin auth 模块：
   - `admin-login page`
   - `useAdminAuth()`
   - `admin auth store/provider`
   - `admin logout` 封装
3. 把 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:20) 从“手动录 token 容器”改为“读取 admin session 并展示状态的壳”
4. 为 `/admin/*` 增加真正的路由守卫：
   - 未登录跳转 `/admin/login`
   - 已登录才放行子页面
5. 为 admin 请求补充独立 401/403 处理：
   - 401 -> 清理 admin session 并跳转登录页
   - 403 -> 保留登录态并提示权限不足

### 7.2 后端最小输入项

有两种可行方向，二选一即可：

#### 方向 A：复用现有 [`/auth/login`](backend/internal/apps/auth/module.go:35) 与 [`/auth/me`](backend/internal/apps/auth/module.go:47)

需要明确文档约束：

- Admin 前端调用同一个登录接口
- 登录成功后必须再调用 `/auth/me`
- 仅当 role 属于 `admin/operator` 才建立 admin session
- 不做 refresh，token 过期后重新登录

这是最小改动路线。

#### 方向 B：新增 admin 专用认证接口

例如单独的：

- `POST /admin/auth/login` 或 `POST /ops/auth/login`
- `GET /admin/auth/me` 或 `GET /ops/me`
- 可选 `POST /admin/auth/refresh`

这是边界更清晰的路线，但改动更大。

### 7.3 建议的 MVP 边界

若目标是“尽快补齐真正独立 Admin 登录流程”，最小 MVP 建议明确以下约束：

- 先**不做 refresh token**
- 先复用后端通用 JWT 签发能力
- 由 admin 前端独立维护登录态，不接入普通用户 NextAuth session
- 登录后必须验证 role 为 `admin/operator`
- token 过期即回到 admin 登录页重新登录

这样可以在不改动普通用户主链路的前提下，把 admin console 真正闭环。

---

## 8. 推荐交付时重点关注的关键代码路径

### 8.1 普通用户登录链路

- [`frontend/src/app/(auth)/login/page.tsx`](frontend/src/app/(auth)/login/page.tsx)
- [`frontend/src/hooks/auth/useAuth.ts`](frontend/src/hooks/auth/useAuth.ts)
- [`frontend/src/lib/auth.ts`](frontend/src/lib/auth.ts)
- [`frontend/src/types/next-auth.d.ts`](frontend/src/types/next-auth.d.ts)
- [`frontend/src/lib/fetch.ts`](frontend/src/lib/fetch.ts)
- [`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts)
- [`backend/internal/apps/auth/module.go`](backend/internal/apps/auth/module.go)
- [`backend/internal/controllers/auth/handler.go`](backend/internal/controllers/auth/handler.go)
- [`backend/internal/services/auth/auth_service.go`](backend/internal/services/auth/auth_service.go)
- [`backend/internal/middlewares/auth/auth.go`](backend/internal/middlewares/auth/auth.go)

### 8.2 当前 Admin token 链路

- [`frontend/src/components/admin/AdminShell.tsx`](frontend/src/components/admin/AdminShell.tsx)
- [`frontend/src/lib/admin-auth.ts`](frontend/src/lib/admin-auth.ts)
- [`frontend/src/lib/fetch.ts`](frontend/src/lib/fetch.ts)
- [`frontend/src/app/(main)/layout.tsx`](frontend/src/app/(main)/layout.tsx)
- [`frontend/src/app/api/proxy/[...path]/route.ts`](frontend/src/app/api/proxy/[...path]/route.ts)
- [`frontend/src/lib/api/generated/ops/ops.ts`](frontend/src/lib/api/generated/ops/ops.ts)
- [`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go)
- [`backend/internal/contracts/ops/service.go`](backend/internal/contracts/ops/service.go)
- [`backend/internal/middlewares/auth/auth.go`](backend/internal/middlewares/auth/auth.go)

---

## 9. 验收映射

- 普通用户登录链路组成文件：已在第 3 节与第 8.1 节列明
- 当前 `/admin/*` 为什么只有手动 token 没有登录页：已在第 4.2、4.6 节说明
- 独立 Admin 登录流程所缺前后端能力：已在第 6 节列明
- 文档写入指定路径：当前文件即 [`tasks/admin-console-mvp/2.4_ui/admin-login-gap-analysis.md`](tasks/admin-console-mvp/2.4_ui/admin-login-gap-analysis.md)
