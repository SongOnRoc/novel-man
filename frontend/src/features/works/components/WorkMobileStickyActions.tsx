"use client";

import { BookOpen, Edit, Plus, X } from "lucide-react";
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
}

export function WorkMobileActions({
  compact = false,
  open,
  onOpenChange,
  workId,
}: WorkMobileActionsProps): React.ReactElement {
  return (
    <div className={cn("flex items-center gap-2", compact ? "justify-end" : "justify-start")}>
      <Button
        asChild
        variant="ghost"
        className={cn(
          "rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] text-[var(--primary-700)] shadow-none hover:bg-[var(--primary-100)]/80",
          compact ? "h-6 px-3 text-[11px]" : "h-7 px-3 text-xs"
        )}
      >
        <Link href={`/works/${workId}/drafts/new`}>
          <Plus className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
          新建草稿
        </Link>
      </Button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            aria-label="更多操作"
            className={cn(
              "rounded-full border border-[var(--border-default)]/60 bg-muted/40 text-foreground shadow-none hover:bg-muted/60",
              compact ? "h-5 px-3 text-[10px]" : "h-6 px-3 text-[11px]"
            )}
          >
            更多
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-x-0 border-b-0 px-0 pb-4 pt-2 [&>button]:hidden"
        >
          <div className="mx-auto h-1.5 w-16 rounded-full bg-muted-foreground/30" />
          <div className="px-4 pt-2">
            <div className="flex items-center justify-end">
              <SheetTitle className="sr-only">更多操作</SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="关闭更多操作"
                className="h-7 w-7 rounded-full text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <SheetDescription className="sr-only">更多作品操作</SheetDescription>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <ActionCard
                href={`/works/${workId}/chapters`}
                icon={BookOpen}
                tone="primary"
                label="新建章节"
              />
              <ActionCard
                href={`/works/${workId}/edit`}
                icon={Edit}
                tone="accent"
                label="编辑作品"
              />
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
  const iconClass =
    tone === "primary"
      ? "bg-primary/10 text-[var(--primary-600)]"
      : "bg-[var(--accent-100)]/80 text-[var(--accent-600)]";
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-[var(--border-default)]/60 bg-card px-4 py-3.5 transition-all hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/40 hover:shadow-sm"
    >
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
