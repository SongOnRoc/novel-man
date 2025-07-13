## 已完成的部分总结[必须]

目前我们已经完成了：

1. xxx
2. xxx
3. xxx
4. xxx
5. xxx
   ...

## 第 6 步：xxx [必须]

为了（从 xx 考虑）接下来，我们需要 xxx

**执行命令**： [必须]

```
xxx
```

**创建文件**：`src/app/(main)/page-components/StatsCard.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 定义统计卡片的属性类型
interface StatsCardProps {
  title: string; // 卡片标题
  value: string; // 统计值
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

**代码详解**：[必须]

1. 定义`StatsCardProps`接口，描述统计卡片的属性
2. 创建`StatsCard`组件，显示统计信息（如作品数量、字数等）
3. 使用 Card 组件作为基础，展示标题、值和可选描述

**创建文件**：`src/app/(main)/page-components/RecentWorks.tsx` [必须]

```tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    updatedAt: "2023-09-20",
  },
  {
    id: "2",
    title: "都市之全能高手",
    chapters: 15,
    updatedAt: "2023-09-18",
  },
  {
    id: "3",
    title: "星际穿越之旅",
    chapters: 7,
    updatedAt: "2023-09-15",
  },
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
            <div
              key={work.id}
              className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
            >
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

**代码详解**：[必须]

1. 定义`Work`接口，描述作品数据结构
2. 创建模拟数据`recentWorks`（后续会从 API 获取）
3. 创建`RecentWorks`组件，展示最近更新的作品列表

**执行目的**：[必须]
创建小说管理系统的首页，提供以下功能：

1. xxx
2. xxx
3. xxx
   ...

**替代方案**：[必须]

- **xxx**：xxxxx
- **xxx**：xxxxx
- **xxx**：xxxxx
  ....

**小结\***：[必须]
首页是小说管理系统的核心入口，我们设计的页面既美观又实用，为用户提供了清晰的系统概览和便捷的功能访问。
