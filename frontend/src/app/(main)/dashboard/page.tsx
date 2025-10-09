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
    <div className="flex flex-col gap-8 animate-fadeInUp">
      {/* 顶部标题区 */}
      <div className="animate-fadeInDown">
        <h1 className="text-4xl font-bold tracking-tight text-gradient-primary">欢迎回来，作家</h1>
        <p className="text-muted-foreground mt-2">
          这是您的小说创作管理系统，查看您的写作概览和最近更新。
        </p>
      </div>

      {/* 快速操作 */}
      <div className="animate-fadeInUp" style={{animationDelay: "0.1s"}}>
        <QuickActions latestWork={recentWorks[0]} latestDraft={latestDraft} />
      </div>

      {/* 主内容区：数据概览 + 核心内容 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左侧：统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-2 lg:grid-cols-2 items-start">
          <div className="animate-fadeInUp" style={{animationDelay: "0.2s"}}>
            <StatsCard
              title="总作品数"
              value={totalWorks.toString()}
              description="包含所有状态的作品"
              icon={<BookOpen className="h-8 w-8" />}
              className="card-primary"
            />
          </div>
          <div className="animate-fadeInUp" style={{animationDelay: "0.3s"}}>
            <StatsCard
              title="总章节数"
              value={totalChapters.toString()}
              description="已完成的章节总数"
              icon={<BookText className="h-8 w-8" />}
              className="card-accent"
            />
          </div>
          <div className="animate-fadeInUp" style={{animationDelay: "0.4s"}}>
            <StatsCard
              title="草稿箱"
              value={totalDrafts.toString()}
              description="待处理的草稿数量"
              icon={<FileText className="h-8 w-8" />}
              className="modern-card shadow-glow-accent"
              highlight
            />
          </div>
          <div className="animate-fadeInUp" style={{animationDelay: "0.5s"}}>
            <StatsCard
              title="总字数"
              value={formatWordCount(totalWordCount)}
              description="所有作品的总字数"
              icon={<PenTool className="h-8 w-8" />}
              className="modern-card shadow-glow-primary"
            />
          </div>
        </div>

        {/* 右侧：最近作品 */}
        <div className="lg:col-span-1 animate-fadeInUp" style={{animationDelay: "0.6s"}}>
          <RecentWorks recentWorks={recentWorks} />
        </div>
      </div>
    </div>
  );
}
