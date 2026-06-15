"use client";

import React from "react";
import { CheckCircle2, CircleHelp, MinusCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import type { CandidateMatchStatus } from "@/features/chapters/lib/extractTypes";

interface ExtractStatusBadgeProps {
  status: CandidateMatchStatus;
  className?: string;
  showLabel?: boolean;
}

const STATUS_MAP: Record<
  CandidateMatchStatus,
  { label: string; tone: string; icon: React.ComponentType<{ className?: string }> }
> = {
  matched: {
    label: "已命中",
    tone: "bg-[var(--primary-50)] text-[var(--primary-700)] border-[var(--primary-200)]",
    icon: CheckCircle2,
  },
  suspect: {
    label: "疑似",
    tone: "bg-[var(--accent-50)] text-[var(--accent-700)] border-[var(--accent-200)]",
    icon: CircleHelp,
  },
  unmatched: {
    label: "未命中",
    tone: "bg-muted/60 text-muted-foreground border-[var(--border-default)]",
    icon: MinusCircle,
  },
};

export function ExtractStatusBadge({
  status,
  className,
  showLabel = true,
}: ExtractStatusBadgeProps): React.ReactElement {
  const entry = STATUS_MAP[status];
  const Icon = entry.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        entry.tone,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {showLabel ? <span>{entry.label}</span> : null}
    </span>
  );
}

export function ExtractConfidenceBadge({
  confidence,
  className,
}: {
  confidence?: number;
  className?: string;
}): React.ReactElement | null {
  if (typeof confidence !== "number") {
    return null;
  }
  const rounded = Math.round(confidence);
  const tone =
    rounded >= 80
      ? "text-[var(--primary-600)]"
      : rounded >= 50
        ? "text-[var(--accent-600)]"
        : "text-muted-foreground";
  return (
    <span className={cn("font-semibold tabular-nums", tone, className)}>{rounded}%</span>
  );
}
