"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

import {
  EXTRACT_KIND_LABEL,
  EXTRACT_KIND_TOKEN_CLASS,
  type ExtractKind,
  type ExtractedTerm,
} from "@/features/chapters/lib/extractTypes";

interface ExtractReaderProps {
  paragraphs: string[];
  terms: ExtractedTerm[];
  highlightEnabled?: boolean;
  className?: string;
  /** 内层滚动区最大高度；不传则不限制（适合 dock 主区 ChapterReader 使用） */
  maxHeight?: string;
  onTermClick?: (term: ExtractedTerm) => void;
}

interface TermInfo {
  text: string;
  kind: ExtractKind;
  candidateId?: string;
}

function buildSegments(paragraph: string, terms: TermInfo[]): Array<{ text: string; term?: TermInfo }> {
  if (!terms.length) {
    return [{ text: paragraph }];
  }
  const sorted = [...terms].sort((a, b) => b.text.length - a.text.length);
  const segments: Array<{ text: string; term?: TermInfo }> = [{ text: paragraph }];

  for (const term of sorted) {
    if (!term.text) {
      continue;
    }
    const next: typeof segments = [];
    for (const segment of segments) {
      if (segment.term) {
        next.push(segment);
        continue;
      }
      const parts = segment.text.split(term.text);
      if (parts.length === 1) {
        next.push(segment);
        continue;
      }
      parts.forEach((part, index) => {
        if (part) {
          next.push({ text: part });
        }
        if (index < parts.length - 1) {
          next.push({ text: term.text, term });
        }
      });
    }
    segments.splice(0, segments.length, ...next);
  }
  return segments;
}

export function ExtractReader({
  paragraphs,
  terms,
  highlightEnabled = true,
  className,
  maxHeight,
  onTermClick,
}: ExtractReaderProps): React.ReactElement {
  const effectiveTerms = useMemo<TermInfo[]>(() => {
    if (!highlightEnabled) {
      return [];
    }
    const seen = new Set<string>();
    const list: TermInfo[] = [];
    for (const term of terms) {
      const key = `${term.kind}:${term.text}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      list.push({ text: term.text, kind: term.kind, candidateId: term.candidateId });
    }
    return list;
  }, [terms, highlightEnabled]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className="space-y-5 text-[18px] leading-[1.85] text-foreground"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        {paragraphs.length ? (
          paragraphs.map((paragraph, index) => {
            const segments = buildSegments(paragraph, effectiveTerms);
            return (
              <p
                key={`p-${index}-${paragraph.slice(0, 6)}`}
                className="whitespace-pre-wrap indent-[2em]"
              >
                {segments.map((segment, segmentIndex) => {
                  if (!segment.term) {
                    return <span key={`s-${segmentIndex}`}>{segment.text}</span>;
                  }
                  const cls = EXTRACT_KIND_TOKEN_CLASS[segment.term.kind];
                  const label = EXTRACT_KIND_LABEL[segment.term.kind];
                  return (
                    <button
                      key={`t-${segmentIndex}-${segment.term.text}`}
                      type="button"
                      title={`${label}：${segment.term.text}`}
                      onClick={() =>
                        onTermClick?.({
                          kind: segment.term!.kind,
                          text: segment.term!.text,
                          candidateId: segment.term!.candidateId,
                        })
                      }
                      className={cn(
                        "rounded px-1 transition-colors hover:opacity-80",
                        cls,
                      )}
                    >
                      {segment.text}
                    </button>
                  );
                })}
              </p>
            );
          })
        ) : (
          <p className="text-sm text-[var(--text-tertiary)]">本章节没有内容。</p>
        )}
      </div>
    </div>
  );
}
