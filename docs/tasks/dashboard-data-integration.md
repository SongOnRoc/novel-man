# 仪表盘数据集成方案 (最终版)

## 1. 概述

本文档旨在为开发人员提供将仪表盘（Dashboard）中的模拟数据替换为真实数据的详细实施方案。通过对后端模型的扩展和业务逻辑的调整，我们将以最高效、最可靠的方式实现动态数据展示。

## 2. 需求分析

*   **获取统计数据：**
    *   作品总数
    *   章节总数
    *   草稿总数
    *   所有作品的总字数（仅计算已发布章节的字数）
*   **获取最近的作品列表**

## 3. 最终方案：后端增量计算，前端聚合

经过深入讨论，我们确定了以下方案为最佳实践，它巧妙地平衡了性能、数据一致性和实现复杂性。

### 3.1. 后端修改

#### 3.1.1. 数据库模型扩展

*   在 `Work` 模型（对应数据库中的 `works` 表）中，增加一个新字段：
    *   **字段名：** `total_word_count`
    *   **类型：** `INTEGER` 或 `BIGINT`
    *   **默认值：** `0`

#### 3.1.2. 后端业务逻辑更新

*   **触发时机：** 当后端处理创建、更新或删除**章节** (`Chapter`) 的API请求时。
*   **核心逻辑：** 在成功完成对章节的数据库操作后，后端需要**同步**执行以下操作：
    1.  获取该章节所属的 `work_id`。
    2.  根据 `work_id`，重新计算该作品下所有章节的字数总和。
        ```sql
        -- 示例 SQL 查询
        SELECT SUM(word_count) FROM chapters WHERE work_id = [该章节的 work_id];
        ```
    3.  将计算出的新总和更新到 `works` 表中对应 `Work` 的 `total_word_count` 字段。

### 3.2. 前端实现

#### 3.2.1. API钩子

*   **`useWorkList`**：获取所有作品的列表。
*   **`useChapterList`**：获取所有章节的列表（用于章节总数统计）。
*   **`useDraftList`**：获取所有草稿的列表（用于草稿总数统计）。

#### 3.2.2. 更新仪表盘页面 (`page.tsx`)

1.  **导入钩子并获取数据：**

    ```typescript
    "use client";

    import React, { useMemo } from "react";
    import { BookText, BookOpen, FileText, PenTool } from "lucide-react";
    import { QuickActions } from "./components/QuickActions";
    import { RecentWorks } from "./components/RecentWorks";
    import { StatsCard } from "./components/StatsCard";
    import { useWorkList } from "@/hooks/work/useWorkService";
    import { useChapterList } from "@/hooks/chapter/useChapterService";
    import { useDraftList } from "@/hooks/draft/useDraftService";

    export default function DashboardPage(): React.ReactElement {
      const { data: worksData } = useWorkList({ limit: 1000 }); // 获取所有作品
      const { data: chaptersData } = useChapterList({ workId: 0, limit: 1 }); // 用于获取总数
      const { data: draftsData } = useDraftList({});

      const totalWorks = worksData?.pagination?.total ?? 0;
      const totalChapters = chaptersData?.pagination?.total ?? 0;
      const totalDrafts = draftsData?.pagination?.total ?? 0;

      const totalWordCount = useMemo(() => {
        if (!worksData?.data) return 0;
        return worksData.data.reduce((acc, work) => acc + (work.total_word_count || 0), 0);
      }, [worksData]);

      return (
        <div className="flex flex-col gap-8">
          {/* 顶部标题区 */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">欢迎回来，作家</h1>
            <p className="text-muted-foreground">
              这是您的小说创作管理系统，查看您的写作概览和最近更新。
            </p>
          </div>

          {/* 快速操作 */}
          <QuickActions />

          {/* 主内容区：数据概览 + 核心内容 */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* 左侧：统计卡片 */}
            <div className="grid gap-6 md:grid-cols-2 lg:col-span-2 lg:grid-cols-2 items-start">
              <StatsCard
                title="总作品数"
                value={totalWorks.toString()}
                description="包含所有状态的作品"
                icon={<BookOpen className="h-8 w-8" />}
                className="text-primary"
              />
              <StatsCard
                title="总章节数"
                value={totalChapters.toString()}
                description="已完成的章节总数"
                icon={<BookText className="h-8 w-8" />}
                className="text-green-500"
              />
              <StatsCard
                title="草稿箱"
                value={totalDrafts.toString()}
                description="待处理的草稿数量"
                icon={<FileText className="h-8 w-8" />}
                className="text-orange-500"
                highlight
              />
              <StatsCard
                title="总字数"
                value={totalWordCount.toLocaleString()}
                description="所有作品的总字数"
                icon={<PenTool className="h-8 w-8" />}
                className="text-blue-500"
              />
            </div>

            {/* 右侧：最近作品 */}
            <div className="lg:col-span-1">
              <RecentWorks />
            </div>
          </div>
        </div>
      );
    }
    ```

#### 3.2.3. 更新 `RecentWorks` 组件

在 `frontend/src/app/(main)/dashboard/components/RecentWorks.tsx` 中，进行以下修改：

1.  **移除硬编码数据：** 删除 `recentWorks` 数组。
2.  **使用 `useWorkList` 钩子获取数据：**

    ```typescript
    "use client";

    import React from "react";
    import { BookOpen, Edit } from "lucide-react";
    import { Button } from "@/components/ui/button";
    import {
      Card,
      CardContent,
      CardDescription,
      CardHeader,
      CardTitle,
    } from "@/components/ui/card";
    import { useWorkList } from "@/hooks/work/useWorkService";
    import { Work } from "@/lib/services/work.service";

    export function RecentWorks(): React.ReactElement {
      const { data: worksData, isLoading } = useWorkList({ limit: 5, page: 1 });
      const recentWorks = worksData?.data ?? [];

      if (isLoading) {
        return <div>Loading...</div>; // Or a skeleton loader
      }

      return (
        <Card className="h-full">
          <CardHeader>
            <CardTitle>最近作品</CardTitle>
            <CardDescription>您最近更新的作品列表</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentWorks.map((work: Work) => (
                <a
                  key={work.id}
                  href={`/works/${work.id}`}
                  className="group flex items-center justify-between rounded-lg p-3 transition-all duration-300 hover:bg-accent/50 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <BookOpen className="h-10 w-10 rounded-md border p-2 text-primary" />
                    <div>
                      <div className="font-semibold">{work.title}</div>
                      <div className="text-sm text-muted-foreground">
                        <span>更新于 {new Date(work.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }
    ```

## 4. 方案优势

*   **高性能：** 前端加载仪表盘时，只需一次 `useWorkList` API调用即可获得计算总字数所需的所有数据。后端对 `works` 表的读取操作也极其快速。
*   **数据强一致性：** 字数统计的核心计算和存储逻辑完全在后端完成，并与章节操作在同一事务中（或紧随其后），确保了数据的高度一致性和可靠性。
*   **低负载：** 避免了在读取仪表盘时进行高成本的实时聚合查询。计算压力被分散到低频的写操作（创建/更新/删除章节）中，对数据库的总体负载影响极小。
*   **职责清晰：** 前端负责数据展示和简单的聚合，后端负责核心业务逻辑和数据持久化，架构清晰，易于维护。

## 5. 总结

本方案通过在后端进行增量计算和持久化，前端进行轻量级聚合的方式，完美地解决了仪表盘数据的实时统计需求。它在性能、数据一致性和系统负载之间取得了最佳平衡，是实现此功能的理想选择。