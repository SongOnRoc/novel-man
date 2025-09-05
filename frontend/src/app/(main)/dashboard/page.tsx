"use client";

import React, { useMemo } from "react";
import { BookText, BookOpen, FileText, PenTool } from "lucide-react";
import { QuickActions } from "./components/QuickActions";
import { RecentWorks } from "./components/RecentWorks";
import { StatsCard } from "./components/StatsCard";
import { useWorkList } from "@/hooks/work/useWorkService";
import { useDraftList } from "@/hooks/draft/useDraftService";
import type { DraftListResponseForClient } from "@/lib/services/draft.service";
import { WorksListForClient } from "@/lib/services/work.service";
import { formatWordCount } from "@/lib/utils";

export default function DashboardPage(): React.ReactElement {
  const { data: worksData } = useWorkList({ limit: 1000 });
  const { data: draftsData } = useDraftList({ limit: 999999 });

  const worksList = worksData as WorksListForClient | undefined;
  const draftsList = draftsData as DraftListResponseForClient | undefined;

  const totalWorks = worksList?.pagination?.total ?? 0;
  const totalDrafts = draftsList?.pagination?.total ?? 0;

  const { totalChapters, totalWordCount, recentWorks } = useMemo(() => {
    if (!worksList?.data) {
      return { totalChapters: 0, totalWordCount: 0, recentWorks: [] };
    }

    const sortedWorks = [...worksList.data].sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
    );

    const stats = worksList.data.reduce<{
      totalChapters: number;
      totalWordCount: number;
    }>(
      (acc, work) => {
        acc.totalChapters += work.totalChapterCount || 0;
        acc.totalWordCount += work.totalWordCount || 0;
        return acc;
      },
      { totalChapters: 0, totalWordCount: 0 }
    );

    return {
      ...stats,
      recentWorks: sortedWorks.slice(0, 3),
    };
  }, [worksList]);

  const latestDraft = useMemo(() => {
    if (!draftsList?.data) return undefined;
    return [...draftsList.data].sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
    )[0];
  }, [draftsList]);

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
      <QuickActions latestWork={recentWorks[0]} latestDraft={latestDraft} />

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
            value={formatWordCount(totalWordCount)}
            description="所有作品的总字数"
            icon={<PenTool className="h-8 w-8" />}
            className="text-blue-500"
          />
        </div>

        {/* 右侧：最近作品 */}
        <div className="lg:col-span-1">
          <RecentWorks recentWorks={recentWorks} />
        </div>
      </div>
    </div>
  );
}
