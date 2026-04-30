"use client";

import React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  ExtractCandidateList,
  ExtractKindTabs,
  ExtractWorkflowStatus,
} from "../shared";
import type { useExtractWorkflow } from "@/features/chapters/hooks/useExtractWorkflow";
import type { ExtractCandidate } from "@/features/chapters/lib/extractTypes";

type WorkflowApi = ReturnType<typeof useExtractWorkflow>;

interface ExtractAssistantPanelProps {
  workflow: WorkflowApi;
  workId?: number;
  onTrigger: () => void;
  onConfirmAll?: () => void;
  onIgnoreAll?: () => void;
  onCandidateDetail?: (candidate: ExtractCandidate) => void;
  className?: string;
}

/**
 * 智能提取「工作台抽屉内容」。
 * 不含 hero / reader，仅 tabs + 触发 + 状态 + 候选列表。
 * 由 AssistantDock 等容器注入。
 */
export function ExtractAssistantPanel({
  workflow,
  workId,
  onTrigger,
  onConfirmAll,
  onIgnoreAll,
  onCandidateDetail,
  className,
}: ExtractAssistantPanelProps): React.ReactElement {
  const hasResults = workflow.status === "success";
  return (
    <div className={cn("flex h-full flex-col gap-3 overflow-hidden p-4", className)}>
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
          className="rounded-full bg-primary px-3 text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="mr-1 h-3.5 w-3.5" />
          {workflow.status === "loading" ? "提取中" : hasResults ? "重新提取" : "智能提取"}
        </Button>
      </div>

      {hasResults ? (
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
      ) : (
        <ExtractWorkflowStatus
          status={workflow.status}
          errorMessage={workflow.errorMessage}
          onRetry={workflow.retry}
        />
      )}
    </div>
  );
}
