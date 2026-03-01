# 前端重构任务列表 (V2)

基于 `docs/analysis/frontend_optimization_report.md` (V3 - 完整版) 的分析，制定以下前端重构和优化任务。

## 核心任务

- [ ] **任务1：侧边栏优化**
  - **目标**: 锁定PC端侧边栏布局，移除宽度拖拽功能。
  - **关键实现**:
    - 定位到 `ResizablePanelGroup` 布局。
    - 通过设置 `ResizablePanel` 的 `defaultSize`, `minSize`, `maxSize` 为相同值，或禁用 `ResizableHandle` 的CSS `pointer-events` 来移除交互性。

- [ ] **任务2：移动端导航适配**
  - **目标**: 实现一个可折叠的、支持二级菜单的移动端底部导航栏。
  - **关键实现**:
    - 创建新的 `MobileBottomNav.tsx` 组件，管理其展开/折叠状态。
    - 展开状态为底部导航栏，点击项通过 `Sheet` 或 `Drawer` 显示二级菜单。
    - 折叠状态为左下角的浮动按钮 (FAB)。
    - 使用响应式断点控制其在移动端显示，并隐藏PC端侧边栏。

- [ ] **任务3：面包屑功能重构**
  - **目标**: 使面包屑能显示动态内容的标题（如草稿标题）而非ID。
  - **关键实现**:
    - 引入 `BreadcrumbContext` 进行状态管理。
    - 在动态页面（如 `drafts/[id]/edit`）获取数据后，更新 Context 中的标题映射。
    - 修改 `Breadcrumbs.tsx` 组件，使其优先从 Context 读取标题。

- [ ] **任务4：页面头部标准化**
  - **目标**: 统一“返回上一级”功能和页面头部布局。
  - **关键实现**:
    - 创建一个可复用的 `PageHeader.tsx` 组件。
    - 组件应包含可选的返回按钮 (`router.back()`)、页面标题和操作按钮插槽。
    - 在所有非顶级的详情页、编辑页和新建页中推广使用该组件。