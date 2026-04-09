"use client";

import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { cn, formatWordCount } from "@/lib/utils";

import { WorkMobileActions } from "./WorkMobileStickyActions";

interface WorkOverviewHeaderProps {
  work: {
    id?: number;
    title?: string | null;
    description?: string | null;
    status?: string | null;
    totalWordCount?: number | null;
    totalChapterCount?: number | null;
  };
  draftTotal: number;
  updatedAtLabel: string;
  statusLabel: string;
  isCollapsed: boolean;
  mobileMoreOpen: boolean;
  onMobileMoreOpenChange: (open: boolean) => void;
}

export function WorkOverviewHeader({
  work,
  draftTotal,
  updatedAtLabel,
  statusLabel,
  isCollapsed,
  mobileMoreOpen,
  onMobileMoreOpenChange,
}: WorkOverviewHeaderProps): React.ReactElement {
  const title = work.title || "未命名作品";
  const description =
    work.description || "当前页面用于在同一作品上下文内管理基础信息、章节、草稿与创作资产。";

  return (
    <>
      <section className="hidden lg:block">
        <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,255,255,0.92)_58%,rgba(240,253,250,0.92))] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
          <div className="pointer-events-none absolute -left-10 top-6 h-36 w-36 rounded-full bg-primary/12 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-[32rem] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.13),transparent_38%),radial-gradient(circle_at_40%_60%,rgba(20,184,166,0.08),transparent_32%)]" />
          <div className="relative grid grid-cols-[214px_minmax(0,1fr)] gap-8 p-7 xl:items-start">
            <WorkCoverPanel title={title} />
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                <div className="space-y-3">
                  <div className="inline-flex w-fit items-center rounded-full border border-primary/10 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-primary/90">
                    基础信息
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground xl:text-[2.75rem]">{title}</h1>
                    <p className="max-w-3xl text-sm leading-7 text-muted-foreground xl:text-[15px]">
                      {description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-start gap-2 xl:max-w-[22rem] xl:justify-end">
                  <MetaBadge>{statusLabel}</MetaBadge>
                  <MetaBadge>作品 ID：{work.id}</MetaBadge>
                  <MetaBadge>最近更新：{updatedAtLabel}</MetaBadge>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InlineStat label="字数" value={formatWordCount(work.totalWordCount || 0)} />
                <InlineStat label="章节" value={`${work.totalChapterCount || 0}`} />
                <InlineStat label="已绑定草稿" value={`${draftTotal}`} />
                <InlineStat label="最近更新" value={updatedAtLabel} />
              </div>
              <div className="flex flex-wrap gap-3 pt-1">
                <DesktopAction href={`/works/${work.id}/drafts/new`} tone="draft">
                  新建草稿
                </DesktopAction>
                <DesktopAction href={`/works/${work.id}/chapters`} tone="chapter">
                  新建章节
                </DesktopAction>
                <DesktopAction href={`/works/${work.id}/edit`} tone="edit">
                  编辑作品
                </DesktopAction>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-border/50 bg-card/95 p-3 shadow-sm lg:hidden">
        {!isCollapsed ? (
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 rounded-[1.35rem] border border-border/60 bg-background/90 p-4">
            <div className="rounded-[1rem] border border-border/60 bg-muted/20" />
            <div className="min-w-0 space-y-2">
              <h1 className="text-[22px] font-bold leading-none tracking-tight text-foreground">{work.title}</h1>
              <p className="text-[11px] text-muted-foreground">连载中 · ID: {work.id} · 更新: {updatedAtLabel}</p>
              <p className="text-[11px] font-semibold text-foreground">字数 {work.totalWordCount || 0}   章节 {work.totalChapterCount || 0}   已发布 0</p>
              <WorkMobileActions
                workId={work.id!}
                open={mobileMoreOpen}
                onOpenChange={onMobileMoreOpenChange}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-border/60 bg-background/90 px-4 py-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-base font-bold leading-none tracking-tight text-foreground">{work.title}</h1>
              <p className="truncate text-[10px] text-muted-foreground">{statusLabel} · 更新: {updatedAtLabel}</p>
            </div>
            <WorkMobileActions
              compact
              workId={work.id!}
              open={mobileMoreOpen}
              onOpenChange={onMobileMoreOpenChange}
            />
          </div>
        )}
      </section>
    </>
  );
}

function WorkCoverPanel({ title }: { title?: string | null }): React.ReactElement {
  const displayTitle = title || "未命名作品";
  const monogram = displayTitle.trim().charAt(0) || "书";

  return (
    <div className="relative overflow-hidden rounded-[1.85rem] border border-primary/10 bg-[linear-gradient(160deg,rgba(240,253,250,0.95),rgba(239,246,255,0.88)_52%,rgba(255,255,255,0.95))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_36px_-28px_rgba(15,23,42,0.45)]">
      <div className="pointer-events-none absolute inset-x-5 top-4 h-16 rounded-full bg-white/70 blur-2xl" />
      <div className="relative rounded-[1.55rem] border border-white/80 bg-white/88 p-4 shadow-inner">
        <div className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[1.35rem] border border-dashed border-primary/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,252,0.9))] p-4">
          <div className="pointer-events-none absolute -right-2 top-3 text-7xl font-black tracking-tight text-primary/10">
            {monogram}
          </div>
          <Badge
            variant="secondary"
            className="w-fit rounded-full border border-white/70 bg-background/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground shadow-none hover:bg-background/90"
          >
            当前作品
          </Badge>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="line-clamp-2 text-[1.45rem] font-semibold tracking-tight text-foreground">
                {displayTitle}
              </div>
              <p className="text-sm leading-6 text-muted-foreground">封面与作品识别区</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-px flex-1 bg-border/70" />
              <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground/80">
                Novel Man
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopAction({
  href,
  children,
  tone,
}: {
  href: string;
  children: React.ReactNode;
  tone: "draft" | "chapter" | "edit";
}): React.ReactElement {
  const className =
    tone === "draft"
      ? "border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/90"
      : tone === "chapter"
        ? "border-indigo-200/80 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100/90"
        : "border-amber-200/80 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100/90";

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 cursor-pointer items-center rounded-2xl border px-5 text-sm font-semibold shadow-[0_12px_24px_-18px_rgba(15,23,42,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-22px_rgba(15,23,42,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Badge
      variant="outline"
      className="rounded-full border-white/80 bg-white/86 px-3.5 py-1.5 text-xs font-semibold text-foreground/85 shadow-[0_12px_24px_-22px_rgba(15,23,42,0.3)] backdrop-blur-sm"
    >
      {children}
    </Badge>
  );
}

function InlineStat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/82 px-4 py-3 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.4)] backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{label}</div>
      <div className="mt-2 text-base font-semibold tracking-tight text-foreground">{value}</div>
    </div>
  );
}
