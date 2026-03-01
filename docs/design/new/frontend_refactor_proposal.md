# 前端路由与业务流程重构方案

## 1. 背景与问题分析

当前前端项目中存在路由结构冗余和业务流程不合理的问题，主要体现在“章节 (Chapters)”和“草稿 (Drafts)”两大功能模块。

### 1.1. 路由问题

- **章节路由**: 存在两套实现路径 `frontend/src/app/(main)/chapters/` 和 `frontend/src/app/(main)/works/[id]/chapters/`。其中，前者是功能完整的实现，而后者是历史遗留的简化版。从业务逻辑上看，章节应隶属于某个作品 (Work)，因此 `works/[id]/chapters` 是更合理的路由结构。
- **草稿路由**: 同样存在两套实现路径 `frontend/src/app/(main)/drafts/` 和 `frontend/src/app/(main)/works/[id]/drafts/`。分析显示，前者是功能完整的实现。根据需求，草稿可以独立于作品存在（如灵感片段），也可以关联到特定作品，因此将其作为顶层路由 `(main)/drafts` 更为合理。

### 1.2. 业务流程与UI/UX问题

- **章节创建流程**: 当前允许用户直接在章节列表页面创建新章节。这不符合“先创作草稿，再发布为正式章节”的创作流程。
- **草稿页面体验**: `(main)/drafts` 页面强制用户必须先选择一部作品才能查看和管理草稿，这与“草稿可以独立存在”的业务逻辑相悖，限制了用户的使用场景。

## 2. 重构目标

1.  **统一路由**: 为“章节”和“草稿”功能确立唯一的、符合业务逻辑的路由结构。
2.  **优化流程**: 调整章节创建流程，引导用户通过草稿来创建新章节。
3.  **提升体验**: 改进草稿页面的交互，使其支持对所有草稿（无论是否关联作品）的管理。

## 3. 技术实施方案

### 3.1. 路由迁移与清理

**任务 1: 迁移章节 (Chapters) 页面**

- **源文件**: `frontend/src/app/(main)/chapters/page.tsx`
- **目标文件**: `frontend/src/app/(main)/works/[id]/chapters/page.tsx`
- **操作**:
    1.  将源文件的全部内容复制并覆盖到目标文件。
    2.  对目标文件进行以下核心修改：
        -   **获取 `workId`**: 移除 `useSearchParams` 对 `workId` 的解析，改用 `useParams` 从路由参数中获取 `workId`。
            ```javascript
            // 在文件顶部引入 `useParams`
            import { useParams } from "next/navigation";

            // 在组件函数内部
            const params = useParams();
            const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
            ```
        -   **移除作品选择器**: 页面顶部的 `<Select>` 组件及其相关逻辑（如 `useWorkList` hook, `handleSelectWork` 函数, `works` 状态）应被完全移除。
        -   **更新UI**: 页面主标题 `<h1>` 应更新为显示当前作品的标题，可以从 `useWorkById(workId)` hook 获取。
            ```javascript
            // 示例:
            const { data: workResponse } = useWorkById(workId);
            const work = workResponse?.data;
            // JSX 中:
            // <h1>《{work?.title}》的章节管理</h1>
            ```
        -   **更新分页链接**: `handlePageChange` 函数中的路由跳转逻辑需更新。
            ```javascript
            router.push(`/works/${workId}/chapters?page=${newPage}`);
            ```

**任务 2: 迁移章节详情与编辑页面**

- **背景**: 章节列表的子页面，用于查看和编辑单个章节的功能也需要一并迁移。
- **源目录**: `frontend/src/app/(main)/chapters/[id]/`
- **目标父目录**: `frontend/src/app/(main)/works/[workId]/chapters/`
- **操作**:
    1. 将源目录 `frontend/src/app/(main)/chapters/[id]/` **移动并重命名**为 `frontend/src/app/(main)/works/[id]/chapters/[chapterId]/`。
    2. 修改其内部页面 (`page.tsx`, `edit/page.tsx` 等) 的代码，使其能从新的路由结构 (`params.id` 和 `params.chapterId`) 中正确获取 `workId` 和 `chapterId`。

**任务 3: 清理冗余和废弃的路由**

- **删除目录 1**: `frontend/src/app/(main)/chapters/`。**注意**: 确保其下的 `[id]` 子目录已按“任务2”成功迁移后再执行删除。
- **删除目录 2**: `frontend/src/app/(main)/works/[id]/drafts/`。
- **说明**: 原 `frontend/src/app/(main)/chapters/new/` 目录的功能已被新的草稿流程取代，因此随父目录被删除即可，无需迁移。

### 3.2. 业务流程调整

**任务 4: 修改“新章节”按钮行为**

-   **文件**: `frontend/src/app/(main)/works/[id]/chapters/page.tsx` (即迁移后的新文件)
-   **操作**: 定位到页面中的“新章节”按钮 (`<Button>`)，将其中的 `<Link>` 组件 `href` 属性修改为指向草稿创建页面，并附带当前作品的 `workId` 作为查询参数。
    ```javascript
    // 将 <Link href={`/chapters/new?workId=${...}`}>
    // 修改为:
    <Link href={`/drafts/new?workId=${workId}`}>
    ```

### 3.3. 草稿页面 (Drafts) UI/UX 优化

**任务 5: 移除草稿页面的作品选择限制**

-   **文件**: `frontend/src/app/(main)/drafts/page.tsx`
-   **操作**:
    1.  **修改 `useDraftList` Hook 调用**: 确保 `useDraftList` hook 可以在 `workId` 为 `undefined` 的情况下被调用，以获取所有草稿。
        ```javascript
        const selectedWorkId = workId ? parseInt(workId, 10) : undefined;
        const { data: draftsResponse } = useDraftList({ 
            workId: selectedWorkId,
            page 
        });
        ```
    2.  **修改渲染逻辑**: 在 `renderContent` 函数中，删除或注释掉当 `!selectedWorkId` 时返回“请先选择一部作品”提示的逻辑块，确保无论是否选择作品，都能渲染 `DraftsContent` 组件。
    3.  **调整UI提示**: 在 `DraftsContent` 组件中，当草稿列表为空时，根据 `workId` 是否存在来显示不同的提示文案。
        -   如果 `workId` 存在但列表为空，提示：“这部作品还没有任何草稿...”
        -   如果 `workId` 不存在且列表为空，提示：“您还没有任何草稿，开始创作吧！”
    4.  **“新草稿”按钮**: 移除该按钮的 `disabled={!selectedWorkId}` 属性。如果 `selectedWorkId` 存在，则链接为 `/drafts/new?workId=...`；如果不存在，则链接为 `/drafts/new`。

## 4. 预期成果

-   项目路由结构更加清晰、合理。
-   章节创建流程符合创作直觉。
-   草稿功能更加灵活和强大，提升用户体验。
-   代码的可维护性得到增强。

---
**建议**: 请开发人员严格按照本方案执行操作。在操作前建议进行代码备份或创建新的 Git 分支。