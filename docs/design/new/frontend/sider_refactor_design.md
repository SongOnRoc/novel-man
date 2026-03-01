# Sider 组件重构设计文档

## 1. 目标与原则

### 1.1. 目标

本次重构旨在解决当前项目中 Sider (侧边栏) 存在的状态管理分散、响应式逻辑分离以及用户体验一致性不足的问题。具体目标如下：

- **统一状态管理:** 将 `ResizablePanelGroup` 的折叠状态与全局应用状态同步，实现单一数据源。
- **整合响应式逻辑:** 创建一个统一的 `<Sidebar />` 组件，处理桌面端的可伸缩布局和移动端的抽屉式菜单，消除 `Sidebar.tsx` 和 `AppSidebar.tsx` 的冗余。
- **提升用户体验:** 引入平滑的动效和直观的微交互，如折叠/展开动画、工具提示等，增强操作的流畅性和友好性。
- **提高代码质量:** 采用模块化和组件化的设计，增强代码的可维护性、可扩展性和可复用性。

### 1.2. 设计原则

为确保重构的成功，我们将遵循以下设计原则：

- **组件化 (Component-based):** 将 Sider 拆分为独立的、可复用的子组件（如 `Header`, `Content`, `Footer`），实现高度内聚和低耦合。
- **单一职责 (Single Responsibility):** 每个组件和状态管理单元都应有明确且单一的职责。
- **可维护性 (Maintainability):** 采用清晰的命名规范、一致的代码风格和详细的注释，确保代码易于理解和修改。
- **用户中心 (User-centric):** 所有交互和动效设计都应以提升用户操作效率和满意度为核心。

---

## 2. 技术选型

为实现上述目标，我们选择以下技术栈：

- **状态管理: `Zustand`**
  - **理由:** `Zustand` 是一个轻量级、高效的状态管理库，API 简洁直观。其 `persist` 中间件可以轻松实现状态的本地持久化（例如，用户折叠侧边栏的偏好设置可以在刷新后保留）。
  - **实现:**
    ```typescript
    import { create } from 'zustand';
    import { persist } from 'zustand/middleware';

    const useSidebarStore = create(
      persist(
        (set) => ({
          isCollapsed: false,
          setIsCollapsed: (isCollapsed) => set({ isCollapsed }),
        }),
        {
          name: 'sidebar-storage', // 用于本地存储的键名
        }
      )
    );
    ```

- **动效库: `Framer Motion`**
  - **理由:** `Framer Motion` 是一个功能强大且易于使用的 React 动画库。它提供了声明式的 API，可以轻松实现复杂的 UI 过渡和交互动画，与我们的目标高度契合。
  - **实现:** 将使用 `AnimatePresence` 和 `motion` 组件来实现侧边栏的平滑展开/折叠以及菜单项的动态效果。

---

## 3. 组件 API 设计

我们将设计一个全新的、统一的 `<Sidebar />` 组件，其 API 和内部结构如下：

### 3.1. `<Sidebar />` 主组件

```typescript
// src/components/common/layout/sider/Sidebar.tsx

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  className?: string;
  children: React.ReactNode;
}

const Sidebar = ({ isCollapsed, onCollapse, onExpand, children }: SidebarProps) => {
  // ... 响应式逻辑和组件渲染
};
```

### 3.2. 子组件结构

通过复合组件模式（Compound Components），提供更灵活和语义化的结构。

- **`<Sidebar.Header />`**
  - **职责:** 负责展示 Logo、应用名称或标题。在折叠状态下可仅显示 Logo。
  - **示例:** `<Sidebar.Header><Logo /></Sidebar.Header>`

- **`<Sidebar.Content />`**
  - **职责:** 包含主要的导航链接和菜单项。
  - **示例:** `<Sidebar.Content><NavLinks /></Sidebar.Content>`

- **`<Sidebar.Footer />`**
  - **职责:** 放置用户信息、设置入口或版本号等次要信息。
  - **示例:** `<Sidebar.Footer><UserProfile /></Sidebar.Footer>`

---

## 4. 状态管理方案

`useSidebarStore` 将作为 Sider 状态的唯一真实来源。

### 4.1. Store 结构

```typescript
// src/hooks/ui/useSidebarStore.ts

interface SidebarState {
  isCollapsed: boolean;
  isMobileOpen: boolean; // 用于移动端抽屉状态
  setIsCollapsed: (collapsed: boolean) => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>(/* ... */);
```

### 4.2. 与 `ResizablePanelGroup` 集成

我们将 `ResizablePanelGroup` 的事件与 `useSidebarStore` 的 actions 绑定，实现状态同步。

```tsx
// src/app/(main)/layout.tsx

const { isCollapsed, setIsCollapsed } = useSidebarStore();

<ResizablePanelGroup
  onLayout={(sizes: number[]) => {
    // 可选：处理布局变化
  }}
>
  <ResizablePanel
    collapsible
    collapsedSize={4}
    minSize={10}
    defaultSize={15}
    isCollapsed={isCollapsed}
    onCollapse={() => setIsCollapsed(true)}
    onExpand={() => setIsCollapsed(false)}
  >
    <Sidebar>
      {/* ... */}
    </Sidebar>
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel>
    {children}
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## 5. 响应式策略

新的 `<Sidebar />` 组件将内部处理不同设备下的渲染逻辑。

- **逻辑核心:** 使用一个自定义 hook `useIsMobile` 来检测当前设备是否为移动端。
- **桌面端 (Desktop):**
  - 渲染 `ResizablePanel` 包裹的可伸缩侧边栏。
  - 交互逻辑由 `ResizablePanelGroup` 控制。
- **移动端 (Mobile):**
  - 渲染由 `Sheet` (或类似的抽屉组件) 实现的覆盖式菜单。
  - 通过一个 `Menu` 图标按钮触发 `useSidebarStore` 中的 `toggleMobile` action 来控制抽屉的显示和隐藏。

```tsx
// src/components/common/layout/sider/Sidebar.tsx

const Sidebar = (/* ... */) => {
  const isMobile = useIsMobile();
  const { isMobileOpen, toggleMobile } = useSidebarStore();

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={toggleMobile}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          {/* 渲染 Header, Content, Footer */}
        </SheetContent>
      </Sheet>
    );
  }

  // 桌面端逻辑
  return (
    <div className={/* ... */}>
      {children}
    </div>
  );
};
```

---

## 6. 动效与微交互设计

- **菜单项展开/折叠:**
  - 当侧边栏展开时，子菜单项使用 `Framer Motion` 的 `AnimatePresence` 实现平滑的向下展开动画，而不是瞬间出现。
  - **示例:**
    ```tsx
    <AnimatePresence>
      {isSubMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          {/* Sub-menu items */}
        </motion.div>
      )}
    </AnimatePresence>
    ```

- **图标悬停效果:**
  - 导航菜单中的图标在鼠标悬停时，应用一个轻微的放大 (`scale: 1.1`) 和颜色过渡效果，提供即时反馈。

- **折叠状态下的信息提示:**
  - 当侧边栏折叠时，导航项只显示图标。此时，使用 `Tooltip` 组件，在用户悬停在图标上时显示完整的菜单项名称，确保信息的可访问性。

---

## 7. 迁移计划 (可选)

迁移过程将分步进行，以确保平稳过渡：

1.  **开发新组件:** 在独立的目录 `src/components/common/layout/sider/` 中开发全新的 `<Sidebar />` 组件及其子组件，并创建 `useSidebarStore`。
2.  **替换桌面端:** 在主布局文件中，使用新的 `<Sidebar />` 替换旧的 `Sidebar.tsx`，并完成与 `ResizablePanelGroup` 的集成。
3.  **替换移动端:** 移除 `AppSidebar.tsx`，将其触发逻辑（例如顶部的汉堡菜单按钮）直接与新 `<Sidebar />` 组件的响应式部分（`Sheet`）进行集成。
4.  **代码清理:** 在确认新组件运行稳定后，删除旧的 `Sidebar.tsx` 和 `AppSidebar.tsx` 文件及相关引用。