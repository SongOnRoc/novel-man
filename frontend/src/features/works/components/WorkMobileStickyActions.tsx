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
          "rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-none hover:bg-emerald-100",
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
              "rounded-full border border-border/70 bg-muted/20 text-foreground shadow-none hover:bg-muted/40",
              compact ? "h-5 px-3 text-[10px]" : "h-6 px-3 text-[11px]"
            )}
          >
            更多
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="rounded-t-[28px] border-x-0 border-b-0 px-0 pb-4 pt-2 [&>button]:hidden"
        >
          <div className="mx-auto h-1.5 w-20 rounded-full bg-border/80" />
          <div className="px-4 pt-2">
            <div className="flex items-center justify-end">
              <SheetTitle className="sr-only">更多操作</SheetTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="关闭更多操作"
                className="h-7 w-7 rounded-full text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <SheetDescription className="sr-only">更多作品操作</SheetDescription>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <ActionCard
                href={`/works/${workId}/chapters`}
                icon={<BookOpen className="h-4 w-4 text-indigo-600" />}
                iconClassName="bg-indigo-50"
                label="新建章节"
              />
              <ActionCard
                href={`/works/${workId}/edit`}
                icon={<Edit className="h-4 w-4 text-amber-600" />}
                iconClassName="bg-amber-50"
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
  icon,
  iconClassName,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  iconClassName: string;
  label: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm shadow-black/5 transition-colors hover:bg-slate-50"
    >
      <span className={cn("flex h-6 w-6 items-center justify-center rounded-lg", iconClassName)}>{icon}</span>
      <span className="text-sm font-semibold text-foreground">{label}</span>
    </Link>
  );
}
