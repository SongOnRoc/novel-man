"use client";

import React from "react";
import { ScrollText } from "lucide-react";

import {
  ExtractCandidateList,
  ExtractHero,
  ExtractKindTabs,
  ExtractReader,
  ExtractWorkflowStatus,
} from "../shared";
import type { useExtractWorkflow } from "@/features/chapters/hooks/useExtractWorkflow";
import type { ExtractCandidate } from "@/features/chapters/lib/extractTypes";

type WorkflowApi = ReturnType<typeof useExtractWorkflow>;

interface ExtractDesktopPanelProps {
  chapterTitle: string;
  paragraphs: string[];
  workflow: WorkflowApi;
  workId?: number;
  backHref?: string;
  /** Hero 右上自定义操作（编辑 / 选择片段 / 导出 等）。"智能提取"按钮由组件内置。 */
  heroActions?: React.ReactNode;
  onTrigger: () => void;
  onConfirmAll?: () => void;
  onIgnoreAll?: () => void;
  onCandidateDetail?: (candidate: ExtractCandidate) => void;
}

export function ExtractDesktopPanel({
  chapterTitle,
  paragraphs,
  workflow,
  workId,
  backHref,
  heroActions,
  onTrigger,
  onConfirmAll,
  onIgnoreAll,
  onCandidateDetail,
}: ExtractDesktopPanelProps): React.ReactElement {
  const hasResults = workflow.status === "success";
  return (
    <section aria-label="智能提取桌面端" className="space-y-4">
      <ExtractHero
        chapterTitle={chapterTitle}
        backHref={backHref}
        actions={heroActions}
        onTrigger={onTrigger}
        loading={workflow.status === "loading"}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.32fr)_minmax(0,1fr)]">
        <ExtractReader paragraphs={paragraphs} terms={workflow.terms} />

        <aside className="flex flex-col gap-3 rounded-2xl border border-[var(--border-default)]/60 bg-card p-4">
          {hasResults ? (
            <>
              <ExtractKindTabs
                value={workflow.activeKind}
                onChange={workflow.setActiveKind}
                counts={workflow.candidates}
              />
              <ExtractCandidateList
                candidates={workflow.visibleCandidates}
                kind={workflow.activeKind}
                pendingCount={workflow.pendingCount}
                workId={workId}
                onIgnore={(candidate) => workflow.ignoreCandidate(candidate.id)}
                onViewDetail={onCandidateDetail}
                onConfirmAll={onConfirmAll}
                onIgnoreAll={onIgnoreAll}
              />
            </>
          ) : (
            <>
              <ExtractWorkflowStatus
                status={workflow.status}
                errorMessage={workflow.errorMessage}
                onRetry={workflow.retry}
              />
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-default)]/60 bg-muted/40 py-10 text-center text-sm text-muted-foreground">
                <ScrollText className="h-6 w-6 text-muted-foreground/40" />
                <p>暂无候选结果</p>
                <p className="text-xs text-muted-foreground/60">触发智能提取后将自动归类显示</p>
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
