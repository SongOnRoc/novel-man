# 决策日志 (Decision Log)

## 2025-12-05: 项目初始化与 Memory Bank 建立

- **背景**: 项目是一个小说写作平台，需要集成 AI 写作助手。为了更好地管理项目上下文和开发进度，决定引入 Memory Bank 机制。
- **决策**:
    1.  建立标准的 Memory Bank 结构 (`productContext`, `activeContext`, `systemPatterns`, `progress`, `decisionLog`)。
    2.  确认技术栈为 Next.js (前端) + Go (后端)。
    3.  当前开发重点锁定在 "AI 写作助手" 功能的实现。
- **影响**:
    -  后续所有开发任务将基于 Memory Bank 中的上下文进行。
    -  AI 功能的实现将优先考虑后端 `internal/apps/ai` 模块的开发和前端 `Tiptap` 编辑器的集成。

---
### 代码实现 [Generate Module Stream Support]
[2025-12-05 15:01:00] - [实现后端 AI 生成功能的流式增强]

**实现细节：**
1.  **LangChainGo 集成**: 引入 `github.com/tmc/langchaingo` 作为 LLM 交互层，支持 OpenAI 协议。
2.  **LLMService**: 创建了 `internal/services/generate/llm_service.go`，封装了 `Generate` 和 `GenerateStream` 方法，支持通过配置 (`config.yaml`) 动态加载 API Key 和 BaseURL。
3.  **流式接口设计**:
    -   `GenerateRequest` 模型新增 `Stream` (bool) 字段。
    -   `GenerateController` 根据 `Stream` 字段切换响应模式：普通 JSON 响应或 SSE (Server-Sent Events) 流式响应。
    -   SSE 格式规范化为 `data: {"content": "...", "done": false}`。
4.  **依赖注入**: 更新 `internal/apps/generate/module.go`，将 `LLMService` 注入到 `GenerateService` 中。

**测试框架：**
-   使用 Go 标准库 `testing` 配合 `github.com/stretchr/testify` 进行断言和 Mock。
-   创建 `MockLLMService` 模拟 LLM 行为，隔离外部 API 依赖。

**测试结果：**
-   覆盖率：`internal/services/generate` 包逻辑覆盖率接近 100% (排除 `llm_service.go` 的真实调用)。
-   通过率：100% (所有单元测试通过)。