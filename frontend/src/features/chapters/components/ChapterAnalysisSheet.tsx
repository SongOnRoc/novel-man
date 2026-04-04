"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  ChapterAnalysisKind,
  ChapterAnalysisResult,
  ChapterAnalysisStatus,
} from "@/features/chapters/lib/chapterAnalysis";

import { ChapterAnalysisTypeTabs } from "./ChapterAnalysisTypeTabs";

interface ChapterAnalysisSheetProps {
  chapterTitle: string;
  inputLabel?: string;
  result?: ChapterAnalysisResult;
  status?: ChapterAnalysisStatus;
  errorMessage?: string;
  analysisKind?: ChapterAnalysisKind;
  onAnalysisKindChange?: (kind: ChapterAnalysisKind) => void;
  onRetry?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChapterAnalysisSheet({
  chapterTitle,
  inputLabel,
  result,
  status = "idle",
  errorMessage,
  analysisKind = "outline",
  onAnalysisKindChange,
  onRetry,
  open,
  onOpenChange,
}: ChapterAnalysisSheetProps): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh]">
        <SheetHeader>
          <SheetTitle>章节分析</SheetTitle>
          <SheetDescription>当前对象：{inputLabel || chapterTitle}</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <ChapterAnalysisTypeTabs value={analysisKind} onChange={(kind) => onAnalysisKindChange?.(kind)} />
          {status === "loading" ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-background px-4 py-3">
              <p className="font-medium text-foreground">分析中...</p>
              <p>正在整理当前章节内容，请稍候。</p>
            </div>
          ) : status === "error" ? (
            <div className="space-y-3 rounded-xl border border-destructive/20 bg-background px-4 py-3">
              <p className="font-medium text-foreground">{errorMessage || "分析失败，请稍后重试。"}</p>
              <p>本次分析未能完成，你可以直接重试当前分析对象。</p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                重试分析
              </Button>
            </div>
          ) : result ? (
            <>
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {result.kind === "outline" ? "大纲" : "角色"}
                </div>
                <h3 className="text-base font-semibold text-foreground">{result.heading}</h3>
                <p>{result.summary}</p>
              </div>
              <div className="space-y-2">
                {result.items.map((item) => (
                  <div key={item} className="rounded-xl border border-border/50 bg-background px-3 py-2">
                    {item}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>可对整章或已选片段执行大纲、角色分析。</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
