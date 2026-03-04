# Admin Console MVP / 代码 Review（feat-admin-api-v0）

> 目标：对本分支引入的 **Admin Console + Ops Jobs（works.recalc_stats）** 全链路做一次工程与安全视角的代码审查，沉淀问题清单与改进建议。
>
> 范围：前端 Next.js Admin Console、`/api/proxy/*` 代理层、后端 Gin + GORM 的 ops jobs（locks/lease/runner/事件投递）、admin JWT 鉴权。

---

## 1. 变更概览（你现在实现了什么）

### 1.1 Admin Console（前端）
- 增加 `/admin/login` 登录页，通过 `/api/proxy/auth/admin/login` 获取 admin token，并调用 `/api/proxy/auth/admin/me` 拉取 profile 后存入 `sessionStorage`。
  - `frontend/src/app/admin/login/page.tsx:60-147`
  - `frontend/src/lib/admin-auth.ts:0-114`

### 1.2 Proxy（前端）
- 新增统一代理路由 `frontend/src/app/api/proxy/[...path]/route.ts`：
  - 将前端请求转发至后端 `BACKEND_API_URL`；
  - 具备基础限流（进程内 Map）；
  - 对 multipart 上传做文件类型/大小校验；
  - 支持 SSE（`text/event-stream`）透传；
  - 对普通用户 API：若无显式 Bearer，则尝试从 NextAuth session 的 `accessToken` 补齐；
  - 对 ops 路径：强制要求显式 Bearer（独立 admin token）。
  - `frontend/src/app/api/proxy/[...path]/route.ts:5-357`

### 1.3 Ops Jobs（后端）
- Ops Jobs API：创建/查询/取消请求/删除/按筛选清空。
  - `backend/internal/controllers/ops/handler.go:44-273`
  - `backend/internal/services/ops/ops_service.go:36-157`
  - `backend/internal/repositories/gorm/ops_job_repository.go:12-372`

- Ops Jobs Runner（works.recalc_stats）：
  - 周期扫描 running jobs；抢占/续租 lease；解析 params；分页扫描 works id；通过 `EventManager.Dispatch` 投递 `works.recalc_stats` 事件；
  - 进度单调递增（done/failed）；
  - cancel 两段式（API request，runner ack 并落盘为 canceled）。
  - `backend/internal/services/ops/runner/works_recalc_stats_runner.go:23-458`

- 集群唯一入口（锁）：
  - `ops_job_locks` 以 `job_type` 为主键，提供跨 DB（MySQL/Postgres/SQLite）一致的“全局唯一 + lease”协调入口。
  - `backend/internal/models/ops_job_lock.go:6-29`
  - `backend/internal/repositories/gorm/ops_job_repository.go:298-372`

### 1.4 Admin JWT 鉴权（后端）
- `admin-auth` 中间件解析 Bearer token，校验 `token_kind=admin`，并将 `adminID/adminRole` 写入 gin context。
  - `backend/internal/middlewares/auth/auth.go:19-257`

---

## 2. 已确认的架构决策（本 Review 依据）

1) **Admin 与普通用户鉴权分离**：
- Admin console 使用独立 admin token，不复用 NextAuth session。
- proxy 对 `/ops/*` 要求显式 `Authorization: Bearer <admin-token>`。
  - `frontend/src/app/api/proxy/[...path]/route.ts:150-169`

2) Cookie 主题缓存预留（简述即可）：
- 约定主题 cookie key：`nm_theme`，值 `light | dark | system`（默认 `system`）。
- 主题仅前端/SSR 使用：**SSR 首屏**可以在 Next 服务端渲染层读取 cookie 并注入主题；无需把 cookie 透传给后端。

---

## 3. P0 / P1 / P2 问题清单（按严重度）

> 说明：P0=安全/功能必炸；P1=明显缺陷/可维护性风险；P2=工程体验/可观测性/后续演进风险。

### P0-1：Proxy 透传 Cookie 到后端（攻击面扩大，且与“独立 admin token”目标冲突）
- 现状：proxy 会把 `req.headers.get("cookie")` 原样转发给后端。
  - `frontend/src/app/api/proxy/[...path]/route.ts:206-210`

- 风险：
  - 若前端存在 NextAuth session cookie，则会在调用任意后端 API 时被透传，扩大后端对浏览器 cookie 的信任面；
  - 对 ops/admin 体系（独立 token）尤其没有必要；
  - 未来若后端出现任何 cookie 读取逻辑（哪怕无意），会造成鉴权边界模糊。

- 建议：
  - 默认不转发整条 Cookie；需要 SSR 首屏主题等前端能力时，在 Next SSR 直接读 `nm_theme`；
  - 若确实需要把主题传到后端（目前不需要），用显式 Header（例如 `X-User-Theme: ...`）而非 Cookie 透传。

### P0-2：multipart 文件校验失败的返回链路存在确定性 bug（实际无法返回 413/415）
- 现状：`validateFileUpload` 已返回 `{ valid:false, res: NextResponse }`。
- 但在 `getBody` 中校验失败时 `throw new Error("File validation failed: ${validation.res}")`，随后 catch 分支又试图从 `error as any` 取 `res`：
  - `frontend/src/app/api/proxy/[...path]/route.ts:245-266`

- 问题：
  - `Error` 并不会携带 `res` 字段，因此 `validationError.res` 永远是 `undefined`；
  - 最终会退化为 `return undefined`，然后继续 fetch 上游，导致“校验失败仍可能上传到后端”。

- 建议：
  - 不要 throw Error；直接在 `getBody` 返回 `NextResponse`（或返回一个 discriminated union），在 `handler` 层优先短路返回。

### P0-3：JWT secret 存在开发默认回退，若生产未配置将导致严重风险
- 现状：`JWT_SECRET` 为空时回退 `your-super-secret-key-for-dev-env`。
  - `backend/internal/config/jwt.go:4-16`

- 风险：
  - 一旦生产环境未正确配置，任何人都可用已知 secret 伪造 user/admin token。

- 建议：
  - 至少在非 dev 环境强制要求配置（例如启动时校验），并在文档/配置模板显著提示。

---

### P1-1：通过字符串比较/contains 判断业务分支（脆弱）
- 现状：
  - create job 冲突：controller 用 `err.Error() == "job already running (lock not acquired)"` 判断 409。
    - `backend/internal/controllers/ops/handler.go:70-76`
  - runner 识别队列满：`strings.Contains(err.Error(), "queue is full")`。
    - `backend/internal/services/ops/runner/works_recalc_stats_runner.go:461-464`

- 问题：
  - 依赖错误字符串非常脆；改文案/封装层变化就会破。

- 建议：
  - 使用 sentinel error（`var ErrXxx = errors.New(...)`）或自定义 error type，并用 `errors.Is/As` 判断。

### P1-2：Ops Job Lock 抢到锁后创建 job 失败时，不释放锁（会导致短时间无法再次创建）
- 现状：
  - `CreateWorksRecalcStatsJob` 先 `AcquireOrSteal`，后 `jobs.Create`；Create 失败仅 warn，不释放锁，依赖 lease 过期。
  - `backend/internal/services/ops/ops_service.go:63-114`

- 影响：
  - DB 故障/瞬时错误会造成“锁占用窗口”，用户无法立即重试创建。

- 建议：
  - Create 失败时可考虑释放锁（或缩短 leaseTTL/补偿逻辑）。

### P1-3：Proxy 限流为进程内 Map，且无清理机制
- 现状：
  - `rateMap = new Map()`，按 IP 计数。
  - `frontend/src/app/api/proxy/[...path]/route.ts:8-67`

- 问题：
  - 多实例/Serverless 不一致；
  - 内存增长（无淘汰）；
  - `x-forwarded-for` 可被错误配置/伪造（取决于部署层）。

- 建议：
  - MVP 可以保留，但要在文档里明确“仅开发/单实例兜底”；生产用外部限流（网关/Redis）。

### P1-4：Proxy 对非 JSON/非 multipart 的 body fallback 仍尝试 `req.json()`，可能吞掉其他类型 body
- 现状：
  - `else` 分支 fallback `return await req.json()`。
  - `frontend/src/app/api/proxy/[...path]/route.ts:279-285`

- 风险：
  - 例如 `application/x-www-form-urlencoded`、`text/plain` 等会解析失败并丢 body。

- 建议：
  - 按 content-type 做更明确的 body 透传策略（或直接用 `req.arrayBuffer()` 透传）。

---

### P2-1：Admin 登录逻辑存在重复实现（service 与 page）
- 现状：
  - 你已有 `adminLoginService`（此前读到 repo 状态中存在 `frontend/src/lib/services/admin-auth.service.ts`），但 `frontend/src/app/admin/login/page.tsx` 又实现了一套 `loginAdmin`。

- 影响：
  - 未来错误处理/字段兼容（`accessToken` vs `access_token`）需要改两处。

- 建议：
  - 统一收敛到 service 或 hook，page 只负责调用与 UI。

### P2-2：Ops Runner “all” 模式先全量预扫描 works id（内存/长任务风险）
- 现状：
  - `all` 模式会把所有 work_id append 到 `allIDs`，再逐个 dispatch。
  - `backend/internal/services/ops/runner/works_recalc_stats_runner.go:413-450`

- 优点：
  - 避免 SQLite 场景下读写竞争（你在注释中已解释）。

- 风险：
  - 数据量大时内存占用；任务执行时间长。

- 建议：
  - 后续可做“分批扫描 + 分批 dispatch”，并控制每轮租约续租与进度 flush 的节奏（你在 TODO 中也提到了通用引擎抽取）。

---

## 4. 设计/实现亮点（值得保留）

1) **OpsJobLock 以 job_type 为主键**实现跨 DB 一致的“唯一 running job”入口（MySQL/Postgres/SQLite 可落地）。
- `backend/internal/models/ops_job_lock.go:6-29`
- `backend/internal/repositories/gorm/ops_job_repository.go:307-372`

2) **Lease where 条件保护**做得比较完整：
- `RenewLease`/`UpdateProgressMonotonic`/`SetProgressTotal` 都要求 `status=running` 且 `lease_owner/token` match 且 `lease_expires_at > now`。
  - `backend/internal/repositories/gorm/ops_job_repository.go:175-235`

3) Cancel 两段式符合可观测/可控要求：
- API 只 request；runner 观察到后 ack 并落库。
  - controller：`backend/internal/controllers/ops/handler.go:153-214`
  - runner：`backend/internal/services/ops/runner/works_recalc_stats_runner.go:213-218,338-343`

4) Proxy 对 SSE 与非 2xx body 做透传的方向是对的：
- SSE：`frontend/src/app/api/proxy/[...path]/route.ts:312-326`
- 透传 body：`frontend/src/app/api/proxy/[...path]/route.ts:328-340`

---

## 5. 权限与边界检查（结论）

- 后端 ops 路由组强制 `admin-auth` + `requireOpsRole()`（admin/operator）：
  - `backend/internal/apps/ops/module.go:41-57`
  - `backend/internal/apps/ops/module.go:72-95`

- 前端 proxy 对 `/ops/*` 不允许使用 NextAuth session token 补齐，必须显式 Bearer：
  - `frontend/src/app/api/proxy/[...path]/route.ts:150-159,192-194`

- 建议一致性：
  - 保持“浏览器 cookie ≠ 后端鉴权材料”；admin token 独立携带。

---

## 6. 建议测试清单（验收用）

### 6.1 Proxy
- `/api/proxy/ops/jobs`：
  - 无 Authorization → 401（且不尝试 NextAuth 补齐）。
  - 有 Bearer admin token → 200/403（由后端角色决定）。
- multipart 上传：
  - 超过 10MB → 必须 413 且不触达后端；
  - 非白名单类型/扩展 → 必须 415 且不触达后端。
- SSE：
  - 后端返回 `text/event-stream` → 前端可持续消费。

### 6.2 Ops Jobs
- 创建 works.recalc_stats job：
  - 同一 job_type 并发创建 → 只能一个成功（其余 409）。
- cancel：
  - 请求 cancel 后，runner tick 观察到并 ack，最终 job status 变为 `canceled`。
- lease：
  - runner 续租失败/丢 lease → 不应继续刷进度（应 fail 或停止）。

---

## 7. 后续演进建议（不做也不影响 MVP，但要有方向）

- 抽象通用 ops runner 引擎：scan/lease/progress/cancel/backoff/finalize，job_type 仅实现 executor。
  - runner 文件已有 TODO：`backend/internal/services/ops/runner/works_recalc_stats_runner.go:31-33`

- 将 proxy 的 rate limit、body 透传策略、cookie 策略写到明确的 ADR/指南，避免后续误用。

---

## 8. 附录：关键文件索引

- Frontend
  - Proxy：`frontend/src/app/api/proxy/[...path]/route.ts`
  - Admin session：`frontend/src/lib/admin-auth.ts`
  - Admin login：`frontend/src/app/admin/login/page.tsx`

- Backend
  - Ops routes：`backend/internal/apps/ops/module.go`
  - Ops controller：`backend/internal/controllers/ops/handler.go`
  - Ops service：`backend/internal/services/ops/ops_service.go`
  - Ops repo（jobs/locks/lease）：`backend/internal/repositories/gorm/ops_job_repository.go`
  - Ops runner：`backend/internal/services/ops/runner/works_recalc_stats_runner.go`
  - Admin auth middleware：`backend/internal/middlewares/auth/auth.go`
  - JWT config：`backend/internal/config/jwt.go`
  - Ops job lock model：`backend/internal/models/ops_job_lock.go`
