"use client";

import {
  BookOpen,
  Bot,
  FileText,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useDraftList } from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import type { DraftListResponseForClient } from "@/lib/services/draft.service";
import { WorksListForClient } from "@/lib/services/work.service";
import { formatWordCount } from "@/lib/utils";

import { QuickAction } from "./components/QuickAction";
import { RecentWorkCard } from "./components/RecentWorkCard";

type MobileTitleActionProps = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: "primary" | "muted";
};

function MobileTitleAction({
  href,
  icon: Icon,
  label,
  tone = "primary",
}: MobileTitleActionProps): React.ReactElement {
  const iconClass =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : "bg-muted/40 text-muted-foreground/80";
  const textClass = tone === "primary" ? "text-primary" : "text-muted-foreground/80";

  return (
    <Link
      href={href}
      className="inline-flex min-w-[3.75rem] flex-col items-center gap-1 px-1 py-0.5 text-center"
    >
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${iconClass}`}
      >
        <Icon className="h-2.5 w-2.5 shrink-0" />
      </span>
      <span className={`whitespace-nowrap text-[9px] font-semibold leading-none ${textClass}`}>
        {label}
      </span>
    </Link>
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
  } = useMemo(() => {
    if (!worksList?.data) {
      return {
        latestUpdatedLabel: "暂无最近更新",
        latestWork: undefined,
        totalChapters: 0,
        totalWordCount: 0,
        recentWorks: [],
      };
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
      latestUpdatedLabel: sortedWorks[0]?.updatedAt
        ? `${new Date(sortedWorks[0].updatedAt).toLocaleDateString("zh-CN")} 更新`
        : "暂无最近更新",
      latestWork: sortedWorks[0],
      recentWorks: sortedWorks.slice(0, 3),
    };
  }, [worksList]);

  const greetingTitle = useMemo(() => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 11) {
      return "早安，作家";
    }

    if (hour >= 11 && hour < 14) {
      return "中午好，作家";
    }

    if (hour >= 14 && hour < 18) {
      return "下午好，作家";
    }

    if (hour >= 18 && hour < 24) {
      return "晚上好，作家";
    }

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

  return (
    <div className="relative min-h-screen animate-in fade-in overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_34%,#f4fbfb_100%)] p-3.5 duration-500 sm:p-5 xl:p-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.09),transparent_28%)] xl:block" />
      <div className="relative mx-auto w-full max-w-[1680px] space-y-3 sm:space-y-4">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-border/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,255,255,0.93)_58%,rgba(240,253,250,0.92))] p-4 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.34)] sm:p-5 xl:p-6">
          <div className="pointer-events-none absolute -left-8 top-6 hidden h-40 w-40 rounded-full bg-primary/12 blur-3xl xl:block" />
          <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[28rem] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_45%_65%,rgba(20,184,166,0.07),transparent_30%)] xl:block" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 lg:max-w-4xl">
              <div className="flex items-start justify-between gap-3 sm:block">
                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl xl:text-[2.75rem] xl:leading-none">
                    {greetingTitle}
                  </h1>
                  <p className="hidden text-sm font-medium text-primary/70 xl:block">
                    在创作节奏中继续推进你的作品、草稿与灵感整理
                  </p>
                </div>
                <div className="flex items-start gap-2 sm:hidden">
                  <MobileTitleAction href="/works/new" icon={Plus} label="新建作品" />
                  <MobileTitleAction
                    href="/works"
                    icon={BookOpen}
                    label="全部作品"
                    tone="muted"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refreshHitokoto()}
                className="group inline-flex max-w-3xl items-start gap-2 text-left text-[13px] text-muted-foreground/84 transition-colors hover:text-foreground sm:text-sm"
              >
                <RefreshCw
                  className={`mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform ${
                    isRefreshingQuote ? "animate-spin" : "group-hover:rotate-12"
                  }`}
                />
                <span className="min-w-0 leading-6">
                  <span>一言：{hitokoto}</span>
                  {hitokotoSource ? (
                    <span className="ml-2 inline text-xs text-muted-foreground/75">#{hitokotoSource}</span>
                  ) : null}
                </span>
              </button>

              <div className="hidden items-start gap-4 text-sm text-muted-foreground sm:flex">
                <div className="rounded-[1.35rem] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)] backdrop-blur-sm">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground/70">总字数</div>
                  <div className="mt-2 text-[1.45rem] font-semibold tracking-tight text-foreground">
                    {formatWordCount(totalWordCount)}
                  </div>
                </div>
                <div className="rounded-[1.35rem] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)] backdrop-blur-sm">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground/70">章节</div>
                  <div className="mt-2 text-[1.45rem] font-semibold tracking-tight text-foreground">{totalChapters}</div>
                </div>
                <div className="rounded-[1.35rem] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)] backdrop-blur-sm">
                  <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground/70">草稿</div>
                  <div className="mt-2 text-[1.45rem] font-semibold tracking-tight text-foreground">{totalDrafts}</div>
                </div>
              </div>

              <div className="grid max-w-2xl grid-cols-3 gap-2.5 text-[13px] text-muted-foreground sm:hidden sm:text-sm">
                <div className="rounded-[1rem] border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.38)] sm:px-4">
                  <div className="text-[11px] font-medium tracking-wide text-muted-foreground/75">总字数</div>
                  <div className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                    {formatWordCount(totalWordCount)}
                  </div>
                </div>
                <div className="rounded-[1rem] border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.38)] sm:px-4">
                  <div className="text-[11px] font-medium tracking-wide text-muted-foreground/75">章节</div>
                  <div className="mt-1 text-base font-semibold text-foreground sm:text-lg">{totalChapters}</div>
                </div>
                <div className="rounded-[1rem] border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.38)] sm:px-4">
                  <div className="text-[11px] font-medium tracking-wide text-muted-foreground/75">草稿</div>
                  <div className="mt-1 text-base font-semibold text-foreground sm:text-lg">{totalDrafts}</div>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex sm:w-auto sm:flex-row sm:gap-3 lg:flex-col lg:items-stretch lg:gap-1.5 lg:self-start lg:pt-0.5">
              <Button asChild className="h-11 w-[108px] rounded-full bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90">
                <Link href="/works/new">
                  <span className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap font-medium">
                    <Plus className="h-4 w-4 shrink-0" />
                    <span>新建作品</span>
                  </span>
                </Link>
              </Button>
              <Link
                href="/works"
                className="inline-flex h-8 w-[108px] items-center justify-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span>全部作品</span>
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <section className="rounded-[1.125rem] border border-primary/10 bg-primary/[0.025] p-3 sm:hidden">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <h2 className="text-[1.125rem] font-extrabold tracking-tight text-foreground">
                      最近作品
                    </h2>
                    {latestWork ? (
                      <span className="truncate rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary/80">
                        {latestWork.title}
                      </span>
                    ) : null}
                  </div>
                  {latestWork ? (
                    <div className="flex items-start gap-2">
                      <MobileTitleAction
                        href={`/works/${latestWork.id}`}
                        icon={RefreshCw}
                        label="继续创作"
                      />
                      <MobileTitleAction
                        href={`/works/${latestWork.id}/drafts`}
                        icon={FileText}
                        label="作品草稿"
                        tone="muted"
                      />
                    </div>
                  ) : null}
                </div>

                {latestWork ? (
                  <div className="rounded-[1rem] border border-primary/8 bg-white p-2.5 shadow-sm">
                    <div className="grid grid-cols-3 gap-1.5 text-center text-sm text-muted-foreground">
                        <div className="rounded-[0.875rem] border border-primary/8 bg-transparent px-2 py-1.5">
                        <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70">
                          最近更新
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-foreground">
                          {latestUpdatedLabel.replace(/\s*更新$/, "")}
                        </div>
                      </div>

                        <div className="rounded-[0.875rem] border border-primary/8 bg-transparent px-2 py-1.5">
                        <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70">
                          当前字数
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-foreground">
                          {formatWordCount(latestWork.totalWordCount || 0)}
                        </div>
                      </div>

                        <div className="rounded-[0.875rem] border border-primary/8 bg-transparent px-2 py-1.5">
                        <div className="text-[10px] font-medium tracking-wide text-muted-foreground/70">
                          当前章节
                        </div>
                        <div className="mt-0.5 text-[13px] font-semibold text-foreground">
                          {latestWork.totalChapterCount || 0} 章
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed bg-white p-5 text-center text-sm text-muted-foreground">
                    暂无最近作品
                  </div>
                )}
              </div>
            </section>

             <section className="hidden rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,251,251,0.94))] p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.36)] sm:block">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[1.5rem] font-extrabold tracking-tight text-foreground xl:text-[1.625rem]">
                        最近作品
                      </h2>
                      {latestWork ? (
                        <span className="truncate rounded-full bg-primary/12 px-2.5 py-1 text-[12px] font-semibold text-primary/80">
                          {latestWork.title}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="hidden sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <Button asChild className="h-10 rounded-full bg-primary px-5 text-primary-foreground shadow-none hover:bg-primary/90">
                      <Link href={latestWork ? `/works/${latestWork.id}` : "/works/new"}>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <RefreshCw className="h-4 w-4 shrink-0" />
                          <span>继续创作</span>
                        </span>
                      </Link>
                    </Button>
                    <Link
                      href={latestWork ? `/works/${latestWork.id}/drafts` : "/drafts"}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span>作品草稿</span>
                    </Link>
                  </div>
                </div>

                 {latestWork ? (
                   <div className="rounded-[1.55rem] border border-white/80 bg-white/90 p-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.4)] backdrop-blur-sm">
                     <div className="space-y-3">
                       <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_220px]">
                         <div className="rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(160deg,rgba(240,253,250,0.95),rgba(239,246,255,0.82)_56%,rgba(255,255,255,0.94))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                           <div className="space-y-1.5">
                             <div className="text-[11px] font-semibold tracking-[0.18em] text-primary/75">
                               当前写作焦点
                             </div>
                             <div className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                               {latestWork.title}
                             </div>
                             <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                               最近更新于 {latestUpdatedLabel.replace(/\s*更新$/, "")}，当前累计
                               {formatWordCount(latestWork.totalWordCount || 0)}，共
                               {latestWork.totalChapterCount || 0} 章。
                             </p>
                           </div>
                         </div>
 
                         <div className="grid gap-2 text-sm text-muted-foreground xl:grid-cols-1">
                           <div className="rounded-[1.1rem] border border-white/80 bg-white/88 px-3.5 py-3 shadow-[0_18px_28px_-28px_rgba(15,23,42,0.42)]">
                             <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70">
                               最近更新
                             </div>
                             <div className="mt-1.5 text-base font-semibold text-foreground">
                               {latestUpdatedLabel.replace(/\s*更新$/, "")}
                             </div>
                           </div>
                           <div className="rounded-[1.1rem] border border-white/80 bg-white/88 px-3.5 py-3 shadow-[0_18px_28px_-28px_rgba(15,23,42,0.42)]">
                             <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70">
                               当前字数
                             </div>
                             <div className="mt-1.5 text-base font-semibold text-foreground">
                               {formatWordCount(latestWork.totalWordCount || 0)}
                             </div>
                           </div>
                           <div className="rounded-[1.1rem] border border-white/80 bg-white/88 px-3.5 py-3 shadow-[0_18px_28px_-28px_rgba(15,23,42,0.42)]">
                             <div className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground/70">
                               当前章节
                             </div>
                             <div className="mt-1.5 text-base font-semibold text-foreground">
                               {latestWork.totalChapterCount || 0} 章
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed bg-white p-5 text-center text-sm text-muted-foreground">
                    暂无最近作品
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    快速开始
                  </h3>
                  <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                    草稿箱 / 提示词 / AI
                  </p>
                </div>
              </div>

              <div className="mt-3.5 space-y-2.5 md:hidden">
                <QuickAction
                  title="灵感速记"
                  description={`${totalDrafts} 条草稿待处理`}
                  icon={FileText}
                  href="/drafts"
                  compact
                />
                <QuickAction
                  title="提示词"
                  description="维护模板与提示词"
                  icon={Sparkles}
                  href="/tools/prompts"
                  compact
                />
                <QuickAction
                  title="AI 助手"
                  description="对话与整理思路"
                  icon={Bot}
                  href="/tools/ai-assistant"
                  compact
                />
              </div>

                <div className="mt-4 hidden gap-4 md:grid md:grid-cols-3">
                <QuickAction
                  title="灵感速记"
                  description={`${totalDrafts} 条草稿待处理`}
                  icon={FileText}
                  href="/drafts"
                  compact
                />
                <QuickAction
                  title="提示词"
                  description="维护模板与提示词"
                  icon={Sparkles}
                  href="/tools/prompts"
                  compact
                />
                <QuickAction
                  title="AI 助手"
                  description="对话与整理思路"
                  icon={Bot}
                  href="/tools/ai-assistant"
                  compact
                />
              </div>
            </section>

            <section className="rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-5">
              <div className="space-y-1.5">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  创作动态
                </h3>
              </div>

              <div className="mt-3 grid gap-2 md:hidden">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[1rem] border border-border/70 bg-muted/20 px-3 py-2 text-sm font-semibold text-primary">
                    日历
                  </div>
                  <div className="rounded-[1rem] border border-border/70 bg-muted/20 px-3 py-2 text-sm font-semibold text-primary">
                    活动流
                  </div>
                </div>
              </div>

               <div className="mt-4 hidden gap-4 md:grid md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <div className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,251,0.9))] p-4 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_26px_46px_-34px_rgba(15,23,42,0.42)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-primary/65">
                        节奏面板
                      </div>
                      <h4 className="text-sm font-semibold text-foreground sm:text-base">写作日历</h4>
                      <p className="text-sm leading-6 text-muted-foreground">
                        后续展示每日创作记录、断更提醒与阶段目标，作为稳定创作节奏的辅助视图。
                      </p>
                    </div>
                    <div className="rounded-full border border-border/70 bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      待接入
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,251,0.9))] p-4 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_26px_46px_-34px_rgba(15,23,42,0.42)]">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium tracking-wide text-primary/65">
                        事件流
                      </div>
                      <h4 className="text-sm font-semibold text-foreground sm:text-base">最近活动</h4>
                      <p className="text-sm leading-6 text-muted-foreground">
                        后续展示章节推进、草稿更新与创作提醒，作为工作区之外的弱上下文板块。
                      </p>
                    </div>
                    <div className="space-y-2 rounded-[0.95rem] border border-border/70 bg-white p-3">
                      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span>最近一次草稿整理</span>
                        <span>待接入</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                        <span>章节推进提醒</span>
                        <span>待接入</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          <section className="space-y-3.5 xl:hidden">
            <div className="rounded-[1.375rem] border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold tracking-tight text-foreground">最近编辑</h3>
              </div>

              <div className="mt-3.5 rounded-[1.125rem] border border-primary/10 bg-primary/[0.035] p-3.5">
                <p className="text-sm font-semibold text-primary">状态</p>
                <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {totalDrafts} 条草稿待处理
                </p>
              </div>

              <div className="mt-3.5 space-y-2.5">
                {recentWorks.length > 0 ? (
                  recentWorks.map((work, index) => (
                    <RecentWorkCard key={work.id} work={work} index={index} />
                  ))
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/50 text-center">
                    <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">暂无最近编辑的作品</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/works/new">去创建</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>
          </div>

           <aside className="hidden space-y-4 rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm xl:block">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">最近编辑</h2>
            </div>

            <div className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(160deg,rgba(240,253,250,0.94),rgba(239,246,255,0.82)_58%,rgba(255,255,255,0.92))] p-4 shadow-[0_20px_38px_-30px_rgba(20,184,166,0.32)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">状态</p>
                  <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                    {totalDrafts} 条草稿待处理，适合优先回到最近作品继续推进。
                  </p>
                </div>
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
                  草稿箱
                </span>
              </div>
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                <span>最近更新作品</span>
                <span>{recentWorks.length} 项</span>
              </div>
              <div className="space-y-2">
                {recentWorks.length > 0 ? (
                  recentWorks.map((work, index) => (
                    <RecentWorkCard key={work.id} work={work} index={index} />
                  ))
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/50 text-center">
                    <BookOpen className="mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      暂无最近编辑的作品
                    </p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/works/new">去创建</Link>
                    </Button>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

    </div>
  );
}
