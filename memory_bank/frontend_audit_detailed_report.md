# 前端架构详细审计报告

## 1. 引言

**审计日期:** 2025-08-16
**审计目标:** 本报告旨在对 `frontend` 项目的所有核心功能模块进行一次无遗漏的、包含技术细节的端到端审计。审计将严格对照官方架构蓝图，验证每个模块的数据流、状态管理和组件实现，以提供一份完整、详尽的差距分析和重构指南。

**审计方法:**
1.  **全面性:** 审计范围覆盖所有用户可见的核心功能页面和组件。
2.  **深入性:** 对每个功能模块，都将进行从 UI 层到 Generated Client 层的完整数据流追溯。
3.  **细节导向:** 报告将包含对关键代码文件的分析，明确指出符合项和差距。

---

## 2. 模块审计：认证 (Auth)

- **审计范围:** 登录流程 (`/login`)、注册流程 (`/register`)
- **审计状态:** <span style="color:green;">**高度符合**</span>

### 2.1. 技术细节分析

#### 2.1.1. 数据流：注册

注册流程严格遵循了架构蓝图定义的分层模型：

1.  **UI Layer (`/register/page.tsx`):**
    -   页面组件通过 `useRegisterMutation()` Hook 获取 `mutate` 函数。
    -   表单提交时，调用 `mutate(registerData)` 触发注册流程。
    -   **符合性:** <span style="color:green;">符合</span>。UI 层仅与 Hook 交互。

2.  **Hooks Layer (`/hooks/auth/useRegisterMutation.ts`):**
    -   `useRegisterMutation` 是一个标准的 `@tanstack/react-query` mutation hook。
    -   其 `mutationFn` 属性被定义为 `(data) => registerService(data)`。
    -   **符合性:** <span style="color:green;">符合</span>。Hook 层负责调用 Service 层。

3.  **Services Layer (`/lib/services/auth.service.ts`):**
    -   `registerService` 函数直接调用了 `postAuthRegister(data)`。
    -   `postAuthRegister` 是从自动生成的客户端代码中导入的。
    -   **符合性:** <span style="color:green;">符合</span>。Service 层负责调用 Generated Client 层。

4.  **Generated Client Layer (`/lib/api/generated/auth/auth.ts`):**
    -   `postAuthRegister` 是由 Orval 根据 `swagger.json` 自动生成的，它会使用全局的 `axios` 实例发起 API 请求。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 2.1.2. 数据流：登录

登录流程采用了基于 `NextAuth` 的更安全的实现，同样符合分层思想：

1.  **UI Layer (`/login/page.tsx`):**
    -   页面组件通过 `useAuth()` Hook 获取 `login` 函数。
    -   表单提交时，调用 `login(values)` 触发登录流程。
    -   **符合性:** <span style="color:green;">符合</span>。UI 层仅与 Hook 交互。

2.  **Hooks Layer (`/hooks/auth/useAuth.ts`):**
    -   `login` 函数封装了 `next-auth/react` 的 `signIn('credentials', ...)` 方法。
    -   它没有直接调用 Service，而是将认证委托给了 `NextAuth` 框架。
    -   **符合性:** <span style="color:green;">符合</span>。这是一个特殊但更安全的实现，遵循了安全优先的设计原则。`NextAuth` 会在服务端安全地处理凭据验证。

#### 2.1.3. 组件实现

-   登录和注册页面的表单 UI 均由 `/components/ui` 中的原子组件（`Card`, `Button`, `Input`, `Form`）构成。
-   表单状态管理和校验由 `react-hook-form` 和 `zod` 处理。
-   **符合性:** <span style="color:green;">符合</span>。

### 2.2. 结论与建议

-   **结论:** 认证模块的实现非常出色，无论是标准的注册流程还是基于 `NextAuth` 的登录流程，都严格遵循了分层、安全和自动化的核心架构原则。
-   **建议:** 无。应将此模块的实现作为其他模块的参考范例。

---

## 3. 模块审计：作品管理 (Works)

- **审计范围:** 作品列表 (`/works`)、新建作品 (`/works/new`)、编辑作品 (`/works/[id]/edit`)
- **审计状态:** <span style="color:green;">**高度符合**</span>

### 3.1. 技术细节分析

#### 3.1.1. 数据流

作品管理的所有核心功能（CRUD）都严格遵循了架构蓝图定义的分层模型：

1.  **UI Layer (`/app/(main)/works/**/*.tsx`):**
    -   `WorksPage` 调用 `useWorkList()` 和 `useDeleteWork()`。
    -   `NewWorkPage` 调用 `useCreateWork()`。
    -   `EditWorkPage` 调用 `useWorkById()` 和 `useUpdateWork()`。
    -   **符合性:** <span style="color:green;">符合</span>。UI 层仅与 Hooks 交互。

2.  **Hooks Layer (`/hooks/work/useWorkService.ts`):**
    -   所有相关的 Hooks (`useWorkList`, `useCreateWork`, `useUpdateWork`, `useDeleteWork`, `useWorkById`) 都是标准的 `@tanstack/react-query` hooks。
    -   每个 Hook 都正确地调用了 `work.service.ts` 中对应的 Service 函数。
    -   **符合性:** <span style="color:green;">符合</span>。

3.  **Services Layer (`/lib/services/work.service.ts`):**
    -   所有 Service 函数 (`getWorksService`, `createWorkService`, etc.) 都直接调用了从 Generated Client 中导入的相应函数 (`getWorks`, `postWorks`, etc.)。
    -   **符合性:** <span style="color:green;">符合</span>。

4.  **Generated Client Layer (`/lib/api/generated/works/works.ts`):**
    -   所有客户端函数均由 Orval 自动生成。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 3.1.2. 组件实现

-   所有相关页面的 UI 均由 `/components/ui` 中的原子组件（`Card`, `Button`, `Input`, `Form`, `Skeleton`）构成。
-   表单状态管理和校验由 `react-hook-form` 和 `zod` 处理。
-   **符合性:** <span style="color:green;">符合</span>。

### 3.2. 结论与建议

-   **结论:** 作品管理模块的数据流实现是项目中的一个**标杆**，完美地体现了分层架构的优势。
-   **建议:**
    -   **核心问题:** 当前唯一的、但非常重要的差距是**组件位置**。`WorkCard.tsx` 和 `NewWorkButton.tsx` 被放置在 `app/(main)/works/components/` 中。
    -   **重构指南:** 强烈建议创建 `src/features/works/components` 目录，并将这些与作品功能紧密相关的组件迁移过去。这能极大地提高组件的可发现性和复用性，并使 `app` 目录的职责更纯粹（只负责路由和页面布局）。

---

## 4. 模块审计：草稿管理 (Drafts)

- **审计范围:** 草稿列表 (`/drafts`, `/works/[id]/drafts`)、新建草稿 (`/drafts/new`)、编辑草稿 (`/drafts/[id]/edit`)
- **审计状态:** <span style="color:red;">**存在严重差距**</span>

### 4.1. 技术细节分析

#### 4.1.1. 数据流

草稿管理模块的数据流**没有**遵循架构蓝图，存在严重的分层错误。

1.  **UI Layer (`/app/(main)/drafts/**/*.tsx`, etc.):**
    -   UI 组件（如 `DraftsPage`, `DraftForm`）正确地调用了 `/hooks/draft/useDraftService.ts` 中的 Hooks（如 `useDraftList`, `useCreateDraft`）。
    -   **符合性:** <span style="color:green;">符合</span>。

2.  **Hooks Layer (`/hooks/draft/useDraftService.ts`):**
    -   **核心问题:** 此文件中的 Hooks **直接**导入并使用了由 Orval 自动生成的 Hooks (`useGetDrafts`, `usePostDrafts` 等)。
    -   **符合性:** <span style="color:red;">**不符合**</span>。它完全跳过了手动编写的 Service 层，直接从 Hook 层连接到了 Generated Client 层。这导致了业务逻辑与数据获取逻辑的耦合。

3.  **Services Layer (`/lib/services/draft.service.ts`):**
    -   该 Service 文件本身**存在**，并且其内部实现是正确的（正确调用了 Generated Client）。
    -   然而，该文件**未被任何 Hooks 使用**，成了一个未被利用的“孤岛”。
    -   **符合性:** 文件本身符合，但在数据流中被忽略。

#### 4.1.2. 组件实现

-   UI 组件的内部实现（使用原子组件、`react-hook-form`）是符合规范的。
-   **符合性:** <span style="color:green;">符合</span>。

### 4.2. 结论与建议

-   **结论:** 草稿管理模块在数据流分层上存在**严重的设计缺陷**。它破坏了架构的核心原则，是目前为止发现的最需要重构的模块。
-   **建议:**
    1.  **数据流重构 (最高优先级):**
        -   **必须**重构 `/hooks/draft/useDraftService.ts`。
        -   移除其中对 `useGetDrafts`, `usePostDrafts` 等 Orval Hooks 的直接依赖。
        -   将其改造为标准的 `react-query` Hooks (`useQuery`, `useMutation`)。
        -   在 `queryFn` 和 `mutationFn` 中，**必须**调用 `/lib/services/draft.service.ts` 中对应的 Service 函数（如 `getDraftsService`, `createDraftService`）。
        -   可以参考**作品管理模块**的 Hooks (`useWorkService.ts`) 作为完美的重构范例。
    2.  **组件位置重构:**
        -   与作品管理模块类似，应创建 `src/features/drafts/components` 目录。
        -   将 `DraftCard.tsx`, `draft-form.tsx`, `draft-list.tsx` 等组件统一迁移至此。
    3.  **路由结构割裂 (高优先级):**
        -   **问题:** 草稿功能被分散在 `/drafts` 和 `/works/[id]/drafts` 两个独立的路由下。
        -   **影响:** 增加了开发者的认知负荷和代码的维护难度，不符合统一资源管理的设计思想。
        -   **重构指南 (详细方案):**
            1.  **统一资源入口:** 确立 `/drafts` 为所有草稿相关操作的唯一入口。
            2.  **改造列表页面 (`/drafts/page.tsx`):**
                -   此页面需要使用 Next.js 的 `useSearchParams` hook 来读取 `workId` 查询参数。
                -   当 `workId` **存在**时 (来自 `/drafts?workId=123`)，页面应获取并显示该特定作品的草稿列表。
                -   当 `workId` **不存在**时 (来自 `/drafts`)，页面应获取并显示用户的所有草稿。
            3.  **保留单个资源路由:** `/drafts/[id]/edit` 和 `/drafts/new` 的路由是正确的，应予以保留。
            4.  **关联作品 (Work) 的方式:**
                -   **新建 (`/drafts/new`):** 必须通过查询参数传递作品ID，例如从作品页跳转时使用链接 `/drafts/new?workId=123`。在 `NewDraftPage` 中使用 `useSearchParams` 获取 `workId`，并在提交表单时将其包含在 `CreateDraftPayload` 中。
                -   **编辑 (`/drafts/[id]/edit`):** 无需从路由获取 `workId`。页面通过 `draftId` 获取的草稿数据对象中已包含 `work_id`，后端据此可知其归属。
            5.  **彻底移除冗余路由:** 删除 `/app/(main)/works/[id]/drafts` 整个目录及其下的所有页面和组件。

---

## 5. 模块审计：章节管理 (Chapters)

- **审计范围:** 章节列表 (`/chapters`, `/works/[id]/chapters`)、新建章节 (`/chapters/new`)、编辑章节 (`/chapters/[id]/edit`)
- **审计状态:** <span style="color:red;">**存在严重差距**</span>

### 5.1. 技术细节分析

#### 5.1.1. 数据流

章节管理模块的数据流与草稿模块的问题**完全相同**，没有遵循架构蓝图，存在严重的分层错误。

1.  **UI Layer (`/app/(main)/chapters/**/*.tsx`, etc.):**
    -   UI 组件正确地调用了 `/hooks/chapter/useChapterService.ts` 中的 Hooks。
    -   **符合性:** <span style="color:green;">符合</span>。

2.  **Hooks Layer (`/hooks/chapter/useChapterService.ts`):**
    -   **核心问题:** 此文件中的 Hooks **直接**导入并使用了由 Orval 自动生成的 Hooks (`useGetChapters`, `usePostChapters` 等)。
    -   **符合性:** <span style="color:red;">**不符合**</span>。它完全跳过了手动编写的 Service 层。

3.  **Services Layer (`/lib/services/chapter.service.ts`):**
    -   该 Service 文件本身**存在**，并且其内部实现是正确的。
    -   然而，该文件**未被任何 Hooks 使用**。
    -   **符合性:** 文件本身符合，但在数据流中被忽略。

#### 5.1.2. 组件实现

-   UI 组件的内部实现（使用原子组件、`react-hook-form`）是符合规范的。
-   **符合性:** <span style="color:green;">符合</span>。

### 5.2. 结论与建议

-   **结论:** 章节管理模块在数据流分层、路由组织和组件管理上存在与草稿模块类似的**严重设计缺陷**。
-   **建议:**
    1.  **数据流重构 (最高优先级):**
        -   **必须**重构 `/hooks/chapter/useChapterService.ts`。
        -   移除其中对 Orval Hooks 的直接依赖。
        -   将其改造为标准的 `react-query` Hooks (`useQuery`, `useMutation`)，并使其调用 `/lib/services/chapter.service.ts` 中对应的 Service 函数。
    2.  **路由结构重构:**
        -   与草稿模块同理，应统一所有章节相关的页面到 `/chapters` 路由下。
        -   通过查询参数 `?workId=123` 来区分不同作品的章节列表。
        -   彻底移除 `/app/(main)/works/[id]/chapters` 目录。
    3.  **组件位置重构:**
        -   创建 `src/features/chapters/components` 目录。
        -   将 `chapter-form.tsx` 和 `chapter-list.tsx` 等组件统一迁移至此。
    4.  **代码健康:**
        -   在重构过程中，确认并删除重复的 `ChapterList` 组件，只保留一个版本。

---

## 6. 模块审计：角色管理 (Characters)

- **审计范围:** 角色列表 (`/tools/characters`)、新建角色 (`/tools/characters/new`)、编辑角色 (`/tools/characters/[id]/edit`)
- **审计状态:** <span style="color:orange;">**存在差距**</span>

### 6.1. 技术细节分析

#### 6.1.1. 数据流

角色管理模块的数据流实现是健康的，严格遵循了分层模型，并正确应用了 BFF 策略。

1.  **UI Layer (`/app/(main)/tools/characters/**/*.tsx`):**
    -   UI 组件正确地调用了 `/hooks/character/useCharacters.ts` 中的 Hooks。
    -   **符合性:** <span style="color:green;">符合</span>。

2.  **Hooks Layer (`/hooks/character/useCharacters.ts`):**
    -   所有 Hooks 均为标准的 `react-query` hooks，并正确调用了 Service 层的函数。
    -   **符合性:** <span style="color:green;">符合</span>。

3.  **Services Layer (`/lib/services/characters.service.ts`):**
    -   大部分 Service 函数正确调用了 Generated Client。
    -   `getCharactersByWorkId` 函数是一个**合理**的例外：它有意地绕过 Generated Client，直接使用 `axiosInstance` 调用 BFF 聚合路由。这完全符合架构蓝图中定义的“按需抽象代理”策略。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 6.1.2. 组件与页面实现

-   **表单实现:**
    -   **核心问题:** `NewCharacterPage` 和 `EditCharacterPage` **没有**使用 `react-hook-form` 和 `zod`。它们采用了手动的 `useState` 来管理表单状态和校验。
    -   **符合性:** <span style="color:red;">**不符合**</span>。这违反了架构蓝图中对表单处理的统一规范，是本模块最主要的技术债。

-   **页面实现:**
    -   **核心问题:** 角色列表页面 `frontend/src/app/(main)/tools/characters/page.tsx` 文件**不存在**。
    -   **符合性:** <span style="color:red;">**功能缺失**</span>。

### 6.2. 结论与建议

-   **结论:** 角色管理模块的数据流是健康的，但 UI 层的实现（特别是表单）与核心功能（列表页）存在严重偏差和缺失。
-   **建议:**
    1.  **重构表单 (最高优先级):**
        -   **必须**重构 `NewCharacterPage` 和 `EditCharacterPage`。
        -   使用 `react-hook-form` 和 `zod` 来替代现有的手动 `useState` 表单逻辑，以实现统一、健壮的表单管理和校验。
    2.  **实现列表页面:**
        -   创建 `frontend/src/app/(main)/tools/characters/page.tsx` 文件。
        -   实现角色列表的展示、搜索和过滤功能。
    3.  **组件位置重构:**
        -   创建 `src/features/characters/components` 目录。
        -   将 `CharacterNode.tsx` 和 `CharacterCard.tsx` 等组件统一迁移至此。

---

## 7. 模块审计：世界观管理 (Worldview)

- **审计范围:** 世界观列表/分类 (`/tools/worldbuilding`)、新建条目 (`/tools/worldbuilding/new`)、编辑条目 (`/tools/worldbuilding/[id]/edit`)
- **审计状态:** <span style="color:orange;">**存在差距**</span>

### 7.1. 技术细节分析

#### 7.1.1. 数据流

世界观管理模块的数据流实现是健康的，严格遵循了分层模型。

1.  **UI Layer (`/app/(main)/tools/worldbuilding/**/*.tsx`):**
    -   UI 组件通过 `useWorldview()` (推测为自定义聚合 Hook) 调用了 `/hooks/worldbuilding/useWorldviewService.ts` 中的多个 Hooks。
    -   **符合性:** <span style="color:green;">符合</span>。

2.  **Hooks Layer (`/hooks/worldbuilding/useWorldviewService.ts`):**
    -   所有 Hooks 均为标准的 `react-query` hooks，并正确调用了 Service 层的函数。
    -   **符合性:** <span style="color:green;">符合</span>。

3.  **Services Layer (`/lib/services/worldview.service.ts`):**
    -   所有 Service 函数均正确调用了 Generated Client。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 7.1.2. 组件与页面实现

-   **表单实现:**
    -   **核心问题:** `WorldbuildingPage` (用于新建/编辑分类) 以及 `NewWorldItemPage` 和 `EditWorldItemPage` **没有**使用 `react-hook-form` 和 `zod`。它们采用了手动的 `useState` 来管理表单状态。
    -   **符合性:** <span style="color:red;">**不符合**</span>。

-   **代码健康:**
    -   **核心问题:** `frontend/src/components/common/lookup/WorldItemCard.tsx` 文件中的代码被**完全注释**。
    -   **符合性:** <span style="color:red;">**存在死代码**</span>。

### 7.2. 结论与建议

-   **结论:** 世界观管理模块的数据流是健康的，但与角色管理模块类似，其 UI 层的实现（特别是表单）存在严重偏差，且有死代码需要清理。
-   **建议:**
    1.  **重构表单 (最高优先级):**
        -   **必须**重构所有涉及表单操作的组件 (`CategoryDialog`, `NewWorldItemPage`, `EditWorldItemPage`)。
        -   使用 `react-hook-form` 和 `zod` 来替代现有的手动 `useState` 表单逻辑。
    2.  **清理死代码:**
        -   删除或恢复 `WorldItemCard.tsx` 组件。
    3.  **组件位置重构:**
        -   创建 `src/features/worldview/components` 目录。
        -   将与世界观功能相关的组件（如 `WorldItemCard`）统一迁移至此。

---

## 8. 模块审计：AI 助手 (AI Assistant)

- **审计范围:** AI 助手页面 (`/tools/ai-assistant`) 及相关组件 (`/components/ai-assistant/*`)
- **审计状态:** <span style="color:green;">**高度符合**</span>

### 8.1. 技术细节分析

#### 8.1.1. 数据流

AI 助手模块的数据流实现是健康的，严格遵循了分层模型。

1.  **UI Layer (`AIAssistant.tsx`, `AIResponse.tsx`):**
    -   UI 组件正确地调用了 `/hooks/ai/useAIAssistant.ts` 中的多个 mutation Hooks 来执行 AI 任务。
    -   `AIResponse` 组件还调用了 `useCreateDraft` hook 来保存内容，展示了跨模块 Hook 的正确复用。
    -   **符合性:** <span style="color:green;">符合</span>。

2.  **Hooks Layer (`/hooks/ai/useAIAssistant.ts`):**
    -   所有 Hooks 均为标准的 `react-query` `useMutation` hooks，并正确调用了 Service 层的函数。
    -   **符合性:** <span style="color:green;">符合</span>。

3.  **Services Layer (`/lib/services/ai.service.ts`):**
    -   所有 Service 函数均正确调用了 Generated Client。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 8.1.2. 组件实现

-   UI 组件的内部实现（使用原子组件）是符合规范的。
-   **符合性:** <span style="color:green;">符合</span>。

### 8.2. 结论与建议

-   **结论:** AI 助手模块的数据流实现非常健康，是另一个可以作为标杆的模块。
-   **建议:**
    1.  **组件位置重构:**
        -   创建 `src/features/ai/components` 目录。
        -   将 `/src/components/ai-assistant/` 下的所有组件统一迁移至此。

---

## 9. 模块审计：编辑器 (Editor)

- **审计范围:** 编辑器核心组件 (`/components/editor/*`)
- **审计状态:** <span style="color:green;">**高度符合**</span>

### 9.1. 技术细节分析

#### 9.1.1. 数据流与架构

-   **关注点分离:** 编辑器模块的设计遵循了良好的关注点分离原则。
    -   `TiptapEditor.tsx` 作为一个核心 UI 组件，负责文本编辑、渲染和内部状态管理（如光标位置、选区）。
    -   它不直接负责数据的持久化（保存到后端）。相反，它通过 `onSave` prop 将内容变更事件暴露给其父组件（如 `EditChapterPage` 或 `EditDraftPage`）。
    -   由父组件来决定何时以及如何通过各自的 Hooks (`useUpdateChapter`, `useUpdateDraft`) 来保存数据。
-   **内部 Hooks:** 编辑器内部的复杂功能（如书签管理）被封装在自定义的 `useBookmarks` Hook 中，这是一个良好的代码组织实践。
-   **符合性:** <span style="color:green;">符合</span>。编辑器的架构设计清晰，可复用性强。

#### 9.1.2. 组件实现

-   编辑器工具栏 (`EditorToolbar`) 及其他功能组件（`BookmarkManager`, `EditorSettings`, `FindReplace` 等）均由 `/components/ui` 中的原子组件构成。
-   **符合性:** <span style="color:green;">符合</span>。

### 9.2. 结论与建议

-   **结论:** 编辑器模块是项目中实现质量最高的模块之一，其清晰的架构和关注点分离可以作为其他模块重构的典范。
-   **建议:**
    1.  **组件位置重构:**
        -   创建 `src/features/editor/components` 目录。
        -   将 `/src/components/editor/` 下的所有组件统一迁移至此。

---

## 10. 模块审计：核心布局 (Layout)

- **审计范围:** 主布局 (`/app/(main)/layout.tsx`) 及相关组件 (`/components/common/layout/*`)
- **审计状态:** <span style="color:green;">**高度符合**</span>

### 10.1. 技术细节分析

#### 10.1.1. 组件实现与技术栈

-   **核心布局 (`MainLayout.tsx`):**
    -   正确地使用了 `shadcn/ui` 的 `ResizablePanelGroup` 组件来构建可伸缩的侧边栏布局。这是一个高级且符合设计规范的实现，提供了良好的用户体验。
    -   **符合性:** <span style="color:green;">符合</span>。
-   **子组件 (`Header.tsx`, `Sidebar`, `UserNav.tsx`):**
    -   所有布局子组件均由 `/components/ui` 中的原子组件（`Avatar`, `Button`, `DropdownMenu` 等）构成。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 10.1.2. 状态管理

-   **侧边栏状态:**
    -   侧边栏的折叠状态 (`isCollapsed`) 正确地由 `Zustand` store (`useSidebarStore`) 进行全局管理。
    -   这确保了用户的偏好（侧边栏是否折叠）可以在页面导航之间，甚至在刷新后得以保持，是客户端状态管理的最佳实践。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 10.1.3. 数据流

-   **用户数据:**
    -   `UserNav.tsx` 组件通过 `useUserQuery()` Hook 来获取当前登录用户的信息，严格遵循了 `UI -> Hook` 的数据流规范。
    -   **符合性:** <span style="color:green;">符合</span>。

#### 10.1.4. 组件组织结构

-   所有布局相关的组件都集中存放在 `/src/components/common/layout/` 及其子目录下。
-   这是一个**良好**的组织方式，完全符合架构蓝图中对 `common` 类别组件（可跨功能复用的复合组件）的定义。
-   **符合性:** <span style="color:green;">符合</span>。

### 10.2. 结论与建议

-   **结论:** 核心布局模块是项目中实现质量最高的模块之一，其对 `shadcn/ui` 高级组件的运用、通过 `Zustand` 实现的优雅状态管理，以及清晰的组件组织结构，都完全符合架构蓝图，可以作为项目其他部分重构的**黄金标准**。
-   **建议:** 无。

---

## 11. 模块审计：可扩展性 (Scalability)

- **审计范围:** 整体架构的高内聚、低耦合特性，以及新增功能的开发流程。
- **审计状态:** <span style="color:orange;">**基础良好，但需通过重构释放全部潜力**</span>

### 11.1. 架构设计分析

#### 11.1.1. 高内聚 (High Cohesion)

-   **定义:** 指一个模块内部的各个元素彼此紧密关联，共同完成一个单一、明确的功能。
-   **现状分析:**
    -   **数据流层面:** 项目在数据流层面体现了**极高**的内聚性。`Service` 层封装了特定业务域的所有后端交互，`Hook` 层封装了该业务域与 UI 的连接和状态管理。例如，`work.service.ts` 和 `useWorkService.ts` 共同构成了“作品管理”这个功能的高度内聚单元。
    -   **组件层面:** **内聚性不足**。由于组件组织混乱，一个功能（如草稿管理）的组件被分散在 `/app`, `/src/components/draft` 等多个地方，破坏了功能的内聚性。

#### 11.1.2. 低耦合 (Low Coupling)

-   **定义:** 指模块之间相互独立，一个模块的变更对其他模块的影响尽可能小。
-   **现状分析:**
    -   **数据流层面:** 分层架构本身就是为了实现低耦合。UI 组件不关心数据如何获取，Service 层不关心数据如何展示。这种设计使得我们可以独立地修改任何一层，而对其他层的影响很小（例如，后端 API 变更，我们只需要修改 Service 和 Generated Client，UI 和 Hook 完全不受影响）。这是项目**最优秀**的部分。
    -   **组件层面:** **耦合度较高**。由于组件没有按功能（feature）组织，导致组件之间的依赖关系不清晰。例如，一个在 `/app/works/components` 下的组件，理论上不应该被 `/app/drafts` 下的页面使用，但目前的结构无法从机制上阻止这种交叉依赖，从而增加了耦合风险。

### 11.2. 新增功能/组件的开发流程

基于当前架构，一个**理想的**、**简单易行**的新功能（例如“大纲管理”）开发流程应如下：

1.  **API 定义 (后端):** 后端在 `swagger.json` 中定义好“大纲”的 CRUD API。
2.  **API 同步 (前端):** 前端开发者运行 `pnpm api:generate`。`Orval` 会自动在 `/lib/api/generated/` 下创建 `outline` 目录，并生成所有类型安全的客户端代码。
3.  **创建 Service (`/lib/services/outline.service.ts`):**
    -   创建一个新文件，导入 `generated/outline` 中的函数。
    -   封装业务逻辑，例如 `getOutlineService`, `createOutlineService` 等。
4.  **创建 Hook (`/hooks/outline/useOutlineService.ts`):**
    -   创建一个新文件，导入 `outline.service.ts` 中的函数。
    -   创建 `useOutlineList`, `useCreateOutline` 等 `react-query` hooks，处理状态管理和缓存。
5.  **创建功能组件 (`/src/features/outline/components/`):**
    -   在一个**新的** `features` 子目录中，创建 `OutlineCard.tsx`, `OutlineForm.tsx` 等功能组件。
    -   这些组件应该完全由 `/src/components/ui` 中的原子组件构成。
6.  **创建页面 (`/app/(main)/outline/page.tsx`):**
    -   创建新的页面文件。
    -   在页面中，组合使用 `features/outline` 下的功能组件，并通过 `useOutlineService` 中的 Hooks 为它们提供数据。

### 11.3. 结论与建议

-   **结论:**
    -   项目的**核心数据流架构**具备极高的可扩展性，为新增功能提供了清晰、标准化的开发路径。**“高内聚、低耦合”** 的设计思想在数据层面得到了很好的体现。
    -   然而，当前**混乱的组件和路由组织结构**严重阻碍了这种可扩展性的发挥。它使得新增组件时开发者不清楚应该放在哪里，也使得寻找和复用现有组件变得困难，从而破坏了“高内聚、低耦合”在组件层面的实现。
-   **建议:**
    -   **执行组件和路由的重构是释放架构全部可扩展潜力的关键**。一旦所有功能都按照 `src/features/[功能名]` 的结构进行组织，并且路由得到统一，那么遵循上述“新增功能开发流程”将变得极其简单和高效。

---

## 12. 最终评定与修复计划

### 12.1. 最终评定总结

经过对所有核心模块的全面、深入审计，可以得出以下最终评定：

-   **架构基石稳固 (Strengths):**
    -   **数据流模型:** 项目的核心 `UI -> Hook -> Service -> Generated Client` 分层数据流架构设计是健全、清晰且强大的。在正确实现的模块中（如作品管理、认证、AI助手、布局），它展现出了极佳的**高内聚、低耦合**特性。
    -   **自动化与类型安全:** `Orval` 的正确配置从机制上保证了 API 层的类型安全和唯一数据源，这是项目最值得称赞的优点。
    -   **UI 基础一致:** `shadcn/ui` 和 `Tailwind CSS` 的使用为项目提供了统一、高质量的 UI 组件基础。

-   **架构执行的“三座大山” (Weaknesses):**
    尽管基础设计优秀，但在具体实现中存在三个普遍且严重的问题，严重影响了架构的完整性和可维护性：
    1.  **数据流分层违规:** `草稿`和`章节`管理模块严重违反了分层原则，跳过了 Service 层，导致业务逻辑与数据获取逻辑耦合。
    2.  **组件组织与路由混乱:** 除了核心布局外，几乎所有功能模块的组件都存在位置分散、组织结构不统一的问题。路由的割裂也加剧了这种混乱。
    3.  **表单实现不统一:** `角色`和`世界观`管理模块未使用项目中约定的 `react-hook-form` + `zod` 方案，导致技术栈分裂。

**总评:** 项目拥有一个**优秀**的架构蓝图和一个**及格**的实现。当前的状态如同拥有顶级的发动机（数据流模型），却装配在了一个组织松散的车架（组件/路由结构）上，并且部分零件（表单）型号不匹配。**可扩展性潜力巨大，但目前受限于结构性混乱，未能完全发挥。**

### 12.2. 分阶段修复计划 (Actionable Repair Plan)

为了系统性地解决上述问题，并使项目完全对齐架构蓝图，兹建议以下分三阶段的修复计划：

---

#### **阶段一：拨乱反正 (Fix the Foundation) - 最高优先级**

**目标:** 修复所有严重违反核心架构原则的问题，确保技术栈和数据流的统一。

-   **任务 1.1: 重构`草稿`模块数据流**
    -   **内容:** 修改 `/hooks/draft/useDraftService.ts`，使其不再直接调用 Orval 生成的 Hooks，而是调用 `/lib/services/draft.service.ts` 中的函数。
    -   **验收标准:** 数据流严格遵循 `UI -> Hook -> Service -> Generated Client`。

-   **任务 1.2: 重构`章节`模块数据流**
    -   **内容:** 修改 `/hooks/chapter/useChapterService.ts`，使其调用 `/lib/services/chapter.service.ts`。
    -   **验收标准:** 数据流严格遵循 `UI -> Hook -> Service -> Generated Client`。

-   **任务 1.3: 重构`角色`模块表单**
    -   **内容:** 重写 `NewCharacterPage` 和 `EditCharacterPage` 的表单逻辑，全面采用 `react-hook-form` 和 `zod`。
    -   **验收标准:** 移除所有手动的 `useState` 表单状态管理。

-   **任务 1.4: 重构`世界观`模块表单**
    -   **内容:** 重写 `CategoryDialog`, `NewWorldItemPage`, `EditWorldItemPage` 的表单逻辑，全面采用 `react-hook-form` 和 `zod`。
    -   **验收标准:** 移除所有手动的 `useState` 表单状态管理。

---

#### **阶段二：归置整合 (Unify the Structure) - 中等优先级**

**目标:** 解决组件和路由的混乱问题，实现真正的“高内聚、低耦合”。

-   **任务 2.1: 建立 `features` 目录**
    -   **内容:** 在 `/src` 下创建 `features` 目录，并为其下的每一个功能模块（`works`, `drafts`, `chapters`, `characters`, `worldview`, `ai`, `editor`）创建对应的子目录和 `components` 子目录。
    -   **验收标准:** 目录结构符合 `src/features/[功能名]/components` 规范。

-   **任务 2.2: 迁移所有功能组件**
    -   **内容:** 将散落在 `/app/**/components` 和 `/src/components/*`（非 `ui` 和 `common`）下的所有功能性组件，全部迁移到其所属的 `features` 目录中。
    -   **验收标准:** `/app` 目录下不再有 `components` 文件夹，`/src/components` 下只保留 `ui` 和 `common`。

-   **任务 2.3: 统一`草稿`和`章节`路由**
    -   **内容:** 移除 `/works/[id]/drafts` 和 `/works/[id]/chapters` 路由。改造 `/drafts` 和 `/chapters` 的主页面，使其支持 `?workId=` 查询参数过滤。
    -   **验收标准:** 冗余路由被删除，功能通过查询参数正常工作。

---

#### **阶段三：补全清扫 (Polish and Clean) - 低优先级**

**目标:** 完成缺失的功能和清理技术债。

-   **任务 3.1: 实现`角色`列表页面**
    -   **内容:** 创建并实现 `/app/(main)/tools/characters/page.tsx`。
    -   **验收标准:** 用户可以查看、搜索和筛选角色列表。

-   **任务 3.2: 清理死代码与冗余**
    -   **内容:** 删除被注释的 `WorldItemCard.tsx`，确认并删除重复的 `ChapterList.tsx` 组件。
    -   **验收标准:** 项目中无明显死代码。
