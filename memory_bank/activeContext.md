# 活动上下文 (Active Context)

## 当前焦点
增强后端生成模块 (`internal/apps/generate`)，集成 LangChainGo 以支持流式 AI 写作助手功能。

## 最近变更
- [Bug修复] 修复后端 `generate` 模块未注册导致 404 的问题 (`backend/internal/cmd/construct.go`)。
- [Bug修复] 修复前端代理 `/health` 接口被鉴权拦截的问题 (`frontend/src/app/api/proxy/[...path]/route.ts`)。
- [Bug修复] 修复 LLM 服务初始化 Panic 问题，增加容错机制，允许无 API Key 启动 (`backend/internal/services/generate/llm_service.go`)。
- [Bug修复] 修复前端代理 (`Next.js API Route`) 不支持 SSE 流式透传的问题，导致前端无法接收 AI 流式响应 (`frontend/src/app/api/proxy/[...path]/route.ts`)。
- [Bug修复] 修复前端 `ai.service.ts` 忽略后端 SSE 错误字段的问题，确保错误信息能透传到 UI。
- [体验优化] 优化前端 AI 聊天界面的状态更新逻辑，解决流式响应初期显示卡顿或一直显示占位符的问题 (`frontend/src/features/ai/components/chat/AIChatInterface.tsx`)。
- [体验优化] 优化 AI 思考状态显示逻辑，确保在流式内容开始输出后自动隐藏“正在思考”提示 (`frontend/src/features/ai/components/chat/AIChatInterface.tsx`)。
- [体验优化] 优化输入与控制逻辑：生成过程中允许输入但禁止发送，发送按钮变为停止按钮，支持中途停止生成 (`frontend/src/features/ai/components/chat/AIChatInterface.tsx`)。
- [配置更新] 更新 `config.yaml` 添加 LLM 配置段。
- [功能增强] 在后端 `generate` 模块中添加 AI 响应日志打印，方便调试 (`backend/internal/services/generate/generate_service.go`, `llm_service.go`)。

## 待办事项
- [ ] 改造 `internal/apps/generate` 支持 LangChain (已集成基础结构，需完善 Prompt 模板)
- [ ] 实现 `GenerateText` 的流式模式 (SSE) (已实现基础逻辑，需前端对接验证)
- [ ] 更新 `models.GenerateRequest` 支持 `stream` 参数 (已完成)
- [ ] 前端适配流式接口 (已完成基础 Fetch 逻辑)
- [x] 为 `backend/internal/services/generate` 生成单元测试

## 活跃决策
- **模块复用**: 基于现有的 `generate` 模块扩展，保持 API 统一性。
- **流式协议**: 使用 Server-Sent Events (SSE) 处理流式生成，客户端通过 `stream: true` 触发。
- **LangChain 集成**: 在 `internal/services/generate` 中引入 `tmc/langchaingo` 作为底层引擎。
- **容错启动**: 允许 LLM 服务在无 API Key 状态下启动，推迟错误到调用时。