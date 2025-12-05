# 活动上下文 (Active Context)

## 当前焦点
增强后端生成模块 (`internal/apps/generate`)，集成 LangChainGo 以支持流式 AI 写作助手功能。

## 最近变更
- [架构调整] 确认复用现有的 `internal/apps/generate` 模块，而不是新建 `ai` 模块。
- [架构设计] 规划在 `GenerateController` 中增加流式响应 (SSE) 支持。

## 待办事项
- [ ] 改造 `internal/apps/generate` 支持 LangChain
- [ ] 实现 `GenerateText` 的流式模式 (SSE)
- [ ] 更新 `models.GenerateRequest` 支持 `stream` 参数
- [ ] 前端适配流式接口
- [x] 为 `backend/internal/services/generate` 生成单元测试

## 活跃决策
- **模块复用**: 基于现有的 `generate` 模块扩展，保持 API 统一性。
- **流式协议**: 使用 Server-Sent Events (SSE) 处理流式生成，客户端通过 `stream: true` 触发。
- **LangChain 集成**: 在 `internal/services/generate` 中引入 `tmc/langchaingo` 作为底层引擎。