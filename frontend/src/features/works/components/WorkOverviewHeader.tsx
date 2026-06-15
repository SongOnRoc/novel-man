"use client";

import { PencilLine, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import React from "react";

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
  onImportClick?: () => void;
}

export function WorkOverviewHeader({
  work,
  draftTotal,
  updatedAtLabel,
  statusLabel,
  isCollapsed,
  mobileMoreOpen,
  onMobileMoreOpenChange,
  onImportClick,
}: WorkOverviewHeaderProps): React.ReactElement {
  const title = work.title || "未命名作品";
  const description = work.description?.trim() || "";
  const monogram = title.trim().charAt(0) || "书";

  const metaPills: { label: string; value: React.ReactNode }[] = [
    { label: "字数", value: formatWordCount(work.totalWordCount || 0) },
    { label: "章节", value: `${work.totalChapterCount || 0}` },
    { label: "草稿", value: `${draftTotal}` },
  ];

  return (
    <>
      {/* === 桌面端 === */}
      <section className="hidden lg:block">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full bg-[var(--primary-500)]/10 blur-2xl"
          />

          <div className="relative grid grid-cols-[140px_minmax(0,1fr)] gap-6 xl:grid-cols-[160px_minmax(0,1fr)]">
            {/* 左：极简封面（删除多余装饰） */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[var(--primary-200)]/60 bg-[linear-gradient(180deg,var(--primary-50),var(--primary-100)/40)]">
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-6xl font-black tracking-tighter text-[var(--primary-500)]/20 xl:text-7xl">
                {monogram}
              </div>
            </div>

            {/* 右：主信息区 */}
            <div className="flex min-w-0 flex-col justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground xl:text-4xl">
                  {title}
                </h1>
                {/* 元信息一行：状态 · ID · 更新 */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)]" />
                    <span className="font-medium text-[var(--primary-700)]">{statusLabel}</span>
                  </span>
                  <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span>ID {work.id}</span>
                  <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span>{updatedAtLabel}</span>
                </div>
                {description ? (
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
                ) : null}
              </div>

              {/* 紧凑数据带（一行） */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-[var(--border-default)]/60 bg-card/70 backdrop-blur-sm px-4 py-2.5">
                {metaPills.map((pill, idx) => (
                  <React.Fragment key={pill.label}>
                    {idx > 0 && (
                      <span aria-hidden className="hidden h-4 w-px bg-[var(--border-default)] sm:block" />
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                        {pill.label}
                      </span>
                      <span className="text-sm font-bold tracking-tight text-foreground tabular-nums">
                        {pill.value}
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-2">
                <DesktopAction href={`/works/${work.id}/drafts/new`} icon={Sparkles} tone="primary">
                  新建草稿
                </DesktopAction>
                <DesktopAction href={`/works/${work.id}/edit`} icon={PencilLine} tone="ghost">
                  编辑
                </DesktopAction>
                {onImportClick && (
                  <DesktopAction onClick={onImportClick} icon={Upload} tone="ghost">
                    导入文件
                  </DesktopAction>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === 移动端 === */}
      <section
        className={cn(
          "rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] lg:hidden",
          isCollapsed ? "p-3" : "p-4"
        )}
      >
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="grid grid-cols-[60px_minmax(0,1fr)] gap-3">
              <div className="aspect-[3/4] rounded-lg border border-[var(--primary-200)]/60 bg-card flex items-center justify-center text-2xl font-extrabold text-[var(--primary-500)]">
                {monogram}
              </div>
              <div className="min-w-0 space-y-1.5">
                <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">
                  {title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)]" />
                    <span className="font-medium text-[var(--primary-700)]">{statusLabel}</span>
                  </span>
                  <span>· ID {work.id}</span>
                  <span>· {updatedAtLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-card/70 px-3 py-2">
              {metaPills.map((pill) => (
                <div key={pill.label} className="flex items-baseline gap-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {pill.label}
                  </span>
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{pill.value}</span>
                </div>
              ))}
            </div>
            <WorkMobileActions
              workId={work.id!}
              open={mobileMoreOpen}
              onOpenChange={onMobileMoreOpenChange}
              onImportClick={onImportClick}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="text-base font-bold leading-none tracking-tight text-foreground">
                {title}
              </h1>
              <p className="truncate text-[10px] text-muted-foreground">
                {statusLabel} · 更新 {updatedAtLabel}
              </p>
            </div>
            <WorkMobileActions
              compact
              workId={work.id!}
              open={mobileMoreOpen}
              onOpenChange={onMobileMoreOpenChange}
              onImportClick={onImportClick}
            />
          </div>
        )}
      </section>
    </>
  );
}

function DesktopAction({
  href,
  onClick,
  children,
  icon: Icon,
  tone,
}: {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "ghost";
}): React.ReactElement {
  const className =
    tone === "primary"
      ? "h-11 rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
      : "h-11 rounded-full border border-[var(--border-default)]/60 bg-card/80 px-5 text-foreground transition-all duration-300 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30";

  const baseClassName = cn(
    "inline-flex items-center gap-2 text-sm font-semibold",
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClassName}>
        <Icon className="h-4 w-4" />
        {children}
      </button>
    );
  }

  return (
    <Link href={href!} className={baseClassName}>
      <Icon className="h-4 w-4" />
      {children}
    </Link>
  );
}
