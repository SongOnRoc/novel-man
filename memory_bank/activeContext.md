# [前端标准化] - 页面头部组件（扩展应用）

**任务 ID**: `643f250d-5844-412c-b685-986e3663131c`

**目标**: 将标准化的 `PageHeader` 组件应用到项目中所有需要页面头部的页面，以实现 UI 和体验的完全统一。

---

### 1. 初始实现与试点

-   **创建 `PageHeader.tsx`**: 设计并实现了一个通用的页面头部组件，包含 `title`, `description`, `showBackButton`, 和 `actions` 等 props。
-   **试点应用**: 在 `drafts/[id]/edit/page.tsx` 页面成功应用了 `PageHeader` 组件，验证了其可行性。

---

### 2. 扩展应用范围

根据新的指令，将 `PageHeader` 组件推广到以下所有相关页面：

#### a. Works 模块

-   `works/[id]/edit/page.tsx`: 替换了原有的静态头部。
-   `works/[id]/outline/page.tsx`: 替换了包含动态标题的头部。
-   `works/[id]/chapters/page.tsx`: 使用 `actions` prop 成功集成了视图切换和“新章节”按钮。
-   `works/[id]/chapters/[chapterId]/edit/page.tsx`: 替换了编辑页面的头部。
-   `works/[id]/chapters/[chapterId]/preview/page.tsx`: 根据用户反馈，添加了返回按钮，并将其他操作按钮移至 `actions` prop，统一了交互体验。
-   `works/new/page.tsx`: 替换了新建页面的头部。

#### b. Characters 模块

-   `tools/characters/[id]/edit/page.tsx`: 替换了原有的居中对齐头部，使其与全局样式保持左对齐一致。
-   `tools/characters/new/page.tsx`: 同样，将头部样式统一为左对齐。

#### c. Worldbuilding 模块

-   `tools/worldbuilding/[id]/edit/page.tsx`: 替换了编辑页面的头部，统一了样式。
-   `tools/worldbuilding/new/page.tsx`: 替换了新建页面的头部，完成了所有模块的标准化。

---

### 3. 总结

通过本次大规模重构，`PageHeader` 组件已成为项目标准的页面头部解决方案。所有相关页面的头部UI和交互逻辑都已统一，显著提高了代码的可维护性和一致性，并为未来新页面的开发提供了标准化的构建块。
