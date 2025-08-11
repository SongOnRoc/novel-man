## 认证流程详细设计（App Router + NextAuth + TanStack Query）— 实施说明

- 文档类型：实施后的设计说明（已落地）
- 版本：v1.1
- 时间：2025-08-11（CST）
- 范围：前端认证链条、Provider 入口、代理、服务层边界、验证与约束

### 0. 执行结论（给决策者）
- 实施状态：已完成（一次性实施全部改动），当前代码即为本方案
- 满足需求：满足分层与数据流设计要求
- 是否需要继续改动：不需要（按本方案运行即可）
- 验证结果：核心用例通过（详见“11. 验证建议（必须通过）”）
- 风险等级：低；保留回滚方案（见“17. 回滚方案”）

### 1. 关键改动与代码入口（当前已生效）
- useAuth 统一入口： [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23)
- 登录页改造为使用 Hook： [LoginPage()](../../../../frontend/src/app/\(auth\)/login/page.tsx:41)
- Provider 收敛为单一入口： [Providers()](../../../../frontend/src/components/common/Providers.tsx:16) → [SessionProvider()](../../../../frontend/src/components/common/layout/SessionProvider.tsx:10) + [QueryProvider()](../../../../frontend/src/components/common/layout/QueryProvider.tsx:6)
- 根布局仅挂载一次 Provider： [RootLayout()](../../../../frontend/src/app/layout.tsx:28)
- 代理透传 Authorization/Cookie： [handler()](../../../../frontend/src/app/api/proxy/[...path]/route.ts:7)
- NextAuth 认证链（Credentials → authorize/jwt/session）： [authorize()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:19), [jwt()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:114), [session()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:127)
- 服务层边界：登录仅供 NextAuth 使用： [loginService()](../../../../frontend/src/lib/services/auth.service.ts:46)
- 受保护路由放行与骨架屏： [MainLayoutGuard()](../../../../frontend/src/components/common/layout/MainLayoutGuard.tsx:15)
- 统一 HTTP 客户端与令牌注入： [axiosInstance](../../../../frontend/src/lib/axios.ts:44), [axiosInstance.interceptors.request.use()](../../../../frontend/src/lib/axios.ts:55)
- 会话扩展类型： [frontend/src/types/next-auth.d.ts](../../../../frontend/src/types/next-auth.d.ts)

### 2. 变更矩阵（状态：已实施）
- 统一认证 Hook：已实施 → [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23)
- 登录页使用 Hook：已实施 → [LoginPage()](../../../../frontend/src/app/\(auth\)/login/page.tsx:41)
- Provider 合并与根入口收敛：已实施 → [Providers()](../../../../frontend/src/components/common/Providers.tsx:16), [RootLayout()](../../../../frontend/src/app/layout.tsx:28)
- 代理增强（Cookie 透传）：已实施 → [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:23)
- 服务层用途边界标注：已实施 → [loginService()](../../../../frontend/src/lib/services/auth.service.ts:46)
- 受控查询（随会话态触发）：已实施 → [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:13)

### 3. 分层与职责（现状）
- UI 层：仅通过 [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23) 触发 login/logout；页面与布局不直连后端。
- Hook 层：
  - 认证： [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23) → NextAuth
  - 数据： [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:13) 以 `enabled` 受控触发（见 [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:22)）
- 服务层：
  - 登录：仅 [loginService()](../../../../frontend/src/lib/services/auth.service.ts:46) 供 [authorize()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:19) 使用
  - 用户信息：Orval 生成方法 + TanStack Query 统一调度
- 传输与适配： [axiosInstance](../../../../frontend/src/lib/axios.ts:44) → `/api/proxy`（服务端/Edge 由 [handler()](../../../../frontend/src/app/api/proxy/[...path]/route.ts:7) 透传 Cookie/Authorization）

### 4. 运行时序（登录）
1) UI 调用 [useAuth().login](../../../../frontend/src/hooks/auth/useAuth.ts:26) → `signIn('credentials')`
2) NextAuth [authorize()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:19) 调用 [loginService()](../../../../frontend/src/lib/services/auth.service.ts:46) 获取 `access_token`
3) 同一请求内以临时实例直呼 `/auth/me` 合并 `user + accessToken`（见 [route.ts](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:45)）
4) [jwt()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:114) 写入 `token.accessToken/token.user`
5) [session()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:127) 映射到客户端 Session
6) 登录页跳转 `/dashboard` 并由 [MainLayoutGuard()](../../../../frontend/src/components/common/layout/MainLayoutGuard.tsx:15) 放行

### 5. 运行时序（登出）
1) UI 调用 [useAuth().logout](../../../../frontend/src/hooks/auth/useAuth.ts:34) → `signOut({ redirect: true, callbackUrl: '/login' })`
2) 会话被 NextAuth 清理；可选调用后端登出
3) 页面跳转 `/login`，受保护区不再放行

### 6. 运行时序（受保护数据）
1) 受保护路由挂载 [MainLayoutGuard()](../../../../frontend/src/components/common/layout/MainLayoutGuard.tsx:15)；未登录重定向 `/login`
2) 客户端请求统一走 [axiosInstance](../../../../frontend/src/lib/axios.ts:44) 注入 Bearer
3) 服务端/Edge 走 `/api/proxy` 的 [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:7) 透传 Authorization/Cookie → 后端
4) Hook 以 Session 控制查询： [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:13) `enabled: status === 'authenticated'`（见 [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:22)）

### 7. Provider 设计与约束
- 根入口： [RootLayout()](../../../../frontend/src/app/layout.tsx:28) 仅挂载一次 [Providers()](../../../../frontend/src/components/common/Providers.tsx:16)
- 组合内容： [SessionProvider()](../../../../frontend/src/components/common/layout/SessionProvider.tsx:10) + [QueryProvider()](../../../../frontend/src/components/common/layout/QueryProvider.tsx:6)
- 约束：任何路由组内不得重复挂载 Provider，防止会话与缓存上下文错乱

### 8. 代理与 HTTP 客户端
- 客户端： [axiosInstance](../../../../frontend/src/lib/axios.ts:44) 在浏览器侧通过 [axiosInstance.interceptors.request.use()](../../../../frontend/src/lib/axios.ts:55) 注入 `Authorization: Bearer <token>`
- 服务器/Edge： [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:7) 透传 `Authorization`、`Content-Type`、`Cookie`（见 [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:12) 与 [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:23)）
- 基础路径：服务端通过 `NEXTAUTH_URL + /api/proxy` 计算（见 [axios.ts](../../../../frontend/src/lib/axios.ts:11)），客户端相对路径 `/api/proxy`

### 9. 错误处理与 UX
- 登录页：成功/失败 toast，成功后 `router.replace('/')`： [LoginPage()](../../../../frontend/src/app/\(auth\)/login/page.tsx:55)
- 主区：会话解析或用户信息加载中展示骨架屏： [MainLayoutGuard()](../../../../frontend/src/components/common/layout/MainLayoutGuard.tsx:31)
- 401/未登录：统一重定向 `/login`，无白屏闪烁

### 10. 安全与合规
- Session 为唯一真相：客户端仅读 [useSession()](../../../../frontend/src/hooks/auth/useAuth.ts:24)
- Token 生命周期：写入于 [jwt()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:114)，下发于 [session()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:127)
- SSR/Edge Cookie 透传：由 `/api/proxy` [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:23) 保障；日志中禁止打印敏感头
- 禁止在 LocalStorage 持久化访问令牌；只使用 NextAuth 的 JWT/Session 机制

### 11. 验证建议（必须通过）
- 未登录访问 `(main)` 任意页重定向至 `/login`
- 登录一次后进入 `/dashboard`；刷新仍保持登录（Session 持久）
- 通过 `/api/proxy` 的 SSR/Edge 请求能携带 Cookie 且后端鉴权通过

### 12. 配置与环境变量
- NEXTAUTH_URL：服务端计算代理基础路径（见 [axios.ts](../../../../frontend/src/lib/axios.ts:11)）
- BACKEND_API_URL：后端网关地址（见 [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:4)）
- 其他（可选）：生产环境需确保上述变量正确注入，避免 SSR/Edge 场景下基址错误

### 13. 影响评估（面向落地后的运行）
- 代码影响：
  - 旧 UI 直接 API 调用需清理；Hook 化后复用度与可测性提升
  - Provider 若散落将导致上下文错乱，需集中到根布局
- 性能影响：
  - 登录时额外一次 `/auth/me` 请求但消除竞态；用户数据缓存 `staleTime=5min`
  - 代理一跳开销可忽略；换取 SSR/Edge 统一鉴权
- 安全影响：
  - Token 不落盘；Cookie 仅在服务端透传，降低 XSS 风险
- 组织影响：
  - 统一编码规范（禁止直调登录、统一 axiosInstance/Orval），便于 Code Review 与培训

### 14. 约束清单（强约束，已在代码中执行）
- UI 只能通过 [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23) 触发认证，不得调用 [loginService()](../../../../frontend/src/lib/services/auth.service.ts:46)
- 受保护 `useQuery` 必须以会话态 `enabled` 受控（见 [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:22)）
- 网络请求一律经由 [axiosInstance](../../../../frontend/src/lib/axios.ts:44)/Orval，不直接 `fetch` 后端
- Provider 不得重复挂载；只在 [RootLayout()](../../../../frontend/src/app/layout.tsx:28) 使用 [Providers()](../../../../frontend/src/components/common/Providers.tsx:16)
- 禁止在日志中输出 `Authorization/Cookie` 等敏感信息

### 15. 迁移说明（现状：已迁移完毕）
1) UI 登录改为 [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:23)（完成）
2) 受保护数据请求改为 Hook + `enabled`（完成，见 [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:13)）
3) 直连后端改为 [axiosInstance](../../../../frontend/src/lib/axios.ts:44)/Orval（完成）
4) Provider 收敛至根布局（完成，见 [RootLayout()](../../../../frontend/src/app/layout.tsx:28)）
5) 环境变量配置与 SSR/Edge 代理验证（完成）
6) 单测/E2E 用例更新（完成）

### 16. 风险与缓解
- 竞态（登录后立即拉取用户）：已通过 `authorize` 同步 `/auth/me` + Query `enabled` 规避（见 [authorize()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:45), [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:22)）
- 环境变量配置错误：通过启动时健康检查与 E2E 覆盖 `/api/proxy` 场景
- Provider 重复挂载：通过 CI 规则与 Code Review 检测

### 17. 回滚方案（低概率）
- 预留开关切回旧登录表单与直连 API；但不具备 SSR/Edge 统一鉴权能力

### 18. 技术前瞻性验证（2025-08-11）
- NextAuth App Router：以 `useSession` 为客户端唯一真相，`Credentials` 在服务端 `authorize` 对接后端并通过 `jwt/session` 回调合并用户与令牌（[NextAuth App Router 指南](https://authjs.dev/guides/app-router)）
- TanStack Query：使用 `enabled` 随会话态触发查询（[TanStack Query useQuery(enabled)](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)）
- Next.js Route Handler：以 Route Handler 转发并显式透传 Cookie/Authorization，兼容 Edge/SSR（[Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)）

### 附：关键实现片段（快速索引）
- 登录触发： [useAuth()](../../../../frontend/src/hooks/auth/useAuth.ts:26)
- 受控查询： [useUserQuery()](../../../../frontend/src/hooks/auth/useUserQuery.ts:16)
- Cookie 透传： [route.ts](../../../../frontend/src/app/api/proxy/[...path]/route.ts:23)
- JWT/Session 回调： [jwt()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:114), [session()](../../../../frontend/src/app/api/auth/[...nextauth]/route.ts:127)