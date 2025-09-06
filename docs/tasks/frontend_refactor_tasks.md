# 前端重构执行任务清单

**项目经理**: BMad-PM  
**方案文档**: [`../design/new/frontend_refactor_proposal.md`](../design/new/frontend_refactor_proposal.md)  
**状态**: `已完成`

---

## Epic 1: 路由与核心功能迁移

### `[x]` Task 1.1: 迁移并重构章节列表页面
- **状态**: `已完成`
- **目标**: 将 `/chapters` 的功能迁移到 `/works/[id]/chapters`。
- **验收标准**:
    - [x] `frontend/src/app/(main)/works/[id]/chapters/page.tsx` 文件已更新为原 `/chapters` 页面的内容。
    - [x] 页面能通过路由参数 (`params.id`) 正确获取 `workId` 并展示对应作品的章节列表。
    - [x] 页面不再包含作品选择的下拉菜单。
    - [x] 页面标题能正确显示当前作品的名称。
    - [x] 分页功能在新路由下正常工作。

### `[x]` Task 1.2: 迁移并重构章节详情/编辑页面
- **状态**: `已完成`
- **目标**: 将 `/chapters/[id]` 的功能迁移到 `/works/[workId]/chapters/[chapterId]`。
- **验收标准**:
    - [x] `frontend/src/app/(main)/chapters/[id]/` 目录下的 `edit` 和 `preview` 页面被移动到 `frontend/src/app/(main)/works/[id]/chapters/[chapterId]/` 之下。
    - [x] 新路径下的页面能通过路由参数正确解析 `workId` 和 `chapterId`。
    - [x] 章节的查看、编辑、预览等功能在新路由下正常工作。
    - [x] 编辑页面的文案已本地化为中文。

---

## Epic 2: UI/UX与业务流程优化

### `[x]` Task 2.1: 优化草稿页面
- **状态**: `已完成`
- **目标**: 移除草稿页面必须选择作品的限制，使其能管理所有草稿。
- **验收标准**:
    - [x] 在不选择任何作品的情况下，草稿页面 (`/drafts`) 能成功加载并显示一个列表或提示。
    - [x] `useDraftList` hook 已正确实现，能处理 `workId` 为可选的情况。
    - [x] “新草稿”按钮在未选择作品时不再是 `disabled` 状态。
    - [x] 下拉菜单增加了“全部作品”和“其他草稿”的选项，且功能通过前端筛选正常工作。

### `[x]` Task 2.2: 调整“创建新章节”按钮的业务逻辑
- **状态**: `已完成`
- **目标**: 将“创建新章节”的入口指向“创建新草稿”。
- **验收标准**:
    - [x] 在 `/works/[id]/chapters` 页面，“新章节”按钮的链接正确指向 `/drafts/new?workId=[current_work_id]`。

---

## Epic 3: 清理与收尾

### `[-]` Task 3.1: 删除所有冗余和废弃的路由目录
- **状态**: `进行中`
- **依赖**: Task 1.1, Task 1.2, Task 2.1
- **目标**: 清理所有历史遗留的代码和路由，完成重构。
- **验收标准**:
    - [ ] `frontend/src/app/(main)/chapters/` 目录被完全删除。
    - [ ] `frontend/src/app/(main)/works/[id]/drafts/` 目录被完全删除。
    - [ ] 删除操作完成后，整个应用的功能（特别是作品、章节、草稿相关功能）经过回归测试，无明显问题。