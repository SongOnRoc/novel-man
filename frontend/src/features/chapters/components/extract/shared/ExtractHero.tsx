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
        "relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 px-5 py-4 shadow-sm",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-16 -left-12 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -top-8 right-0 h-32 w-32 rounded-full bg-sky-200/30 blur-3xl" aria-hidden />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-emerald-700 transition-colors hover:bg-white"
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
              className="rounded-full bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-700"
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
