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