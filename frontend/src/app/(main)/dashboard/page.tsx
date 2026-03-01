"use client";

import React, { useMemo } from "react";
import { BookText, BookOpen, FileText, PenTool, Plus, Zap } from "lucide-react";
import { useWorkList } from "@/hooks/work/useWorkService";
import { useDraftList } from "@/hooks/draft/useDraftService";
import type { DraftListResponseForClient } from "@/lib/services/draft.service";
import { WorksListForClient } from "@/lib/services/work.service";
import { formatWordCount } from "@/lib/utils";

import { StatCard } from "./components/StatCard";
import { QuickAction } from "./components/QuickAction";
import { RecentWorkCard } from "./components/RecentWorkCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
      recentWorks: sortedWorks.slice(0, 5), // Take top 5 for list
    };
  }, [worksList]);

  return (
    <div className="space-y-8 p-8 animate-in fade-in duration-500">
      {/* 头部欢迎区 */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            早安，作家
          </h1>
          <p className="mt-2 text-muted-foreground">
            准备好开始今天的创作了吗？这里是您的创作概览。
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/works">查看全部作品</Link>
          </Button>
          <Button asChild>
            <Link href="/works/new">
              <Plus className="mr-2 h-4 w-4" /> 新建作品
            </Link>
          </Button>
        </div>
      </div>

      {/* Bento Grid 布局 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {/* 第一行：统计数据 */}
        <StatCard
          title="总字数"
          value={formatWordCount(totalWordCount)}
          icon={PenTool}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
          delay={0.1}
        />
        <StatCard
          title="总作品"
          value={totalWorks.toString()}
          icon={BookOpen}
          delay={0.2}
        />
        <StatCard
          title="总章节"
          value={totalChapters.toString()}
          icon={BookText}
          delay={0.3}
        />
        <StatCard
          title="草稿箱"
          value={totalDrafts.toString()}
          icon={FileText}
          delay={0.4}
        />

        {/* 第二行：主要操作区 (占2列) + 最近作品 (占2列) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col gap-6">
          {/* 快捷操作 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 h-full">
            <QuickAction
              title="新建作品"
              description="开始构思您的下一个精彩故事"
              icon={Plus}
              href="/works/new"
              gradient="from-primary to-emerald-600"
              delay={0.5}
            />
            <QuickAction
              title="灵感速记"
              description="捕捉稍纵即逝的创意火花"
              icon={Zap}
              href="/tools/prompts"
              gradient="from-violet-500 to-purple-600"
              delay={0.6}
            />
          </div>
        </div>

        {/* 最近作品列表 (占2列，跨行) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">最近编辑</h3>
            <Link
              href="/works"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              全部
            </Link>
          </div>
          <div className="space-y-4">
            {recentWorks.length > 0 ? (
              recentWorks.map((work, index) => (
                <RecentWorkCard key={work.id} work={work} index={index} />
              ))
            ) : (
              <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/50 text-center">
                <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">暂无最近编辑的作品</p>
                <Button variant="link" asChild className="mt-2">
                  <Link href="/works/new">去创建</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
