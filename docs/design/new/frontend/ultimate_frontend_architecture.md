# 最终前端架构设计蓝图 (Ultimate Frontend Architecture)

## 1. 概述与设计哲学

本设计旨在构建一个**标杆级**的前端应用。它不仅要实现业务功能，更要在**架构清晰性、开发体验、长期可维护性和用户体验**上达到业界顶尖水平。

我们的核心设计哲学是：
-   **类型安全至上 (Type-Safety First):** 整个应用的数据流必须是端到端类型安全的。
-   **关注点分离 (Separation of Concerns):** 严格划分 UI、状态管理、业务逻辑和数据获取的边界。
-   **自动化驱动 (Automation-Driven):** 重复性的工作必须通过工具链自动化，以保证一致性和效率。
-   **设计系统先行 (Design System First):** 所有 UI 都必须基于一个统一的、由 Token 驱动的设计系统。

## 2. 技术栈与工具链

-   **核心框架:** Next.js (App Router), React
-   **语言:** TypeScript (Strict Mode)
-   **UI & 样式:**
    -   **基础组件库:** `shadcn/ui` + `Radix UI` (提供无样式的、功能完备且符合 WAI-ARIA 可访问性标准的基础组件)
    -   **样式方案:** `Tailwind CSS` (原子化、功能类优先的 CSS 框架)
    -   **组件变体管理:** `class-variance-authority (CVA)` (用于创建类型安全的、可组合的组件视觉变体)
    -   **主题化:** 通过 `CSS 变量` 实现明暗主题切换和设计 Token 管理。
-   **状态管理:**
    -   **服务端状态:** `@tanstack/react-query` (负责缓存、同步、更新服务器数据)
    -   **客户端状态:** `Zustand` (用于管理全局的、与 UI 相关的状态，如侧边栏的展开/折叠)
-   **数据请求:**
    -   **HTTP 客户端:** `Axios` (通过拦截器实现统一的认证和错误处理)
-   **表单处理:**
    -   **状态管理:** `React Hook Form`
    -   **校验:** `Zod`
-   **动画库:** `Framer Motion`
-   **图标库:** `Lucide React`
-   **工程化与代码生成:**
    -   **包管理器:** pnpm (通过 `packageManager` 字段强制)
    -   **API 代码生成:** `Orval` (统一负责类型和 `react-query` 客户端生成)
    -   **代码格式化:** Prettier

## 3. 宏观架构图

```
+------------------+      +------------------------+      +---------------------+      +-----------------+
|   Browser (UI)   |----->| Next.js Server (BFF)   |----->|  Backend API Server |----->|    Database     |
| (React Components)|      | (localhost:3000)       |      | (localhost:8080)    |      | (PostgreSQL/MySQL)|
+------------------+      +-----------+------------+      +---------------------+      +-----------------+
                            |           ^
                            |           |
      (Client-Side Request) |           | (Server-Side Forwarding)
                            v           |
                        +--------------------------+
                        |   /api/proxy/[...path]   |
                        | (Security Middlewares)   |
                        |  - Authentication        |
                        |  - Rate Limiting         |
                        +--------------------------+
```

## 4. 数据流架构：分层模型

这是我们前端应用内部的核心架构，严格遵循“关注点分离”原则。

**请求流程: UI Component -> Hook -> Service -> Generated Client -> BFF**

```
+--------------------------+
|   UI Layer (Components)  |  职责: 渲染 UI, 处理用户交互
|   (e.g., <WorkList />)   |  规范: 只通过 Hooks 获取数据和执行操作
+------------+-------------+
             |
             v (useWorksQuery())
+------------+-------------+
|     Hooks Layer          |  职责: 使用 React Query 连接 UI 与业务逻辑, 管理服务端状态 (loading, error, cache)
| (e.g., useWorksQuery.ts) |  规范: 每个核心数据实体都有对应的 Hooks
+------------+-------------+
             |
             v (workService.getAll())
+------------+-------------+
|    Services Layer        |  职责: 封装业务逻辑, 为 Hooks 提供清晰的函数。它决定调用哪个 Generated Client 函数。
| (e.g., work.service.ts)  |  规范: 此处可组合多个 Generated Client 调用
+------------+-------------+
             |
             v (getWorks())
+------------+-------------+
| Generated Client Layer   |  职责: 由 Orval 自动生成, 提供类型安全的、基于 react-query 的 Hooks
| (e.g., /generated/works) |  规范: 禁止手动修改, 通过 `pnpm api:generate` 更新
+------------+-------------+
             |
             v (customInstance(config))
+------------+-------------+
|      Axios Instance      |  职责: 统一的 HTTP 客户端, 负责请求 BFF, 并通过拦截器处理认证和全局错误
|    (axios.ts)            |
+--------------------------+
```

## 5. BFF (Backend for Frontend) 策略

我们的 BFF 采用**混合模式**，兼顾开发效率与架构灵活性。

-   **默认透明代理:** `axios` 默认请求 `/api/proxy/[...path]`。所有由 `Orval` 生成的客户端都将自动通过此代理，享受自动化带来的高效率。
-   **安全增强:** 此代理将内置**强制认证**和**速率限制**中间件，作为应用的第一道安全屏障。
-   **按需抽象代理:** 当遇到 API 聚合等复杂场景时，我们会创建专门的 API 路由（如 `/api/dashboard`），在此路由中，我们将**复用**由 `Orval` 生成的客户端代码来安全地调用后端 API。

## 6. 目录结构核心约定

```
frontend/
├── src/
│   ├── app/                # Next.js App Router (UI Layer)
│   ├── components/         # 通用 UI 组件
│   ├── hooks/              # 自定义 React Query Hooks (Hooks Layer)
│   ├── lib/
│   │   ├── api/
│   │   │   └── generated/  # Orval 生成的 API Client (Generated Client Layer) - 禁止手动修改
│   │   ├── services/       # 手动编写的业务服务 (Services Layer)
│   │   └── axios.ts        # 全局 Axios 实例
│   ├── types/
│   │   └── next-auth.d.ts
│   └── ...
├── docs/
│   └── design/
│       └── new/
│           └── frontend/   # 所有前端设计文档归档于此
├── orval.config.js         # Orval 配置文件
└── package.json            # 项目依赖与脚本
```

## 7. 组件系统设计

我们的组件系统遵循“组合优于继承”和“样式与逻辑分离”的核心原则。

-   **设计原则:**
    1.  **基础层 (Headless UI):** 我们利用 `Radix UI` (通过 `shadcn/ui`) 作为所有组件的基础。它提供了强大的功能、状态管理和至关重要的可访问性（A11y），但不包含任何样式。
    2.  **样式层 (Styling):** 我们使用 `Tailwind CSS` 为基础组件注入样式。所有设计 Token（颜色、间距、字体等）都将通过 CSS 变量定义在 `globals.css` 中，以支持主题化。
    3.  **变体层 (Variants):** 我们使用 `CVA` 来管理一个组件的所有视觉变体（例如按钮的 `variant` 和 `size`）。这使得组件的 API 类型安全、可预测且易于扩展。

-   **组件分类:**
    -   **原子组件 (`/src/components/ui`):** 这是我们设计系统的基础，直接由 `shadcn/ui` 命令生成并根据我们的设计规范进行定制。例如 `Button`, `Input`, `Card`, `Dialog`。
    -   **复合组件 (`/src/components/common`):** 由多个原子组件组合而成，用于处理特定的、可复用的业务场景。例如 `UserAvatar` (可能由 Avatar, Tooltip 组成) 或 `PageHeader`。

-   **核心组件库清单 (MVP):**

| 组件类别 | 核心组件 | 依赖/实现技术 | 核心职能 |
| :--- | :--- | :--- | :--- |
| **布局 & 容器** | `Card`, `Dialog`, `Popover`, `Tooltip`, `Resizable Panel` | `shadcn/ui`, `Radix UI` | 内容组织、模态交互、信息提示、可伸缩布局 |
| **表单 & 输入** | `Button`, `Input`, `Select`, `Switch`, `Checkbox`, `Label`, `Form` | `shadcn/ui`, `React Hook Form`, `Zod`, `CVA` | 用户交互、数据提交、状态管理与校验 |
| **数据展示** | `Table`, `Avatar`, `Badge`, `Progress`, `Data List` | `shadcn/ui`, `TanStack Table` | 结构化数据显示、身份标识、状态展示、列表渲染 |
| **导航** | `Dropdown Menu`, `Tabs`, `Navigation Menu`, `Pagination` | `shadcn/ui` | 页面与功能导航、视图切换、分页控制 |
| **反馈 & 通知** | `Sonner (Toast)`, `Alert`, `Skeleton` | `Sonner`, `shadcn/ui` | 操作反馈、状态通知、加载状态指示 |

-   **功能与业务组件清单 (MVP):**

组件类别 | 核心组件 | 依赖/实现技术 | 核心职能 |
:--- | :--- | :--- | :--- |
**核心布局** | `MainLayout`, `Sidebar`, `Header` | `Resizable Panel`, `Navigation Menu`, `Dropdown Menu` | 搭建应用主界面框架，提供全局导航与用户入口 |
**核心功能** | `Editor` (富文本编辑器) | `Tiptap`, `shadcn/ui` | 提供稳定、高效的写作和格式化体验 |
| `AIAssistant` (AI 助手) | `React Query`, `Sonner`, `Popover` | 在编辑器中提供 AI 续写、润色等上下文服务 |
**业务-作品管理** | `WorkCard`, `WorkList` | `Card`, `Data List`, `React Query` | 展示和管理用户的作品列表 |
| `WorkForm` (创建/编辑) | `Form`, `Dialog`, `React Hook Form` | 用于创建和编辑作品信息 |
**业务-内容管理**| `ChapterList`, `DraftList` | `Data List`, `React Query`, `Table` | 管理和展示章节、草稿列表 |
**业务-素材管理**| `CharacterCard`, `WorldviewItemCard` | `Card`, `Avatar`, `Badge` | 展示和管理角色与世界观设定 |
**认证与用户** | `LoginForm`, `RegisterForm` | `Form`, `Card`, `React Hook Form` | 处理用户登录和注册流程 |
| `UserNav` (用户导航菜单) | `Dropdown Menu`, `Avatar` | 展示用户登录状态，提供设置、登出入口 |
**应用设置** | `SettingsForm`, `ThemeToggle` | `Form`, `Tabs`, `Switch` | 允许用户修改应用主题、编辑器及 AI 等偏好设置 |

## 8. 工程化规范

-   **包管理器:** 通过 `packageManager` 字段强制使用 `pnpm`。
-   **API 同步:** 开发者应通过运行 `pnpm api:generate` 命令，一键从后端 `swagger.json` 更新所有 API 类型和客户端代码。此命令由 `Orval` 驱动。
-   **代码质量:** 通过 `ESLint` 和 `Prettier` 保证代码风格和质量的一致性。