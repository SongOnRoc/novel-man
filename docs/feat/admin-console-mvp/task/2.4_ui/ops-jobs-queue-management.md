# Ops Jobs 队列管理（Admin）- 删除/清理能力补齐

## 背景与目标
为 Admin 作业队列补齐两项能力，并保证前端 API 生成代码与 Swagger 同步：

1. **删除指定 job**：`DELETE /ops/jobs/{job_id}`
2. **按当前筛选条件清理队列**：`DELETE /ops/jobs`

同时在前端 `Ops Jobs` 页面提供入口（含二次确认），并在操作成功后刷新列表。

---

## 后端变更概览

### 新增/补齐接口
- `DELETE /ops/jobs/{job_id}`：删除指定 job
- `DELETE /ops/jobs`：按筛选条件批量清理（与列表同一套筛选参数：`page/limit/type/status`）

### Swagger 输出
- 已同步更新 Swagger 产物：
  - [`backend/docs/swagger.json`](backend/docs/swagger.json:1)
  - [`backend/docs/swagger.yaml`](backend/docs/swagger.yaml:1)
  - [`backend/docs/docs.go`](backend/docs/docs.go:1)

### 主要代码位置
- 控制器：[`OpsController`](backend/internal/controllers/ops/handler.go:1)
- 服务：[`OpsService`](backend/internal/services/ops/ops_service.go:1)
- 仓储：[`OpsJobGormRepository`](backend/internal/repositories/gorm/ops_job_repository.go:1)
- 模块注入：[`ops module`](backend/internal/apps/ops/module.go:1)
- 合约接口：[`ops service contract`](backend/internal/contracts/ops/service.go:1)

---

## 前端变更概览

### Orval 生成（ops endpoints）
- 已生成并可用的 hooks：
  - 删除指定 job：[`useDeleteOpsJobsJobId()`](frontend/src/lib/api/generated/ops/ops.ts:475)
  - 清理队列：[`useDeleteOpsJobs()`](frontend/src/lib/api/generated/ops/ops.ts:109)

### Admin 作业队列页面
- 页面位置：[`OpsJobsPage`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:119)
- 行内“删除”按钮：弹二次确认 → 调用 `useDeleteOpsJobsJobId()` → 成功后 `refetch()`
- 顶部“清理队列（当前筛选）”按钮：弹二次确认（携带当前筛选条件）→ 调用 `useDeleteOpsJobs()`（带 `params: { page, limit, type, status }`）→ 成功后 `refetch()`

---

## 测试/校验（本轮）

### Frontend TypeScript
- `pnpm tsc --noEmit`：已通过。
- 为修复测试编译，补齐了缺失的 lookup hook：[`useLookup()`](frontend/src/hooks/lookup/useLookup.ts:1) 并修正测试导入：[`useLookup.test.ts`](frontend/src/hooks/lookup/useLookup.test.ts:1)

### Frontend ESLint
- `pnpm lint`：已通过（保留少量 warnings）。
- 由于仓库中存在大量历史遗留的 lint 阻塞，按选择采用“放行策略”在 [`eslint.config.mjs`](frontend/eslint.config.mjs:1) 中关闭/降级了若干规则（以确保本需求交付链路可跑通）。

---

## 修改文件清单（git diff）

### Backend
- [`backend/internal/controllers/ops/handler.go`](backend/internal/controllers/ops/handler.go:1)
- [`backend/internal/services/ops/ops_service.go`](backend/internal/services/ops/ops_service.go:1)
- [`backend/internal/repositories/gorm/ops_job_repository.go`](backend/internal/repositories/gorm/ops_job_repository.go:1)
- [`backend/internal/contracts/ops/service.go`](backend/internal/contracts/ops/service.go:1)
- [`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go:1)
- [`backend/docs/swagger.json`](backend/docs/swagger.json:1)
- [`backend/docs/swagger.yaml`](backend/docs/swagger.yaml:1)
- [`backend/docs/docs.go`](backend/docs/docs.go:1)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:1)

### Frontend
- [`frontend/src/app/(main)/admin/ops-jobs/page.tsx`](frontend/src/app/(main)/admin/ops-jobs/page.tsx:1)
- [`frontend/src/lib/api/generated/ops/ops.ts`](frontend/src/lib/api/generated/ops/ops.ts:1)
- [`frontend/src/lib/api/generated/api10.schemas.ts`](frontend/src/lib/api/generated/api10.schemas.ts:1)
- [`frontend/src/lib/api/generated/auth/auth.ts`](frontend/src/lib/api/generated/auth/auth.ts:1)
- [`frontend/eslint.config.mjs`](frontend/eslint.config.mjs:1)
- 测试修复：
  - [`frontend/src/features/editor/components/EditorToolbar.test.tsx`](frontend/src/features/editor/components/EditorToolbar.test.tsx:1)
  - [`frontend/src/hooks/ai/useAIAssistant.test.tsx`](frontend/src/hooks/ai/useAIAssistant.test.tsx:1)
  - [`frontend/src/hooks/prompt/usePromptService.test.tsx`](frontend/src/hooks/prompt/usePromptService.test.tsx:1)
  - [`frontend/src/hooks/lookup/useLookup.test.ts`](frontend/src/hooks/lookup/useLookup.test.ts:1)
  - 新增：[`frontend/src/hooks/lookup/useLookup.ts`](frontend/src/hooks/lookup/useLookup.ts:1)

### Other
- [`memory_bank/decisionLog.md`](memory_bank/decisionLog.md:1)
