"use client";

import React, { useState } from "react";
import { Settings2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { ExtractCandidate } from "@/features/chapters/lib/extractTypes";

import {
  ExtractCandidateList,
  ExtractKindTabs,
  ExtractReader,
  ExtractWorkflowStatus,
} from "../shared";
import type { useExtractWorkflow } from "@/features/chapters/hooks/useExtractWorkflow";

import { ExtractDetailDialog } from "./ExtractDetailDialog";

type WorkflowApi = ReturnType<typeof useExtractWorkflow>;

interface ExtractMobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterTitle: string;
  paragraphs: string[];
  workflow: WorkflowApi;
  workId?: number;
  onTrigger: () => void;
  onConfirmAll?: () => void;
  onIgnoreAll?: () => void;
}

export function ExtractMobileSheet({
  open,
  onOpenChange,
  chapterTitle,
  paragraphs,
  workflow,
  workId,
  onTrigger,
  onConfirmAll,
  onIgnoreAll,
}: ExtractMobileSheetProps): React.ReactElement {
  const [detailCandidate, setDetailCandidate] = useState<ExtractCandidate | undefined>();
  const detailOpen = Boolean(detailCandidate);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92vh] rounded-t-3xl bg-slate-50 p-0"
        >
          <div className="flex h-full flex-col">
            <SheetHeader className="space-y-1 border-b border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-base font-semibold">
                  {chapterTitle} · 智能提取
                </SheetTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label="设置"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
              <SheetDescription className="text-[12px] text-muted-foreground">
                角色 · 世界观 · 纲要 三类候选默认一次提取生成。
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-3">
              <ExtractReader
                paragraphs={paragraphs}
                terms={workflow.terms}
                className="bg-white"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <ExtractKindTabs
                  value={workflow.activeKind}
                  onChange={workflow.setActiveKind}
                  counts={workflow.candidates}
                  size="sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={onTrigger}
                  disabled={workflow.status === "loading"}
                  className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  {workflow.status === "loading" ? "提取中" : "提取"}
                </Button>
              </div>

              <ExtractWorkflowStatus
                status={workflow.status}
                errorMessage={workflow.errorMessage}
                onRetry={workflow.retry}
                onTrigger={onTrigger}
              />

              {workflow.status === "success" ? (
                <ExtractCandidateList
                  candidates={workflow.visibleCandidates}
                  kind={workflow.activeKind}
                  pendingCount={workflow.pendingCount}
                  workId={workId}
                  compact
                  onIgnore={(candidate) => workflow.ignoreCandidate(candidate.id)}
                  onViewDetail={(candidate) => setDetailCandidate(candidate)}
                />
              ) : null}
            </div>

            <footer
              className={cn(
                "flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                onClick={onIgnoreAll}
                className="rounded-full text-muted-foreground"
              >
                全部忽略
              </Button>
              <div className="text-[12px] text-muted-foreground">{workflow.pendingCount} 个待处理</div>
              <Button
                type="button"
                onClick={onConfirmAll}
                className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                全部确认
              </Button>
            </footer>
          </div>
        </SheetContent>
      </Sheet>

      <ExtractDetailDialog
        candidate={detailCandidate}
        open={detailOpen}
        onOpenChange={(next) => {
          if (!next) {
            setDetailCandidate(undefined);
          }
        }}
        workId={workId}
        onIgnore={(candidate) => workflow.ignoreCandidate(candidate.id)}
      />
    </>
  );
}
