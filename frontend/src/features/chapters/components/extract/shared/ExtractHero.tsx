"use client";

import React from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExtractHeroProps {
  chapterTitle: string;
  /** 返回链接 */
  backHref?: string;
  /** 右上额外操作（编辑 / 选择片段 / 导出 等） */
  actions?: React.ReactNode;
  onTrigger?: () => void;
  loading?: boolean;
  className?: string;
}

export function ExtractHero({
  chapterTitle,
  backHref,
  actions,
  onTrigger,
  loading,
  className,
}: ExtractHeroProps): React.ReactElement {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] px-5 py-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-12 -left-10 h-36 w-36 rounded-full bg-[var(--primary-500)]/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card/70 text-[var(--primary-700)] transition-colors hover:bg-card"
              aria-label="返回章节目录"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          ) : null}
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
            {chapterTitle}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onTrigger ? (
            <Button
              type="button"
              onClick={onTrigger}
              disabled={loading}
              size="sm"
              className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {loading ? "提取中..." : "智能提取"}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
