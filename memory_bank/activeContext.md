# AI 助手 V1.0 开发 - 活动上下文

**最后更新时间:** 2025-09-08T18:17:00Z

## 当前阶段

**阶段一：核心功能 MVP**

## 当前焦点

**任务 3 (待委派): 前端重构 - AI 服务与状态管理**

- **状态**: 准备中
- **依赖**: 任务 2 (后端统一生成接口) 已完成。
- **目标**:
  1.  **创建 Prompt 服务**: 创建一个新的服务文件 `frontend/src/lib/services/prompt.service.ts`，用于处理对 `/api/prompts` 接口的 CRUD 调用。
  2.  **重构 AI 服务**: 重构现有的 `frontend/src/lib/services/ai.service.ts`。移除所有独立的功能性调用（如 `getCompletionService`），并创建一个统一的 `generate` 函数，使其调用新的 `POST /api/generate` 接口。同时，添加一个 `getAssistantTypes` 函数来调用 `GET /api/generate`。
  3.  **更新状态管理**: 更新 `frontend/src/hooks/ai/useAIAssistant.ts` 这个 React Hook，使其使用新的 `prompt.service.ts` 和重构后的 `ai.service.ts` 来获取数据和发送请求。
- **下一步**: 将此任务委派给 `code-developer` 模式。
