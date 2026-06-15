"use client";

import React from "react";
import { ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { EXTRACT_KIND_LABEL, type ExtractCandidate, type ExtractKind } from "@/features/chapters/lib/extractTypes";

import { ExtractCandidateCard } from "./ExtractCandidateCard";

interface ExtractCandidateListProps {
  candidates: ExtractCandidate[];
  kind: ExtractKind;
  pendingCount: number;
  workId?: number;
  onIgnore?: (candidate: ExtractCandidate) => void;
  onViewDetail?: (candidate: ExtractCandidate) => void;
  onConfirmAll?: () => void;
  onIgnoreAll?: () => void;
  /** 移动端使用 compact 卡片堆，桌面端使用富卡片。 */
  compact?: boolean;
  className?: string;
}

export function ExtractCandidateList({
  candidates,
  kind,
  pendingCount,
  workId,
  onIgnore,
  onViewDetail,
  onConfirmAll,
  onIgnoreAll,
  compact = false,
  className,
}: ExtractCandidateListProps): React.ReactElement {
  if (!candidates.length) {
    return (
      <div
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-default)]/60 bg-muted/40 py-10 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        <ScrollText className="h-5 w-5 text-muted-foreground/40" />
        <p>暂无 {EXTRACT_KIND_LABEL[kind]} 候选</p>
      </div>
    );
  }
  return (
    <div className={cn("flex flex-1 flex-col gap-3", className)}>
      <div className={cn("flex-1 space-y-3 overflow-y-auto pr-1", compact && "space-y-2")}>
        {candidates.map((candidate) => (
          <ExtractCandidateCard
            key={candidate.id}
            candidate={candidate}
            workId={workId}
            onIgnore={onIgnore}
            onViewDetail={onViewDetail}
            compact={compact}
          />
        ))}
      </div>
      {(onConfirmAll || onIgnoreAll) ? (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
          <span className="text-[12px] text-muted-foreground">
            共 {candidates.length} 条 · {pendingCount} 待处理
          </span>
          <div className="flex items-center gap-1">
            {onIgnoreAll ? (
              <Button type="button" size="sm" variant="ghost" onClick={onIgnoreAll} className="h-7 rounded-full text-muted-foreground">
                全部忽略
              </Button>
            ) : null}
            {onConfirmAll ? (
              <Button
                type="button"
                size="sm"
                onClick={onConfirmAll}
                className="h-7 rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90"
              >
                全部确认
              </Button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
