"use client";

import {
  BookOpen,
  Bot,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useDraftList } from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import type { DraftListResponseForClient } from "@/lib/services/draft.service";
import { WorksListForClient } from "@/lib/services/work.service";
import { cn, formatWordCount } from "@/lib/utils";

import { QuickAction } from "./components/QuickAction";
import { RecentWorkCard } from "./components/RecentWorkCard";

type StatTileTone = "primary" | "accent" | "neutral";

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: StatTileTone;
  className?: string;
};

const STAT_TONE: Record<
  StatTileTone,
  { bg: string; border: string; iconBg: string; iconText: string; dot: string }
> = {
  primary: {
    bg: "bg-[var(--primary-50)]/70",
    border: "border-[var(--primary-200)]/60",
    iconBg: "bg-primary/10",
    iconText: "text-[var(--primary-600)]",
    dot: "bg-[var(--primary-500)]",
  },
  accent: {
    bg: "bg-[var(--accent-50)]/80",
    border: "border-[var(--accent-200)]/70",
    iconBg: "bg-[var(--accent-100)]/90",
    iconText: "text-[var(--accent-600)]",
    dot: "bg-[var(--accent-500)]",
  },
  neutral: {
    bg: "bg-card",
    border: "border-[var(--border-default)]/60",
    iconBg: "bg-muted/70",
    iconText: "text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

/**
 * 响应式数据卡：
 * - 窄屏（< sm）：纯文字垂直布局（label 上 + value 下），无图标，避免数据被截断
 * - 宽屏（sm+）：图标 + 文字水平布局
 */
function StatTile({
  label,
  value,
  unit,
  icon: Icon,
  tone = "neutral",
  className,
}: StatTileProps): React.ReactElement {
  const t = STAT_TONE[tone];
  return (
    <div
      className={cn(
        "group flex flex-col gap-1.5 rounded-xl border p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm sm:flex-row sm:items-center sm:gap-3 sm:p-3.5",
        t.bg,
        t.border,
        className
      )}
    >
      {/* 图标：仅 sm+ 显示 */}
      <span
        className={cn(
          "hidden sm:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
          t.iconBg,
          t.iconText
        )}
        aria-hidden
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-1 w-1 rounded-full", t.dot)} aria-hidden />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
            {label}
          </span>
        </div>
        <div className="mt-1 flex items-baseline gap-1 sm:mt-0.5">
          <span className="truncate text-lg font-extrabold tracking-tight text-foreground tabular-nums sm:text-xl">
            {value}
          </span>
          {unit ? (
            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">{unit}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage(): React.ReactElement {
  const { data: worksData } = useWorkList({ limit: 1000 });
  const { data: draftsData } = useDraftList({ limit: 999999 });
  const [hitokoto, setHitokoto] = useState("正在加载一言...");
  const [hitokotoSource, setHitokotoSource] = useState("");
  const [isRefreshingQuote, setIsRefreshingQuote] = useState(false);

  const worksList = worksData as WorksListForClient | undefined;
  const draftsList = draftsData as DraftListResponseForClient | undefined;

  const totalDrafts = draftsList?.pagination?.total ?? 0;

  const {
    latestWork,
    latestUpdatedLabel,
    totalChapters,
    totalWordCount,
    recentWorks,
    totalWorks,
  } = useMemo(() => {
    if (!worksList?.data) {
      return {
        latestUpdatedLabel: "暂无最近更新",
        latestWork: undefined,
        totalChapters: 0,
        totalWordCount: 0,
        recentWorks: [],
        totalWorks: 0,
      };
    }

    const sortedWorks = [...worksList.data].sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
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
      latestUpdatedLabel: sortedWorks[0]?.updatedAt
        ? `${new Date(sortedWorks[0].updatedAt).toLocaleDateString("zh-CN")} 更新`
        : "暂无最近更新",
      latestWork: sortedWorks[0],
      recentWorks: sortedWorks.slice(0, 3),
      totalWorks: worksList.data.length,
    };
  }, [worksList]);

  const greetingTitle = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "早安，作家";
    if (hour >= 11 && hour < 14) return "中午好，作家";
    if (hour >= 14 && hour < 18) return "下午好，作家";
    if (hour >= 18 && hour < 24) return "晚上好，作家";
    return "夜深了，作家";
  }, []);

  const refreshHitokoto = useCallback(async (): Promise<void> => {
    setIsRefreshingQuote(true);
    try {
      const response = await fetch("https://v1.hitokoto.cn/?encode=json", {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        from?: string;
        from_who?: string;
        hitokoto?: string;
      };

      setHitokoto(data.hitokoto || "慢慢写，也会写到想去的地方。");
      setHitokotoSource(
        data.from_who ? `${data.from || "一言"} · ${data.from_who}` : data.from || "一言"
      );
    } catch {
      setHitokoto("慢慢写，也会写到想去的地方。");
      setHitokotoSource("一言");
    } finally {
      setIsRefreshingQuote(false);
    }
  }, []);

  useEffect(() => {
    void refreshHitokoto();
  }, [refreshHitokoto]);

  const formattedTotalWords = formatWordCount(totalWordCount);
  const latestUpdatedShort = latestUpdatedLabel.replace(/\s*更新$/, "");

  return (
    <div className="relative space-y-6 sm:space-y-8">
      {/* === 主 grid：Hero + 焦点 + 快速开始 + 创作动态 在左列；最近编辑 aside 在右列 === */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)] xl:gap-10 2xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)] 2xl:gap-12">
        <div className="space-y-6 sm:space-y-8">
          {/* === Hero === */}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-5 animate-in fade-in slide-in-from-top-4 duration-500 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 hidden h-44 w-44 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3 sm:max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
                  <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                    焦点
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                    今日创作
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl xl:text-[2.5rem] xl:leading-[1.1]">
                  {greetingTitle}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  在创作节奏中继续推进你的作品、草稿与灵感整理。
                </p>
                <button
                  type="button"
                  onClick={() => void refreshHitokoto()}
                  className="group inline-flex max-w-3xl items-start gap-2 -ml-2 rounded-xl border border-transparent px-2 py-1 text-left text-[13px] text-muted-foreground transition-all hover:border-[var(--primary-200)]/60 hover:bg-[var(--primary-50)]/60 hover:text-foreground sm:text-sm"
                >
                  <RefreshCw
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform",
                      isRefreshingQuote ? "animate-spin" : "group-hover:rotate-90"
                    )}
                  />
                  <span className="min-w-0 leading-6">
                    <span>一言：{hitokoto}</span>
                    {hitokotoSource ? (
                      <span className="ml-2 text-xs text-muted-foreground/70">#{hitokotoSource}</span>
                    ) : null}
                  </span>
                </button>
              </div>

              {/* CTA：sm 起就 col + items-end + self-start，与焦点卡断点完全一致 */}
              <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2 sm:self-start">
                <Button
                  asChild
                  className="h-11 rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Link href="/works/new">
                    <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold">
                      <Plus className="h-4 w-4" />
                      新建作品
                    </span>
                  </Link>
                </Button>
                <Link
                  href="/works"
                  className="group inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  全部作品
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Hero 内嵌 3 数据卡 */}
            <div className="relative mt-5 grid grid-cols-3 gap-2.5 sm:mt-6 sm:gap-3">
              <StatTile
                tone="primary"
                label="总字数"
                value={formattedTotalWords}
                icon={Sparkles}
              />
              <StatTile
                tone="neutral"
                label="章节"
                value={totalChapters}
                unit="章"
                icon={BookOpen}
              />
              <StatTile
                tone="accent"
                label="草稿"
                value={totalDrafts}
                unit="条"
                icon={FileText}
              />
            </div>
          </section>

          {/* === 焦点卡 === */}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(160deg,#ffffff_0%,#ffffff_55%,var(--primary-50)_100%)] p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-10 -right-10 hidden h-52 w-52 rounded-full bg-[var(--primary-500)]/8 blur-3xl sm:block"
            />

            {latestWork ? (
              <div className="relative space-y-5">
                {/* 标题区：左封面 + 中文字 + 右 CTA */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  {/* 左：作品封面 */}
                  <Link
                    href={`/works/${latestWork.id}`}
                    className="group relative block aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--primary-200)]/60 bg-[linear-gradient(180deg,var(--primary-50),var(--primary-100)/40)] transition-all hover:border-[var(--primary-300)] sm:w-28 lg:w-[7.5rem]"
                  >
                    <Image
                      src={latestWork.coverImageUrl || ""}
                      alt={latestWork.title || "作品封面"}
                      fallbackText={latestWork.title || "作品"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {/* 中：作品信息 */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
                      <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                        焦点
                      </span>
                      <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                        当前写作
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl xl:text-[1.875rem]">
                      {latestWork.title}
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                      最近更新于 {latestUpdatedShort}，累计 {formatWordCount(latestWork.totalWordCount || 0)}，
                      共 {latestWork.totalChapterCount || 0} 章。
                    </p>
                  </div>

                  {/* 右：CTA */}
                  <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-2 sm:self-start">
                    <Button
                      asChild
                      className="h-11 rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <Link href={`/works/${latestWork.id}`}>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap font-semibold">
                          <RefreshCw className="h-4 w-4" />
                          继续创作
                        </span>
                      </Link>
                    </Button>
                    <Link
                      href={`/works/${latestWork.id}/drafts`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      作品草稿
                    </Link>
                  </div>
                </div>

                {/* 底部：3 列数据 */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <StatTile
                    tone="primary"
                    label="最近更新"
                    value={latestUpdatedShort}
                    icon={Clock}
                  />
                  <StatTile
                    tone="neutral"
                    label="当前字数"
                    value={formatWordCount(latestWork.totalWordCount || 0)}
                    icon={Sparkles}
                  />
                  <StatTile
                    tone="neutral"
                    label="当前章节"
                    value={latestWork.totalChapterCount || 0}
                    unit="章"
                    icon={BookOpen}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-7 w-7" />
                </span>
                <p className="text-sm text-muted-foreground">还没有作品，开始你的第一部吧</p>
                <Button
                  asChild
                  className="mt-1 h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                >
                  <Link href="/works/new">
                    <Plus className="mr-1.5 h-4 w-4" />
                    新建作品
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* === 快速开始 === */}
          <section className="rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 sm:p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                快速开始
              </h3>
              <p className="text-[12px] text-muted-foreground sm:text-[13px]">
                草稿箱 / 提示词 / AI 助手
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
              <QuickAction
                title="灵感速记"
                description={`${totalDrafts} 条草稿待处理`}
                icon={FileText}
                href="/drafts"
                tone="primary"
              />
              <QuickAction
                title="提示词"
                description="维护模板与提示词"
                icon={Sparkles}
                href="/tools/prompts"
                tone="accent"
              />
              <QuickAction
                title="AI 助手"
                description="对话与整理思路"
                icon={Bot}
                href="/tools/ai-assistant"
                tone="neutral"
              />
            </div>
          </section>

          {/* === 创作动态 === */}
          <section className="rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-[400ms] sm:p-6">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight text-foreground">
                创作动态
              </h3>
              <p className="text-[12px] text-muted-foreground sm:text-[13px]">
                节奏面板与活动流，记录你的创作脉搏
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
              <div className="group relative overflow-hidden rounded-xl border border-[var(--primary-200)]/60 bg-[var(--primary-50)]/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-300)]/70 hover:shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)]" aria-hidden />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary-700)]">
                        节奏面板
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-foreground">写作日历</h4>
                    <p className="text-sm leading-6 text-muted-foreground">
                      后续展示每日创作记录、断更提醒与阶段目标。
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-[var(--primary-200)]/60 bg-card px-2.5 py-1 text-[10px] font-semibold text-[var(--primary-700)]">
                    待接入
                  </span>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-xl border border-[var(--accent-200)]/70 bg-[var(--accent-50)]/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-300)] hover:shadow-sm sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" aria-hidden />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-700)]">
                        事件流
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-foreground">最近活动</h4>
                    <p className="text-sm leading-6 text-muted-foreground">
                      后续展示章节推进、草稿更新与创作提醒。
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full border border-[var(--accent-200)]/70 bg-card px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-700)]">
                    待接入
                  </span>
                </div>
                <div className="mt-3 space-y-2 rounded-lg border border-[var(--accent-200)]/50 bg-card/80 p-3">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>最近一次草稿整理</span>
                    <span className="font-medium">待接入</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>章节推进提醒</span>
                    <span className="font-medium">待接入</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* === 最近编辑 aside（右列，跨越多行） === */}
        <aside className="space-y-4 rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-5 animate-in fade-in duration-500 delay-500 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                最近编辑
              </h2>
              <p className="text-[12px] text-muted-foreground sm:text-[13px]">
                快速回到上一段创作
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)]/60 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <span className="tabular-nums font-semibold text-foreground">{totalWorks}</span>
              <span>部作品</span>
            </span>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-[var(--primary-200)]/60 bg-[var(--primary-50)]/60 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-card py-1 pl-1 pr-3">
                  <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                    状态
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                    草稿箱
                  </span>
                </div>
                <p className="text-[13px] leading-5 text-muted-foreground sm:leading-6">
                  <span className="font-bold text-foreground tabular-nums">{totalDrafts}</span> 条草稿待处理，回到最近作品继续推进。
                </p>
              </div>
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-4 w-4" />
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="uppercase tracking-wider text-muted-foreground">最近更新作品</span>
              <Link
                href="/works"
                className="group inline-flex items-center gap-0.5 text-primary transition-colors hover:text-primary/80"
              >
                查看全部
                <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {recentWorks.length > 0 ? (
                recentWorks.map((work, index) => (
                  <RecentWorkCard key={work.id} work={work} index={index} />
                ))
              ) : (
                <div className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-default)] bg-muted/30 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">暂无最近编辑的作品</p>
                  <Button variant="link" asChild className="h-auto p-0 text-primary">
                    <Link href="/works/new">去创建 →</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
