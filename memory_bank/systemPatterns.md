# 系统模式 (System Patterns) - 前端核心架构

本文档记录了 novel-man 项目**最终前端架构设计蓝图**的核心模式，作为所有前端开发工作的最高准则。

## 1. 设计哲学

-   **类型安全至上 (Type-Safety First):** 整个应用的数据流必须是端到端类型安全的。
-   **关注点分离 (Separation of Concerns):** 严格划分 UI、状态管理、业务逻辑和数据获取的边界。
-   **自动化驱动 (Automation-Driven):** 重复性的工作必须通过工具链自动化，以保证一致性和效率。
-   **设计系统先行 (Design System First):** 所有 UI 都必须基于一个统一的、由 Token 驱动的设计系统。

## 2. 技术栈与工具链

-   **核心框架:** Next.js (App Router), React
-   **语言:** TypeScript (Strict Mode)
-   **UI & 样式:** `shadcn/ui`, `Radix UI`, `Tailwind CSS`, `CVA`
-   **状态管理:** `@tanstack/react-query` (服务端), `Zustand` (客户端)
-   **数据请求:** `Axios`
-   **表单处理:** `React Hook Form` + `Zod`
-   **API 代码生成:** `Orval` (核心工具，用于生成类型和 `react-query` 客户端)
-   **包管理器:** `pnpm`

## 3. 分层数据流架构 (核心模式)

严格遵循“关注点分离”原则，所有数据请求必须遵循以下流程：

**UI Component -> Hook -> Service -> Generated Client -> BFF**

1.  **UI Layer (Components)**: 职责是渲染 UI 和处理用户交互。**规范**: 只通过 Hooks 获取数据和执行操作。
2.  **Hooks Layer**: 使用 `@tanstack/react-query` 连接 UI 与业务逻辑，管理服务端状态（缓存、加载、错误）。**规范**: 每个核心数据实体都有对应的 Hooks。
3.  **Services Layer**: 封装业务逻辑，为 Hooks 提供清晰的函数。此处可组合多个 Generated Client 调用。
4.  **Generated Client Layer**: 由 `Orval` 自动生成，提供类型安全的、基于 `react-query` 的 Hooks。**规范**: 禁止手动修改，通过 `pnpm api:generate` 更新。
5.  **Axios Instance**: 统一的 HTTP 客户端，负责请求 BFF，并通过拦截器处理认证和全局错误。

## 4. BFF (Backend for Frontend) 策略

采用**混合模式**:
-   **默认透明代理**: `axios` 默认请求 `/api/proxy/[...path]`，由 `Orval` 生成的客户端自动使用。
-   **按需抽象代理**: 复杂场景下（如 API 聚合），创建专门的 API 路由，并**复用** `Orval` 生成的客户端代码。

## 5. 组件系统设计

-   **基础层 (Headless UI)**: 使用 `Radix UI` (通过 `shadcn/ui`) 提供功能完备、可访问性强的无样式组件。
-   **样式层 (Styling)**: 使用 `Tailwind CSS` 注入样式，通过 CSS 变量支持主题化。
-   **变体层 (Variants)**: 使用 `CVA` (class-variance-authority) 管理组件的所有视觉变体，确保类型安全。

## 6. 核心开发工作流

1.  **API 定义先行**: 后端提供或更新 `swagger.json`。
2.  **前端自动化同步**: 开发者在前端项目根目录运行 `pnpm api:generate` 命令。
3.  **代码实现**: 遵循分层数据流架构，从 Service 层开始，逐层向上实现业务逻辑和 UI。

## 7. 核心组件实现清单 (MVP)

### 7.1. 核心原子组件库

| 组件类别 | 核心组件 | 依赖/实现技术 | 核心职能 |
| :--- | :--- | :--- | :--- |
| **布局 & 容器** | `Card`, `Dialog`, `Popover`, `Tooltip`, `Resizable Panel` | `shadcn/ui`, `Radix UI` | 内容组织、模态交互、信息提示、可伸缩布局 |
| **表单 & 输入** | `Button`, `Input`, `Select`, `Switch`, `Checkbox`, `Label`, `Form` | `shadcn/ui`, `React Hook Form`, `Zod`, `CVA` | 用户交互、数据提交、状态管理与校验 |
| **数据展示** | `Table`, `Avatar`, `Badge`, `Progress`, `Data List` | `shadcn/ui`, `TanStack Table` | 结构化数据显示、身份标识、状态展示、列表渲染 |
| **导航** | `Dropdown Menu`, `Tabs`, `Navigation Menu`, `Pagination` | `shadcn/ui` | 页面与功能导航、视图切换、分页控制 |
| **反馈 & 通知** | `Sonner (Toast)`, `Alert`, `Skeleton` | `Sonner`, `shadcn/ui` | 操作反馈、状态通知、加载状态指示 |

### 7.2. 功能与业务组件

| 组件类别 | 核心组件 | 依赖/实现技术 | 核心职能 |
| :--- | :--- | :--- | :--- |
| **核心布局** | `MainLayout`, `Sidebar`, `Header` | `Resizable Panel`, `Navigation Menu`, `Dropdown Menu` | 搭建应用主界面框架，提供全局导航与用户入口 |
| **核心功能** | `Editor` (富文本编辑器) | `Tiptap`, `shadcn/ui` | 提供稳定、高效的写作和格式化体验 |
| | `AIAssistant` (AI 助手) | `React Query`, `Sonner`, `Popover` | 在编辑器中提供 AI 续写、润色等上下文服务 |
| **业务-作品管理** | `WorkCard`, `WorkList` | `Card`, `Data List`, `React Query` | 展示和管理用户的作品列表 |
| | `WorkForm` (创建/编辑) | `Form`, `Dialog`, `React Hook Form` | 用于创建和编辑作品信息 |
| **业务-内容管理**| `ChapterList`, `DraftList` | `Data List`, `React Query`, `Table` | 管理和展示章节、草稿列表 |
| **业务-素材管理**| `CharacterCard`, `WorldviewItemCard` | `Card`, `Avatar`, `Badge` | 展示和管理角色与世界观设定 |
| **认证与用户** | `LoginForm`, `RegisterForm` | `Form`, `Card`, `React Hook Form` | 处理用户登录和注册流程 |
| | `UserNav` (用户导航菜单) | `Dropdown Menu`, `Avatar` | 展示用户登录状态，提供设置、登出入口 |
| **应用设置** | `SettingsForm`, `ThemeToggle` | `Form`, `Tabs`, `Switch` | 允许用户修改应用主题、编辑器及 AI 等偏好设置 |
