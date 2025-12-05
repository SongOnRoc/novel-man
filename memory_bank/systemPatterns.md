# 系统模式 (System Patterns)

## 架构概览
本项目采用全栈架构，分离的前端和后端服务。

### 前端 (Frontend)
- **框架**: Next.js 15 (React 19)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand, React Query (@tanstack/react-query)
- **编辑器**: Tiptap (基于 ProseMirror)
- **UI 组件库**: Radix UI, Lucide React
- **认证**: NextAuth.js

### 后端 (Backend)
- **语言**: Go (Golang) 1.24
- **Web 框架**: Gin
- **ORM**: GORM (支持 MySQL, Postgres, SQLite)
- **API 文档**: Swagger (gin-swagger)
- **依赖注入**: Dig (Uber)
- **配置管理**: Viper
- **架构模式**: 模块化单体 (Modular Monolith) / 整洁架构 (Clean Architecture)
    - `internal/apps`: 业务模块入口
    - `internal/controllers`: HTTP 处理层
    - `internal/services`: 业务逻辑层
    - `internal/repositories`: 数据访问层
    - `internal/models`: 数据模型

## 关键技术栈
- **生成模块 (Generate Module)**:
    - **位置**: `internal/apps/generate`
    - **职责**: 统一处理 AI 生成请求 (文本生成、对话、润色)。
    - **实现**: 集成 `tmc/langchaingo`。
    - **通信**: 支持标准 JSON 响应和 Server-Sent Events (SSE) 流式响应 (通过 `stream` 参数控制)。
    - **接口**:
        - `POST /api/v1/generate`: 通用生成接口 (支持 Chat/Completion 模式)。
        - `GET /api/v1/generate`: 获取可用助手类型。
- **AI 集成**: 计划使用 LangChain (Go) 或直接 LLM API 集成。
- **数据库**: 支持多种 SQL 数据库，通过 GORM 抽象。

## 设计模式
- **依赖注入**: 后端广泛使用 `dig` 容器进行依赖管理。
- **Repository 模式**: 数据访问与业务逻辑分离。
- **Feature-based Folder Structure**: 前端采用基于功能的目录结构 (`src/features`)。