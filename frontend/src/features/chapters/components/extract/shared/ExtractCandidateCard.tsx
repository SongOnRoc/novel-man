"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  type ExtractCandidate,
} from "@/features/chapters/lib/extractTypes";

import { ExtractConfidenceBadge, ExtractStatusBadge } from "./ExtractStatusBadge";

interface ExtractCandidateCardProps {
  candidate: ExtractCandidate;
  workId?: number;
  onIgnore?: (candidate: ExtractCandidate) => void;
  onViewDetail?: (candidate: ExtractCandidate) => void;
  /** 移动端紧凑模式 */
  compact?: boolean;
  className?: string;
}

const ACCENT_BY_STATUS: Record<ExtractCandidate["match"]["status"], string> = {
  matched: "before:bg-emerald-400",
  suspect: "before:bg-amber-400",
  unmatched: "before:bg-slate-300",
};

function detailHref(candidate: ExtractCandidate, workId?: number): string | undefined {
  if (!workId) {
    return undefined;
  }
  if (candidate.match.status === "matched" && candidate.match.targetId) {
    if (candidate.kind === "characters") {
      return `/works/${workId}/characters/${candidate.match.targetId}`;
    }
    if (candidate.kind === "worldview") {
      return `/works/${workId}/worldview/${candidate.match.targetId}`;
    }
  }
  if (candidate.kind === "characters") {
    return `/works/${workId}/characters`;
  }
  if (candidate.kind === "worldview") {
    return `/works/${workId}/worldview`;
  }
  return undefined;
}

export function ExtractCandidateCard({
  candidate,
  workId,
  onIgnore,
  onViewDetail,
  compact = false,
  className,
}: ExtractCandidateCardProps): React.ReactElement {
  const accent = ACCENT_BY_STATUS[candidate.match.status];
  const link = detailHref(candidate, workId);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onViewDetail?.(candidate)}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition-colors hover:border-emerald-300",
          className,
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{candidate.name}</span>
            <ExtractStatusBadge status={candidate.match.status} showLabel={false} />
          </div>
          {candidate.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{candidate.subtitle}</p>
          ) : null}
        </div>
        <ExtractConfidenceBadge confidence={candidate.match.confidence} className="text-sm" />
      </button>
    );
  }

  const cardBody = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{candidate.name}</h3>
            <ExtractStatusBadge status={candidate.match.status} showLabel={false} />
          </div>
          {candidate.subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{candidate.subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <ExtractConfidenceBadge confidence={candidate.match.confidence} className="text-xs" />
          {onIgnore ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onIgnore(candidate);
              }}
              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              aria-label="忽略候选"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">{candidate.description}</p>
      {candidate.match.matchInfo ? (
        <p className="mt-1 truncate text-[11px] font-medium text-emerald-700">{candidate.match.matchInfo}</p>
      ) : null}
    </>
  );

  const baseCls = cn(
    "relative flex w-full flex-col rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left transition-all",
    "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r-full",
    accent,
    "hover:border-emerald-300 hover:shadow-sm",
    className,
  );

  if (link) {
    return (
      <Link
        href={link}
        onClick={() => onViewDetail?.(candidate)}
        className={cn(baseCls, "pl-4 group")}
      >
        {cardBody}
        <ArrowUpRight className="absolute right-3 bottom-2.5 h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-emerald-600" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onViewDetail?.(candidate)}
      className={cn(baseCls, "pl-4")}
    >
      {cardBody}
    </button>
  );
}
