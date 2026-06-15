"use client";

import React from "react";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ExtractStatus } from "@/features/chapters/lib/extractTypes";

interface ExtractWorkflowStatusProps {
  status: ExtractStatus;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export function ExtractWorkflowStatus({
  status,
  errorMessage,
  onRetry,
  className,
}: ExtractWorkflowStatusProps): React.ReactElement | null {
  if (status === "loading") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl bg-[var(--primary-50)]/60 px-3 py-2.5 text-sm text-[var(--primary-700)]",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>智能提取中…</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive",
          className,
        )}
      >
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div className="flex-1 space-y-1">
          <p>{errorMessage ?? "提取失败"}</p>
          {onRetry ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onRetry}
              className="h-7 rounded-full px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              重试
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
  if (status === "idle") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-dashed border-[var(--primary-200)] bg-[var(--primary-50)]/30 px-3 py-2.5 text-sm text-[var(--primary-700)]",
          className,
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>点击右上&quot;智能提取&quot;，自动识别角色 / 世界观 / 纲要</span>
      </div>
    );
  }
  return null;
}
