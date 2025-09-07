# AI 助手 V1.0 产品核心上下文

**更新时间:** 2025-09-08T15:04:10Z

## 1. 核心目标

本次迭代旨在将应用内的AI功能从一个基础框架重构为一个统一、可扩展、用户驱动的AI助手平台。核心目标包括：

- **统一体验**: 将所有AI生成功能整合至统一的API (`/api/generate`) 和UI入口。
- **赋能用户**: 提供强大的提示词库管理功能 (`/api/prompts`)，让用户可以创建、保存、复用自己的提示词。
- **开放灵活**: 支持用户配置自己的AI模型，满足个性化需求 (V2.0 范围)。

## 2. 项目范围 (V1.0 MVP)

- **后端**:
  - 实现统一生成接口 (`/api/generate`)，支持基于助手类型和提示词ID的文本生成。
  - 实现提示词管理接口 (`/api/prompts`) 的完整CRUD功能。
  - 创建 `prompts` 和 `user_ai_custom_settings` 数据库表。
- **前端**:
  - 重构AI服务 (`ai.service.ts`) 以对接新接口。
  - 创建一个全新的提示词管理界面。
  - 实现基础的助手类型选择功能。
  - 实现基于系统内置提示词的快捷AI工具（如扩写、缩写）。

## 3. 关键数据模型

### 3.1. Prompt 模型

- **表名**: `prompts`
- **关键字段**: `ID`, `UserID`, `Title`, `Content`, `Type` ('user' or 'system'), `Tags`, `IsSystem`

### 3.2. UserAICustomSetting 模型

- **表名**: `user_ai_custom_settings`
- **关键字段**: `ID`, `UserID`, `Name`, `BaseURL`, `ModelName`, `APIKey`

*该文档是对 `docs/prd/ai_assistant_v1_prd.md` 和 `docs/design/new/ai_tools_requirement_analysis_report.md` 的核心内容摘要，用于指导开发任务。*
