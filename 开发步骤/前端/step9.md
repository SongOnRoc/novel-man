## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局

## 第9步：创建首页

接下来，我们需要创建小说管理系统的首页，展示系统概览和快速访问链接。

**执行命令**：
```
mkdir -p src/app/\(main\)/page-components
touch src/app/\(main\)/page.tsx
touch src/app/\(main\)/page-components/StatsCard.tsx
touch src/app/\(main\)/page-components/RecentWorks.tsx
touch src/app/\(main\)/page-components/QuickActions.tsx
```

**创建文件**：`src/app/(main)/page-components/StatsCard.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 定义统计卡片的属性类型
interface StatsCardProps {
  title: string;      // 卡片标题
  value: string;      // 统计值
  description?: string; // 可选描述
  icon: React.ReactNode; // 图标
  className?: string; // 可选CSS类名
}

// 统计卡片组件
export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

**代码详解**：
1. 定义`StatsCardProps`接口，描述统计卡片的属性
2. 创建`StatsCard`组件，显示统计信息（如作品数量、字数等）
3. 使用Card组件作为基础，展示标题、值和可选描述

**创建文件**：`src/app/(main)/page-components/RecentWorks.tsx`

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, BookOpen } from "lucide-react";

// 模拟作品数据的类型
interface Work {
  id: string;
  title: string;
  chapters: number;
  updatedAt: string;
}

// 模拟作品数据
const recentWorks: Work[] = [
  {
    id: "1",
    title: "修仙从种田开始",
    chapters: 23,
    updatedAt: "2023-09-20"
  },
  {
    id: "2",
    title: "都市之全能高手",
    chapters: 15,
    updatedAt: "2023-09-18"
  },
  {
    id: "3",
    title: "星际穿越之旅",
    chapters: 7,
    updatedAt: "2023-09-15"
  }
];

// 最近作品组件
export function RecentWorks() {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>最近作品</CardTitle>
        <CardDescription>您最近更新的作品列表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentWorks.map((work) => (
            <div key={work.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <BookOpen className="h-10 w-10 rounded-md border p-2 text-primary" />
                <div>
                  <div className="font-semibold">{work.title}</div>
                  <div className="text-sm text-muted-foreground">
                    <span>{work.chapters} 章节</span>
                    <span className="mx-2">•</span>
                    <span>更新于 {work.updatedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">继续编辑</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**代码详解**：
1. 定义`Work`接口，描述作品数据结构
2. 创建模拟数据`recentWorks`（后续会从API获取）
3. 创建`RecentWorks`组件，展示最近更新的作品列表

**创建文件**：`src/app/(main)/page-components/QuickActions.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, BookOpen, FileText, PenTool } from "lucide-react";

// 快速操作的类型
interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

// 快速操作列表
const quickActions: QuickAction[] = [
  {
    title: "创建新作品",
    description: "开始一个全新的创作之旅",
    icon: <PlusCircle className="h-5 w-5" />,
    href: "/works/new"
  },
  {
    title: "继续写作",
    description: "回到上次的创作内容",
    icon: <PenTool className="h-5 w-5" />,
    href: "/chapters/latest"
  },
  {
    title: "管理草稿",
    description: "查看和整理您的草稿",
    icon: <FileText className="h-5 w-5" />,
    href: "/drafts"
  },
  {
    title: "浏览作品",
    description: "查看您的所有作品",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/works"
  }
];

// 快速操作组件
export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
        <CardDescription>常用功能快速访问</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto justify-start gap-3 p-4 text-left"
              asChild
            >
              <a href={action.href}>
                <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                  {action.icon}
                </div>
                <div>
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**代码详解**：
1. 定义`QuickAction`接口，描述快速操作的数据结构
2. 创建模拟数据`quickActions`
3. 创建`QuickActions`组件，展示常用功能的快速访问按钮

**创建文件**：`src/app/(main)/page.tsx`

```tsx
import { BookText, BookOpen, FileText, PenTool } from "lucide-react";
import { StatsCard } from "./page-components/StatsCard";
import { RecentWorks } from "./page-components/RecentWorks";
import { QuickActions } from "./page-components/QuickActions";

// 首页组件
export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来，作家</h1>
        <p className="text-muted-foreground">
          这是您的小说创作管理系统，查看您的写作概览和最近更新。
        </p>
      </div>
      
      {/* 统计数据卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="总作品数"
          value="3"
          description="包含所有状态的作品"
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="总章节数"
          value="45"
          description="已完成的章节总数"
          icon={<BookText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="草稿箱"
          value="7"
          description="待处理的草稿数量"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="总字数"
          value="125,430"
          description="所有作品的总字数"
          icon={<PenTool className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      
      {/* 主要内容区域：最近作品和快速操作 */}
      <div className="grid gap-4 md:grid-cols-3">
        <RecentWorks />
        <div className="md:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
```

**代码详解**：
1. 导入刚刚创建的组件和图标
2. 创建`HomePage`组件作为首页
3. 布局包含三个主要部分：
   - 欢迎信息和描述
   - 统计数据卡片（作品数、章节数、草稿数、总字数）
   - 主要内容区域（最近作品和快速操作）

**执行目的**：
创建小说管理系统的首页，提供以下功能：
1. 展示作家创作的概览数据（作品数、章节数等）
2. 显示最近更新的作品，方便快速访问
3. 提供常用功能的快速入口
4. 使用卡片和网格布局，创建现代化、信息丰富的仪表盘

**替代方案**：
- **简单列表页面**：只展示作品列表，缺少数据概览，用户体验较差
- **单一功能入口**：缺少多功能快速访问，降低使用效率
- **文本重布局**：缺少可视化元素，不够直观

首页是小说管理系统的核心入口，我们设计的页面既美观又实用，为用户提供了清晰的系统概览和便捷的功能访问。
