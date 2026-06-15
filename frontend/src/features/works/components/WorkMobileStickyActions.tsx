"use client";

import { BookOpen, Edit, Plus, Upload, X } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface WorkMobileActionsProps {
  compact?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workId: number;
  onImportClick?: () => void;
}

export function WorkMobileActions({
  compact = false,
  open,
  onOpenChange,
  workId,
  onImportClick,
}: WorkMobileActionsProps): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-2", compact ? "justify-end" : "justify-start")}>
      <Button
        asChild
        variant="outline"
        className={cn(
          "rounded-full border-[var(--primary-200)]/60 bg-[var(--primary-50)] text-[var(--primary-700)] shadow-none hover:bg-[var(--primary-100)]/80",
          compact ? "h-6 px-3 text-[11px]" : "h-7 px-3 text-xs"
        )}
      >
        <Link href={`/works/${workId}/drafts/new`}>
          <Plus className={cn(compact ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1.5")} />
          新建草稿
        </Link>
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            aria-label="更多操作"
            className={cn(
              "rounded-full border-[var(--border-default)]/60 bg-muted/40 text-foreground shadow-none hover:bg-muted/60",
              compact ? "h-5 px-3 text-[10px]" : "h-6 px-3 text-[11px]"
            )}
          >
            更多
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-x-0 border-b-0 border-t border-[var(--border-default)]/60 bg-card/98 backdrop-blur-xl px-0 pb-safe pt-3 shadow-[0_-4px_16px_-4px_rgba(0,0,0,0.1)] [&>button]:hidden"
        >
          {/* 把手 */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

          <div className="px-5">
            <SheetTitle className="sr-only">操作菜单</SheetTitle>
            <SheetDescription className="sr-only">选择要执行的操作</SheetDescription>

            {/* 关闭按钮 */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="关闭"
              className="absolute right-4 top-3 h-8 w-8 rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* 操作卡片网格 */}
            <div className="grid grid-cols-2 gap-3 pb-3">
              <ActionCard
                href={`/works/${workId}/chapters`}
                icon={BookOpen}
                tone="primary"
                label="章节管理"
              />
              <ActionCard
                href={`/works/${workId}/edit`}
                icon={Edit}
                tone="accent"
                label="编辑作品"
              />
              {onImportClick && (
                <ActionButton
                  onClick={() => {
                    onImportClick();
                    onOpenChange(false);
                  }}
                  icon={Upload}
                  tone="accent"
                  label="导入文件"
                />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ActionCard({
  href,
  icon: Icon,
  tone,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "accent";
  label: string;
}): React.ReactElement {
  const iconBg = tone === "primary" ? "bg-[var(--primary-100)]" : "bg-[var(--accent-100)]";
  const iconColor = tone === "primary" ? "text-[var(--primary-700)]" : "text-[var(--accent-700)]";

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-[var(--border-default)]/60 bg-card px-4 py-3.5 transition-all active:scale-[0.97]"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg, iconColor)}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  tone,
  label,
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "accent";
  label: string;
}): React.ReactElement {
  const iconBg = tone === "primary" ? "bg-[var(--primary-100)]" : "bg-[var(--accent-100)]";
  const iconColor = tone === "primary" ? "text-[var(--primary-700)]" : "text-[var(--accent-700)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-[var(--border-default)]/60 bg-card px-4 py-3.5 transition-all active:scale-[0.97]"
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconBg, iconColor)}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </button>
  );
}
