## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式

## 第7步：安装必要的UI组件

接下来，我们需要安装小说管理系统所需的基础UI组件。这些组件将用于构建我们的界面，包括按钮、卡片、对话框等。

**执行命令**：
```
pnpm dlx shadcn@latest add button card avatar tabs dialog dropdown-menu sheet separator tooltip input form textarea
```

**执行目的**：
安装小说管理系统所需的基础UI组件。我们选择这些组件是因为：

1. **button**：最基础的交互元素，用于触发操作，如创建章节、保存内容等
2. **card**：用于内容分组和信息展示，适合展示作品、章节摘要等
3. **avatar**：用于显示用户头像，增强个性化体验
4. **tabs**：用于内容分类和切换，可用于切换不同的编辑视图或设置页面
5. **dialog**：模态对话框，用于确认重要操作如删除章节
6. **dropdown-menu**：下拉菜单，节省空间的同时提供更多选项
7. **sheet**：侧边抽屉，可用于显示章节列表或设置面板
8. **separator**：分隔线，用于视觉上分隔不同内容区域
9. **tooltip**：工具提示，为图标按钮提供额外说明
10. **input**：输入框，用于收集用户输入如标题、搜索等
11. **form**：表单组件，用于创建和编辑作品信息
12. **textarea**：多行文本输入，用于章节内容编辑

**替代方案**：
- **自己从头实现组件**：耗时且容易出现可访问性问题，不适合MVP快速开发
- **使用第三方组件库如MUI或Ant Design**：这些库提供了完整的组件，但样式固定，难以与我们的设计系统集成
- **使用简单的HTML元素**：缺乏交互性和一致的设计语言，用户体验较差

## 第8步：创建布局结构

现在，我们需要创建小说管理系统的基本布局结构，包括侧边栏和主内容区域。

**执行命令**：
```
mkdir -p src/components/common/layout
```

**创建文件**：
```
touch src/components/common/layout/AppSidebar.tsx
```

```tsx
'use client';  // 标记为客户端组件，因为需要处理交互

import * as React from 'react';  // 导入React
import Link from 'next/link';  // 导入Next.js的Link组件用于导航
import { cn } from '@/lib/utils';  // 导入工具函数，用于合并类名
import {
  BookOpenText,  // 书籍图标
  FileText,      // 文件图标
  Home,          // 首页图标
  Library,       // 图书馆图标
  Settings,      // 设置图标
  PenTool,       // 笔工具图标
  Menu,          // 菜单图标
} from 'lucide-react';  // 导入图标组件
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';  // 导入抽屉组件
import { Button } from '@/components/ui/button';  // 导入按钮组件
import { Separator } from '@/components/ui/separator';  // 导入分隔线组件
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';  // 导入提示组件

// 定义导航项类型
type NavItem = {
  title: string;  // 导航项标题
  href: string;   // 导航项链接
  icon: React.ElementType;  // 导航项图标组件类型
};

// 定义导航项数组
const navItems: NavItem[] = [
  {
    title: '首页',
    href: '/',
    icon: Home,
  },
  {
    title: '我的作品',
    href: '/works',
    icon: Library,
  },
  {
    title: '章节管理',
    href: '/chapters',
    icon: BookOpenText,
  },
  {
    title: '草稿箱',
    href: '/drafts',
    icon: FileText,
  },
  {
    title: '写作工具',
    href: '/tools',
    icon: PenTool,
  },
  {
    title: '设置',
    href: '/settings',
    icon: Settings,
  },
];

// 定义侧边栏组件
export function AppSidebar() {
  return (
    <>
      {/* 桌面端侧边栏 - 在中等屏幕及以上显示 */}
      <div className="hidden h-screen w-16 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center justify-center border-b">
          {/* 应用logo */}
          <Link href="/" className="flex items-center justify-center">
            <PenTool className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-4 p-4">
          {/* 导航项列表 */}
          {navItems.map((item) => (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    // 可以根据当前路径添加激活状态
                    // pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <div className="flex flex-col gap-4 p-4">
          {/* 用户头像或登录按钮可以放在这里 */}
        </div>
      </div>
      
      {/* 移动端侧边栏 - 在中等屏幕以下显示 */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed left-4 top-4 z-40 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex h-16 items-center border-b">
            <Link href="/" className="flex items-center gap-2">
              <PenTool className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">小说管理系统</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  // 可以根据当前路径添加激活状态
                  // pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="py-4">
            {/* 用户信息或登录按钮可以放在这里 */}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

**代码详解**：

1. `'use client';` - 标记为客户端组件，因为侧边栏需要处理用户交互
2. 导入所需的组件和工具函数
3. 定义`NavItem`类型，包含标题、链接和图标
4. 定义`navItems`数组，包含导航项数据
5. 创建`AppSidebar`组件，包含两部分：
   - 桌面端侧边栏：固定在左侧，只显示图标
   - 移动端侧边栏：可通过按钮打开的抽屉式侧边栏，显示图标和文字

**创建文件**：
```
touch src/components/common/layout/MainLayout.tsx
```

```tsx
'use client';  // 标记为客户端组件

import * as React from 'react';  // 导入React
import { AppSidebar } from './AppSidebar';  // 导入侧边栏组件

// 定义主布局组件的属性类型
interface MainLayoutProps {
  children: React.ReactNode;  // 子组件
}

// 主布局组件
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <AppSidebar />
      
      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**代码详解**：

1. `'use client';` - 标记为客户端组件
2. 导入侧边栏组件
3. 定义`MainLayout`组件，包含两部分：
   - 侧边栏：使用之前创建的`AppSidebar`组件
   - 主内容区域：包含一个容器，用于显示页面内容


**执行命令**：
```
mkdir -p src/app/\(main\)
```
在Next.js的App Router中，文件夹名称带括号`()`是一种特殊的约定，有特定的含义。

## `(main)`中括号的含义

在Next.js的App Router中，带括号的文件夹名称如`(main)`表示这是一个**路由组**(Route Group)。

**路由组的特点和作用**：

1. **不影响URL路径结构**：
   - 带括号的文件夹不会被包含在URL路径中
   - 例如：`src/app/(main)/works/page.tsx`的路由路径是`/works`，而不是`/main/works`

2. **组织和共享布局**：
   - 路由组的主要用途是将相似的路由分组，共享同一个布局
   - 不同的路由组可以有不同的布局，但不影响URL结构

3. **逻辑分离**：
   - 可以将应用分为不同的逻辑部分，如`(main)`、`(auth)`、`(admin)`等
   - 每个部分可以有自己的布局、导航和状态管理

**使用场景示例**：

```
src/app/
├── (auth)/           # 认证相关路由组
│   ├── login/        # /login 路径
│   ├── register/     # /register 路径
│   └── layout.tsx    # 认证页面共享布局（如简化界面）
│
├── (main)/           # 主应用路由组
│   ├── works/        # /works 路径
│   ├── chapters/     # /chapters 路径
│   └── layout.tsx    # 主应用共享布局（如包含侧边栏）
│
└── layout.tsx        # 根布局（所有页面共享）
```

在上面的例子中：
- `(auth)`路由组的页面共享相同的简化布局，适合登录、注册页面
- `(main)`路由组的页面共享相同的主应用布局，包含侧边栏等
- 所有页面都共享根布局（如主题、字体设置）

**为什么我们使用路由组**：

在我们的小说管理系统中，使用`(main)`路由组有以下好处：

1. **分离认证和主应用**：
   - 将来我们可以添加`(auth)`路由组用于登录、注册页面
   - 认证页面可以使用更简洁的布局，没有侧边栏等主应用元素

2. **灵活的布局管理**：
   - 主应用页面都共享侧边栏、导航等UI元素
   - 如果将来添加特殊页面（如全屏编辑器），可以放在另一个路由组

3. **代码组织更清晰**：
   - 路由组提供了逻辑上的分组，使项目结构更清晰
   - 便于团队协作和维护

这种命名约定是Next.js特有的，是App Router提供的一种强大而灵活的路由和布局管理方式。

**修改文件**：
```
touch src/app/\(main\)/layout.tsx
```

```tsx
import { MainLayout } from '@/components/common/layout/MainLayout';  // 导入主布局组件

// 主路由组布局
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
```

**代码详解**：

1. 导入主布局组件
2. 定义`MainRouteLayout`组件，使用`MainLayout`包装子组件
3. 这个布局将应用于`(main)`路由组下的所有页面



**执行目的**：
创建主路由组目录，用于存放需要使用主布局的页面。

**替代方案**：
- **使用固定布局**：不区分路由组，所有页面使用相同布局，但这样缺乏灵活性
- **每个页面单独设置布局**：代码重复，难以维护
- **使用更复杂的布局嵌套**：可能导致性能问题和复杂的状态管理

您理解这一步骤吗？我们创建了侧边栏和主布局组件，并设置了路由组布局，为小说管理系统提供了基础的页面结构。
