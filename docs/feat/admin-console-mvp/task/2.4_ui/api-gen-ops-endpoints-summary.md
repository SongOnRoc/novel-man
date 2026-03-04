# API Gen Ops Endpoints Summary（swag init --v3.1 → pnpm api-gen）

## 目标
确保后端 swagger（`backend/docs/swagger.json`）包含 Ops API 的如下 endpoints，并且前端 orval 生成的 client 中出现对应的 `ops` tag 文件与调用函数。

- `/ops/jobs` (GET)
- `/ops/jobs/{job_id}` (GET)
- `/ops/jobs/works/recalc-stats` (POST)
- `/ops/jobs/{job_id}/cancel` (POST)

## 结论（当前状态）
- 后端：运行 `cd backend && swag init --v3.1` 后，`backend/docs/swagger.json` 已包含以上 `/ops/jobs/*` 路由。
- 前端：运行 `cd frontend && pnpm api-gen` 后，生成目录出现 `frontend/src/lib/api/generated/ops/ops.ts`，其中包含上述 endpoints 的调用函数与 React Query hooks。

## 根因分析
### 1) 为什么一开始前端 generated 里没有 ops
前端 `orval` 只读取 `frontend/orval.config.js` 指向的 `../backend/docs/swagger.json`。因此只要 swagger 文件里缺少 `/ops/jobs/*` paths，前端生成结果必然不会出现 `ops` tag。

本次排查发现：`backend/internal/controllers/ops/handler.go` 内的 swag 注解本身是齐全的（包含 `@Tags ops` 与 `@Router /ops/jobs...`），因此问题不在于 handler 没写注解，而在于 swagger 文件未按正确步骤/参数被重新生成（或生成文件仍旧是旧版本/旧内容）。

### 2) 为什么 swag init 能生成 schemas，但 paths 可能缺失
`swag init` 的本质是“扫描指定目录下的 Go 代码并提取注解”。如果没有在正确的目录运行/没有使用正确的入口文件（`--generalInfo` / `--dir`），就会导致：
- 一部分结构体（schemas）可能仍会被扫描到
- 但 operations（`@Router` 生成的 paths）可能不完整或缺失

本仓库的模块注册是通过 `backend/internal/cmd/construct.go` 的空白导入激活各 module（包含 `internal/apps/ops`），并在 router 初始化时 `apps.GetRegisteredModules()` 自动注册路由。

因此稳定做法是：始终在 `backend/` 目录下运行 `swag init --v3.1`，让 swag 以 `backend/main.go` 为 general info，并扫描 `./`。

## 关于生成时出现的 warning
在执行 `swag init --v3.1` 时可能看到：`found schema with no Type, returning any`。

含义：swag 对某些字段无法静态推断出精确类型（例如 `any/interface{}`、`map[string]any` 等动态结构），因此在 OpenAPI 中将该处 schema 退化为 `any`。

为什么刚好 Ops 新接口更容易触发：
- `backend/internal/contracts/ops/service.go` 中 `CreateWorksRecalcStatsJobRequest.Predicate` 使用了 `map[string]any`
- `backend/internal/controllers/ops/handler.go` 中 `ListJobsResponse.Data` 使用了 `any`
- `backend/utils/response/response.go` 中通用响应 `StandardResponse.Data` 使用了 `interface{}`

该 warning 不会阻止 swagger 或前端 client 生成；主要影响是前端生成的类型在这些字段上会更宽松（`any/unknown`）。

## 稳定的生成步骤（命令顺序）
### 1) 生成后端 OpenAPI 3.1 swagger
在仓库根目录执行：

```bash
cd backend
swag init --v3.1
```

产物：
- `backend/docs/swagger.json`
- `backend/docs/swagger.yaml`
- `backend/docs/docs.go`

### 2) 前端生成 API client
在仓库根目录执行：

```bash
cd frontend
pnpm api-gen
```

产物目录：
- `frontend/src/lib/api/generated`
  - 以 tag 分包（`mode: tags-split`）
  - `ops` tag → `frontend/src/lib/api/generated/ops/ops.ts`

## 验证点（快速自检）
### Swagger 侧
检查 `backend/docs/swagger.json` 中存在以下 paths：
- `/ops/jobs`
- `/ops/jobs/{job_id}`
- `/ops/jobs/works/recalc-stats`
- `/ops/jobs/{job_id}/cancel`

### Generated client 侧
检查 `frontend/src/lib/api/generated/ops/ops.ts` 中存在对应 url：
- ``/ops/jobs``
- ``/ops/jobs/${jobId}``
- ``/ops/jobs/works/recalc-stats``
- ``/ops/jobs/${jobId}/cancel``

## 修改文件列表
> 本任务遵循“尽量少改”，不手工编辑 generated code。

- `backend/docs/swagger.json`（由 `swag init --v3.1` 生成/更新）
- `backend/docs/swagger.yaml`（由 `swag init --v3.1` 生成/更新）
- `backend/docs/docs.go`（由 `swag init --v3.1` 生成/更新）
- `frontend/src/lib/api/generated/**`（由 `pnpm api-gen` 生成/更新）
- `tasks/admin-console-mvp/2.4_ui/api-gen-ops-endpoints-summary.md`（本汇总文档）

## 关联关键文件（参考）
- `backend/internal/controllers/ops/handler.go`
- `backend/internal/apps/ops/module.go`
- `backend/internal/cmd/construct.go`
- `frontend/orval.config.js`
