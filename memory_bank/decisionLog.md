# 决策日志 (Decision Log)

## 2025-12-07

### 代码实现 [后端 LLM 服务重构]
[2025-12-07 21:39:00] - [重构后端 LLM 服务以支持高并发、多租户配置隔离和热重载]

**实现细节：**
1.  **并发安全配置**: 在 `backend/internal/config/config.go` 中引入 `sync.RWMutex` 保护全局配置 `Cfg`，并添加 `GetLLMConfig()` 方法用于线程安全读取。
2.  **无状态 LLM 服务**: 重构 `backend/internal/services/generate/llm_service.go`，移除 `llmService` 中的长连接客户端字段。实现 `createClient` 方法，每次请求时根据系统配置和请求级覆盖（BYOK）动态创建 LLM 客户端。
3.  **请求级配置**: 更新 `backend/internal/models/generate.go`，在 `GenerateRequest` 中添加 `Model`, `APIKey`, `BaseURL` 字段，允许客户端覆盖默认配置。
4.  **业务逻辑适配**: 修改 `backend/internal/services/generate/generate_service.go`，从请求中提取配置并传递给 LLM 服务。
5.  **测试增强**: 修复并更新 `backend/internal/services/generate/generate_service_test.go` 以匹配新接口。新增 `backend/internal/services/generate/llm_service_test.go` 测试配置验证和优先级逻辑。
6.  **日志系统容错**: 增强 `backend/internal/logger/logger.go`，在配置未初始化时提供默认值，防止测试环境 panic。

**测试框架：**
- Go `testing` 标准库
- `github.com/stretchr/testify` 用于断言和 Mock

**测试结果：**
- 覆盖率：59.1% (backend/internal/services/generate)
- 通过率：100%

---

## 2026-03-04

### 前端缓存失效策略 [章节/草稿/作品变更后 works 列表及时刷新]
[2026-03-04 16:03:00] - [在会影响 works 列表展示字段的 mutation 成功后，显式 invalidate works 相关 query，避免 staleTime=5min 导致作品管理/仪表盘统计与更新时间不刷新]

**背景：**
- React Query 全局配置 `staleTime=5min`（见[`QueryProvider`](frontend/src/components/common/layout/QueryProvider.tsx:15)），works 列表在 5 分钟内默认不 refetch。
- 章节 CRUD、章节导入、草稿发布为章节会改变 works 列表依赖的字段（如 `total_word_count/total_chapter_count/updated_at`），返回作品管理页容易命中旧缓存，需要手动刷新。

**决策内容：**
- 在章节相关 hooks 的 `onSuccess` 中统一增加 `queryClient.invalidateQueries({ queryKey: ["works"], exact: false })`：
  - [`useCreateChapter()`](frontend/src/hooks/chapter/useChapterService.ts:94)
  - [`useUpdateChapter()`](frontend/src/hooks/chapter/useChapterService.ts:112)
  - [`useDeleteChapter()`](frontend/src/hooks/chapter/useChapterService.ts:137)
  - [`useImportChapters()`](frontend/src/hooks/chapter/useChapterService.ts:151)
- 在草稿发布的 `onSuccess` 中增加 works invalidate：
  - [`usePublishDraft()`](frontend/src/hooks/draft/useDraftService.ts:153)
- 在作品元数据变更（新建/更新）的 `onSuccess` 中增加 works 全量失效，确保标题/简介/封面/状态等字段更新后 works 列表/仪表盘不命中旧缓存：
  - [`useCreateWork()`](frontend/src/hooks/work/useWorkService.ts:80)
  - [`useUpdateWork()`](frontend/src/hooks/work/useWorkService.ts:94)

**影响评估：**
- 只在用户主动 mutation 成功后触发一次缓存失效；后续在需要读取 works 的页面上按需 refetch，不会形成持续/高频请求。
- `refetchOnWindowFocus=false`（见[`QueryProvider`](frontend/src/components/common/layout/QueryProvider.tsx:15)），避免切窗带来的额外请求抖动。