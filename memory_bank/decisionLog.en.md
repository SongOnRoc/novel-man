# Decision Log

## 2025-12-07

### Implementation [Backend LLM Service Refactor]
[2025-12-07 21:39:00] - [Refactor backend LLM service to support high concurrency, multi-tenant configuration isolation, and hot reload]

**Implementation details:**
1. **Concurrency-safe configuration**: Introduced `sync.RWMutex` to protect global config `Cfg` in [`backend/internal/config/config.go`](backend/internal/config/config.go:1), and added `GetLLMConfig()` for thread-safe reads.
2. **Stateless LLM service**: Refactored [`backend/internal/services/generate/llm_service.go`](backend/internal/services/generate/llm_service.go:1) to remove long-lived client fields from `llmService`. Implemented `createClient` to dynamically create an LLM client per request based on system config and request-level overrides (BYOK).
3. **Request-level overrides**: Updated [`backend/internal/models/generate.go`](backend/internal/models/generate.go:1) by adding `Model`, `APIKey`, and `BaseURL` fields to `GenerateRequest`, allowing clients to override defaults.
4. **Business logic adaptation**: Modified [`backend/internal/services/generate/generate_service.go`](backend/internal/services/generate/generate_service.go:1) to extract config from the request and pass it to the LLM service.
5. **Test enhancements**: Fixed and updated [`backend/internal/services/generate/generate_service_test.go`](backend/internal/services/generate/generate_service_test.go:1) to match the new interface. Added [`backend/internal/services/generate/llm_service_test.go`](backend/internal/services/generate/llm_service_test.go:1) to test config validation and precedence.
6. **Logging fault tolerance**: Improved [`backend/internal/logger/logger.go`](backend/internal/logger/logger.go:1) to provide defaults when config is not initialized, preventing panics in test environments.

**Test stack:**
- Go standard library `testing`
- `github.com/stretchr/testify` for assertions and mocks

**Test results:**
- Coverage: 59.1% (`backend/internal/services/generate`)
- Pass rate: 100%

---

## 2026-03-04

### Frontend Cache Invalidation Strategy [Ensure works list refreshes after chapter/draft/work mutations]
[2026-03-04 16:03:00] - [Explicitly invalidate works-related queries after mutations that affect fields shown on the works list, to avoid stale UI caused by a global `staleTime=5min`]

**Background:**
- React Query global config uses `staleTime=5min` (see [`QueryProvider`](frontend/src/components/common/layout/QueryProvider.tsx:15)), so the works list will not refetch within 5 minutes by default.
- Chapter CRUD, chapter import, and publishing a draft into a chapter change fields used by the works list (e.g., `total_word_count`, `total_chapter_count`, `updated_at`). Navigating back to works pages could hit cached data, requiring manual refresh.

**Decision:**
- Add `queryClient.invalidateQueries({ queryKey: ["works"], exact: false })` in the `onSuccess` handlers of chapter-related hooks:
  - [`useCreateChapter()`](frontend/src/hooks/chapter/useChapterService.ts:94)
  - [`useUpdateChapter()`](frontend/src/hooks/chapter/useChapterService.ts:112)
  - [`useDeleteChapter()`](frontend/src/hooks/chapter/useChapterService.ts:137)
  - [`useImportChapters()`](frontend/src/hooks/chapter/useChapterService.ts:151)
- Add works invalidation in the `onSuccess` handler of draft publish:
  - [`usePublishDraft()`](frontend/src/hooks/draft/useDraftService.ts:153)
- Add broader works invalidation after work metadata changes (create/update), ensuring that changes to title/description/cover/status/etc. do not remain stale on the works list and dashboard:
  - [`useCreateWork()`](frontend/src/hooks/work/useWorkService.ts:80)
  - [`useUpdateWork()`](frontend/src/hooks/work/useWorkService.ts:94)

**Impact assessment:**
- Invalidation is triggered only after user-initiated mutations succeed, resulting in at most one on-demand refetch when works data is next needed; this does not cause continuous/high-frequency requests.
- `refetchOnWindowFocus=false` (see [`QueryProvider`](frontend/src/components/common/layout/QueryProvider.tsx:15)), preventing extra request churn on window focus changes.
