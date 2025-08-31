# **WorkCard 组件重构日志**

**任务目标**: 将 `WorkCard` 组件重构为带有书脊的书本样式，并优化交互。

**时间**: 2025-09-01T17:39:05Z

## **阶段一：分析与规划**

1.  **文件审查**:
    *   `WorkCard.tsx`: 当前为响应式列表项布局（`md:flex-row`），包含封面、信息和常驻的操作按钮。
    *   `works/page.tsx`: 使用 `space-y-4` 将卡片渲染为单列垂直列表。
    *   `globals.css`: 确认了 CSS 变量 `--color-border` 和 `--color-muted` 可用于书脊样式。

2.  **重构策略**:
    *   **`WorkCard.tsx`**:
        *   **结构**: 采用 `relative` 定位的 `Card` 作为根容器。内部使用 `absolute` 定位创建书脊 (`w-2 bg-border`)。
        *   **尺寸**: 设定 `aspect-[2/3]` 以模拟书本比例。
        *   **封面**: 重新布局，将标题 (`work.title`) 和简介 (`work.description`) 作为核心内容。标题将加大加粗以突出。
        *   **交互**:
            *   底部操作按钮组将包裹在一个 `div` 中，默认使用 `opacity-0` 和 `translate-y-4` 隐藏。
            *   在根 `Card` 上添加 `group` 类。
            *   利用 `group-hover:opacity-100` 和 `group-hover:translate-y-0`，在鼠标悬停时平滑地浮现按钮组，并添加 `backdrop-blur-sm` 以增强视觉效果。
            *   右上角的“更多”菜单将使用 `absolute` 定位，保持常驻。
    *   **`works/page.tsx`**:
        *   **必要变更**: 为了让书本样式正确展示，必须将父容器从单列布局修改为响应式网格布局。
        *   **实现**: 将 `space-y-4` 替换为 `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6`。`gap-6` 提供比 `gap-4` 更舒适的间距。

## **阶段二：编码实现**

即将开始对 `WorkCard.tsx` 和 `works/page.tsx` 进行修改。