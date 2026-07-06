# Admin 独立认证最小方案设计（后端分离版）

## 1. 目标

为 [`/admin/*`](frontend/src/app/(main)/admin/page.tsx:1) 建立一套**独立于普通用户系统**的认证子系统，满足以下约束：

- 不复用普通用户 [`NextAuth`](frontend/src/lib/auth.ts:102) 会话
- 不复用普通用户 [`/auth/login`](backend/internal/apps/auth/module.go:35) 契约
- Admin token 只能用于管理后台与 [`/ops/*`](backend/internal/apps/ops/module.go:42) 能力
- [`/dashboard`](frontend/src/app/(main)/dashboard/page.tsx:1) 与 [`/admin/*`](frontend/src/app/(main)/admin/page.tsx:1) 在登录、会话、退出、401 处理上完全分离

---

## 2. 决策结论

选择 **后端也分离的最小方案**，即新增一条独立的 Admin Auth 契约，而不是在前端单独包一层继续复用普通用户登录。

### 2.1 为什么不复用普通用户登录

现有普通用户链路是：

- [`/login`](frontend/src/app/(auth)/login/page.tsx:34)
- [`useAuth().login()`](frontend/src/hooks/auth/useAuth.ts:23)
- [`signIn("credentials")`](frontend/src/hooks/auth/useAuth.ts:27)
- [`authOptions.authorize()`](frontend/src/lib/auth.ts:110)
- 后端 [`POST /auth/login`](backend/internal/apps/auth/module.go:35)
- 普通用户 JWT claims 由 [`generateJWT()`](backend/internal/services/auth/auth_service.go:91) 生成

该链路天然服务于“普通创作用户 + NextAuth session”模型。如果继续复用，会导致：

- admin 与 user 共享同一登录入口和同类 token 契约
- 前端虽分离，后端身份域仍未分离
- 长期难以保证权限、审计、退出策略、风控策略独立演进

### 2.2 最小后端分离原则

这次不追求一次性做完整 IAM，而是做**最小闭环**：

1. 独立登录
2. 独立 me
3. 独立 token claims
4. 独立前端存储与守卫
5. 独立 401/退出处理

可暂不实现：

- refresh token
- token blacklist
- 多因子认证
- 独立 admin 用户表

---

## 3. 后端最小接口设计

### 3.1 新增接口

在现有 [`/auth`](backend/internal/apps/auth/module.go:32) 下新增 admin 子路径：

#### 1) `POST /auth/admin/login`

用途：Admin 登录并签发 admin token。

请求体：

```json
{
  "identifier": "admin_username_or_email",
  "password": "string"
}
```

响应体：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "<admin-jwt>",
    "token_type": "Bearer",
    "expires_in": 259200,
    "admin": {
      "id": 1,
      "username": "ops-admin",
      "email": "ops@example.com",
      "role": "admin"
    }
  }
}
```

#### 2) `GET /auth/admin/me`

用途：读取当前 admin 身份信息，供前端恢复 admin session。

请求头：

- `Authorization: Bearer <admin-jwt>`

响应体：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "ops-admin",
    "email": "ops@example.com",
    "role": "admin"
  }
}
```

#### 3) `POST /auth/admin/logout`（可选，最小版可先保留 no-op）

用途：语义化登出。

最小版允许与现有 [`Logout()`](backend/internal/controllers/auth/handler.go:163) 一样，先仅返回成功，由前端清 token 完成登出。

---

## 4. 后端身份模型与 Claims 设计

### 4.1 最小复用策略

**最小方案阶段，后端可以先复用现有 [`models.User`](backend/internal/models/models.go:42)**，不强行新建 `AdminUser` 表。

但要做到“身份域分离”，必须满足两点：

1. 登录入口分离：`/auth/admin/login` 只接受管理员身份
2. token 语义分离：admin token 与普通用户 token 的 claims 不同

### 4.2 Admin JWT Claims

建议 claims：

```json
{
  "sub": "admin:1",
  "admin_id": 1,
  "username": "ops-admin",
  "admin_role": "admin",
  "token_kind": "admin",
  "exp": 1234567890,
  "iat": 1234560000
}
```

### 4.3 与普通用户 JWT 的差异

现有普通用户 JWT 由 [`generateJWT()`](backend/internal/services/auth/auth_service.go:91) 生成，claims 为：

- `user_id`
- `username`
- `role`
- `exp`

新 admin token 必须至少新增：

- `token_kind=admin`
- `admin_id`
- `admin_role`

这样做的价值：

- 代理层和后端中间件能明确区分 token 用途
- 防止普通用户 token 被误当作 admin token 使用
- 为未来审计与风控预留边界

---

## 5. 后端鉴权设计

### 5.1 新增 Admin Auth Middleware

当前通用中间件是 [`AuthMiddleware.Handler()`](backend/internal/middlewares/auth/auth.go:55)，它把以下信息写入上下文：

- `userID`
- `role`

对于 admin 子系统，建议新增独立中间件，例如：

- `AdminAuthMiddleware`

职责：

1. 提取 Bearer token
2. 校验 `token_kind == admin`
3. 校验 token 有效期
4. 回库读取 admin 身份
5. 写入 admin 上下文：
   - `adminID`
   - `adminRole`

### 5.2 与 Ops 权限校验的关系

当前 [`requireOpsRole()`](backend/internal/apps/ops/module.go:71) 读取的是普通 `role`。

最小分离方案下建议改为：

- `/ops/*` 路由先走 `AdminAuthMiddleware`
- 再走 `requireOpsRole()` 的 admin 版本，例如读取 `adminRole`

建议重构为：

- `requireAdminOpsRole()`

允许角色：

- [`OpsRoleAdmin`](backend/internal/contracts/ops/service.go:10)
- [`OpsRoleOperator`](backend/internal/contracts/ops/service.go:11)

这样 [`/ops/*`](backend/internal/apps/ops/module.go:42) 将完全脱离普通用户 `role` 上下文。

---

## 6. 前端最小方案设计

### 6.1 新增独立登录页

新增路由：

- `frontend/src/app/admin/login/page.tsx`

> 说明：建议不要放在 [`(auth)`](frontend/src/app/(auth)/login/page.tsx:1) 下，也不要走普通用户登录 UI 分组；admin login 应作为独立入口存在。

页面职责：

- 输入 `identifier` / `password`
- 调用新的 admin 登录服务
- 成功后写入独立 admin session
- 跳转 `/admin`

### 6.2 前端 Admin Session 存储

当前仅有 [`admin-auth.ts`](frontend/src/lib/admin-auth.ts:1) 保存手动输入 token。

建议升级为 Admin Session 模块，最小保存：

- `adminAccessToken`
- `adminProfile`
- 可选：`expiresAt`

最小存储策略：

- `sessionStorage`

理由：

- 比 `localStorage` 生命周期更短
- 与当前 admin 临时控制台使用场景更匹配
- 不引入服务端 session 依赖

### 6.3 前端新增模块建议

- `frontend/src/lib/admin-auth.ts`
  - 扩展为完整 admin session 管理
- `frontend/src/lib/services/admin-auth.service.ts`
  - 对接 `/auth/admin/login`、`/auth/admin/me`、`/auth/admin/logout`
- `frontend/src/hooks/admin/useAdminAuth.ts`
  - 暴露 `login/logout/me/status`
- `frontend/src/app/admin/login/page.tsx`
  - Admin 登录页

---

## 7. 前端路由守卫设计

### 7.1 `/admin/*` 守卫

当前 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:20) 已去掉普通用户 [`useSession()`](frontend/src/hooks/auth/useAuth.ts:23) 依赖，这是正确方向。

下一步应改为：

1. 初始化读取 admin session
2. 若无 admin token：跳转 `/admin/login`
3. 若有 token：调用 `/auth/admin/me` 校验
4. 校验失败：清空 admin session，跳转 `/admin/login`
5. 校验成功：渲染 admin 页面

### 7.2 禁止跳回 `/dashboard`

`/admin/*` 未登录时只能去：

- `/admin/login`

不能去：

- `/login`
- `/dashboard`

因为这会重新把两套系统耦合起来。

---

## 8. 代理注入策略

当前 [`/api/proxy`](frontend/src/app/api/proxy/[...path]/route.ts:132) 已对 `/ops/*` 要求显式 Bearer，这是正确基础。

最小分离方案下建议明确两条规则：

### 8.1 `/ops/*`

- 只接受 admin token
- 绝不回退到 [`getServerSession(authOptions)`](frontend/src/app/api/proxy/[...path]/route.ts:184)
- 若没有 admin token，返回 401，并提示跳转 `/admin/login`

### 8.2 非 `/ops/*`

- 继续沿用普通用户 session 逻辑

这样代理层会成为真正的“身份域边界”。

---

## 9. 退出策略

### 9.1 Admin Logout

前端 admin logout 行为：

1. 调用 `/auth/admin/logout`（最小版允许 no-op）
2. 清理 `sessionStorage` 中的 admin session
3. 跳转 `/admin/login`

### 9.2 与普通用户退出分离

admin logout 不应调用：

- [`signOut()`](frontend/src/hooks/auth/useAuth.ts:35)
- 普通用户 `/login`

否则会再次引入 NextAuth 耦合。

---

## 10. 401 / 403 处理策略

### 10.1 401

含义：admin token 无效、缺失或过期。

前端处理：

- 清空 admin session
- toast 提示“Admin 会话已失效，请重新登录”
- 跳转 `/admin/login`

### 10.2 403

含义：已登录，但 admin 权限不足。

前端处理：

- 不清 token
- 显示“无管理后台权限”页面
- 不跳转 `/dashboard`

---

## 11. 最小实施顺序

### Phase 1：后端

1. 新增 `/auth/admin/login`
2. 新增 `/auth/admin/me`
3. 新增 admin claims 生成函数
4. 新增 `AdminAuthMiddleware`
5. 将 [`/ops/*`](backend/internal/apps/ops/module.go:42) 切到 admin middleware + admin role guard

### Phase 2：前端

1. 新增 `/admin/login`
2. 新增 admin auth service + hook
3. 扩展 [`admin-auth.ts`](frontend/src/lib/admin-auth.ts:1) 为完整 session 管理
4. 将 [`AdminShell`](frontend/src/components/admin/AdminShell.tsx:20) 改为跳 `/admin/login`
5. 将 `/ops/*` 401 处理改为 admin 自己的失效逻辑

### Phase 3：验证

1. 未登录访问 `/admin` -> `/admin/login`
2. admin 登录成功 -> `/admin`
3. admin token 失效 -> 清 session -> `/admin/login`
4. 普通用户登录状态不影响 admin 登录状态
5. admin 退出不影响普通用户 NextAuth 会话

---

## 12. 风险与边界

### 12.1 最小方案的妥协

即使后端分离最小版，若仍复用 [`models.User`](backend/internal/models/models.go:42) 作为数据来源，也只是“认证域分离”，不是“数据表完全分离”。

但这已经满足当前最核心目标：

- 接口分离
- token 分离
- 守卫分离
- 会话分离

### 12.2 后续可演进项

- 独立 `AdminUser` 表
- refresh token
- token blacklist
- 多因子认证
- 审计日志（admin login/logout/ops action）
- IP 白名单 / 更严格风控

---

## 13. 最终推荐

推荐采用：

**后端也分离的最小正式方案**。

即：

- 新增 `/auth/admin/login` + `/auth/admin/me`
- 新增 admin token claims 与 admin middleware
- 前端新增 `/admin/login`
- `/admin/*` 与 `/dashboard` 在登录、会话、退出、401/403 处理上彻底分离

这是当前最符合你“管理后台就是两套系统”的方案，同时改动规模仍可控。
