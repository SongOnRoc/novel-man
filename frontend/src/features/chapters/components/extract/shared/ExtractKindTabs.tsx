"use client";

import React from "react";
import { cn } from "@/lib/utils";

import {
  EXTRACT_KIND_LABEL,
  EXTRACT_KIND_ORDER,
  type ExtractCandidateMap,
  type ExtractKind,
} from "@/features/chapters/lib/extractTypes";

interface ExtractKindTabsProps {
  value: ExtractKind;
  onChange: (kind: ExtractKind) => void;
  counts?: ExtractCandidateMap;
  className?: string;
  size?: "sm" | "md";
}

export function ExtractKindTabs({
  value,
  onChange,
  counts,
  className,
  size = "md",
}: ExtractKindTabsProps): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="智能提取分类"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-full bg-muted/60 p-1",
        size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
    >
      {EXTRACT_KIND_ORDER.map((kind) => {
        const active = kind === value;
        const count = counts?.[kind]?.length ?? 0;
        return (
          <button
            key={kind}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(kind)}
            className={cn(
              "flex items-center gap-1 rounded-full font-medium transition-colors",
              size === "sm" ? "px-3 py-1" : "px-3.5 py-1.5",
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground",
            )}
          >
            <span>{EXTRACT_KIND_LABEL[kind]}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] leading-4",
                  active ? "bg-white/20 text-white" : "bg-background text-muted-foreground",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
