"use client";

import React from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import {
  EXTRACT_KIND_BADGE_CLASS,
  EXTRACT_KIND_LABEL,
  type ExtractCandidate,
} from "@/features/chapters/lib/extractTypes";

import { ExtractConfidenceBadge, ExtractStatusBadge } from "../shared/ExtractStatusBadge";

interface ExtractDetailDialogProps {
  candidate?: ExtractCandidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workId?: number;
  onIgnore?: (candidate: ExtractCandidate) => void;
}

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

export function ExtractDetailDialog({
  candidate,
  open,
  onOpenChange,
  workId,
  onIgnore,
}: ExtractDetailDialogProps): React.ReactElement {
  if (!candidate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm rounded-2xl" />
      </Dialog>
    );
  }
  const link = detailHref(candidate, workId);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl border-[var(--border-default)]/60 bg-card p-0">
        <div className="rounded-2xl bg-card p-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold",
                    EXTRACT_KIND_BADGE_CLASS[candidate.kind],
                  )}
                >
                  {candidate.name.charAt(0)}
                </span>
                <div>
                  <DialogTitle className="text-base font-semibold text-foreground">{candidate.name}</DialogTitle>
                  <DialogDescription className="text-[11px] text-muted-foreground">
                    {EXTRACT_KIND_LABEL[candidate.kind]}
                    {candidate.subtitle ? ` · ${candidate.subtitle}` : ""}
                  </DialogDescription>
                </div>
              </div>
              <ExtractConfidenceBadge confidence={candidate.match.confidence} className="text-base" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ExtractStatusBadge status={candidate.match.status} />
              {candidate.match.matchInfo ? (
                <span className="text-[11px] text-[var(--primary-700)]">{candidate.match.matchInfo}</span>
              ) : null}
            </div>
          </DialogHeader>

          {candidate.relatedEntities?.length ? (
            <section className="mt-4 space-y-2">
              <h4 className="text-[12px] font-semibold text-muted-foreground">关联实体</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.relatedEntities.map((entity) => (
                  <span
                    key={`${entity.kind}-${entity.name}`}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]",
                      EXTRACT_KIND_BADGE_CLASS[entity.kind],
                    )}
                  >
                    {entity.name}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-4 space-y-2">
            <h4 className="text-[12px] font-semibold text-muted-foreground">提取细节</h4>
            <p className="rounded-xl bg-muted/50 px-3 py-2 text-[13px] leading-6 text-muted-foreground">
              {candidate.description}
            </p>
            {candidate.matchEvidence ? (
              <p className="text-[11px] text-muted-foreground">{candidate.matchEvidence}</p>
            ) : null}
          </section>

          {candidate.identityAnchor && (candidate.identityAnchor.title || candidate.identityAnchor.facets.length) ? (
            <section className="mt-4 space-y-2">
              <h4 className="text-[12px] font-semibold text-muted-foreground">
                {candidate.identityAnchor.title ?? "身份锚点"}
              </h4>
              <dl className="grid grid-cols-1 gap-1 rounded-xl bg-[var(--primary-50)]/60 p-3 text-[12px] text-muted-foreground">
                {candidate.identityAnchor.facets.map((facet) => (
                  <div key={`${facet.label}-${facet.value}`} className="flex gap-1">
                    <dt className="font-medium text-muted-foreground/70">{facet.label}：</dt>
                    <dd className="flex-1">{facet.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <footer className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-muted-foreground"
              onClick={() => {
                onIgnore?.(candidate);
                onOpenChange(false);
              }}
            >
              <EyeOff className="mr-1 h-3.5 w-3.5" />
              忽略
            </Button>
            {link ? (
              <Button
                asChild
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link href={link} onClick={() => onOpenChange(false)}>
                  <Eye className="mr-1 h-3.5 w-3.5" />
                  查看详情
                </Link>
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => onOpenChange(false)}
              >
                <Eye className="mr-1 h-3.5 w-3.5" />
                查看详情
              </Button>
            )}
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
