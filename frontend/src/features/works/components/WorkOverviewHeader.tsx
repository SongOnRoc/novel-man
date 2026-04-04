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
  return (
    <>
      <section className="hidden rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-sm lg:grid lg:grid-cols-[196px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <WorkCoverPanel title={work.title} />
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">基础信息</p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{work.title}</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {work.description || "当前页面用于在同一作品上下文内管理基础信息、章节、草稿与创作资产。"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <MetaBadge>{statusLabel}</MetaBadge>
              <MetaBadge>作品 ID：{work.id}</MetaBadge>
              <MetaBadge>最近更新：{updatedAtLabel}</MetaBadge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5 text-sm text-muted-foreground">
            <InlineStat label="字数" value={formatWordCount(work.totalWordCount || 0)} />
            <InlineStat label="章节" value={`${work.totalChapterCount || 0}`} />
            <InlineStat label="已绑定草稿" value={`${draftTotal}`} />
            <InlineStat label="更新" value={updatedAtLabel} />
          </div>
          <div className="flex flex-wrap gap-3">
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
  return (
    <div className="rounded-[1.75rem] border border-border/50 bg-gradient-to-br from-primary/10 via-background to-sky-50/40 p-3 shadow-sm">
      <div className="rounded-[1.5rem] border border-border/50 bg-background/90 px-3 py-3">
        <div className="aspect-[3/4] rounded-[1.25rem] border border-dashed border-border/60 bg-background/60 p-4">
          <div className="flex h-full flex-col justify-between">
            <Badge variant="secondary" className="w-fit bg-background/90 text-muted-foreground">
              当前作品
            </Badge>
            <div className="space-y-2">
              <div className="line-clamp-2 text-lg font-semibold tracking-tight">{title || "未命名作品"}</div>
              <p className="text-sm text-muted-foreground">封面与作品识别区</p>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
      : tone === "chapter"
        ? "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100";

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center rounded-2xl border px-4 text-sm font-medium shadow-none",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <Badge variant="outline" className="rounded-full border-border/70 bg-background px-3 py-1 text-xs font-medium text-foreground/80">
      {children}
    </Badge>
  );
}

function InlineStat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
