"use client";

import React, { useEffect, useMemo, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DraftForClient } from "@/lib/services/draft.service";
import {
  normalizeChapterTitle,
  stripChapterNumberPrefix,
} from "@/features/chapters/lib/chapterNumbering";
import {
  getChapterNumberStyleTemplate,
  getEffectiveChapterNumberingConfig,
} from "@/features/chapters/lib/chapterNumberingStorage";
import type { ChapterForClient } from "@/lib/services/chapter.service";

function getNextChapterNo(chapters: ChapterForClient[]): number {
  let maxNo = 0;
  for (const c of chapters) {
    if (typeof c.displayOrder === "number" && Number.isFinite(c.displayOrder)) {
      maxNo = Math.max(maxNo, c.displayOrder);
    }
  }
  return maxNo + 1;
}

export function PublishDraftDialog({
  open,
  onOpenChange,
  draft,
  workId,
  chapters,
  isPending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: DraftForClient;
  workId: number;
  chapters: ChapterForClient[];
  isPending: boolean;
  onConfirm: (args: {
    chapterNo: number;
    inputTitle: string;
    normalizedTitle: string;
    hasConflict: boolean;
    detectedNo: number | null;
  }) => void;
}): React.ReactElement {
  const chapterNo = useMemo(() => getNextChapterNo(chapters), [chapters]);

  const [suffixInput, setSuffixInput] = useState("");
  useEffect(() => {
    if (!open) return;
    // Default: guide user to edit suffix only (strip any leading chapter number prefix).
    setSuffixInput(stripChapterNumberPrefix(draft.title || "").stripped);
  }, [draft.title, open]);

  const cfg = useMemo(() => getEffectiveChapterNumberingConfig(workId), [workId]);
  const template = useMemo(() => getChapterNumberStyleTemplate(cfg), [cfg]);

  const normalizedFromOriginalTitle = useMemo(() => {
    return normalizeChapterTitle({
      chapterNo,
      inputTitle: draft.title || "",
      styleTemplate: template,
      numberFormat: cfg.numberFormat ?? "chinese",
    });
  }, [cfg.numberFormat, chapterNo, draft.title, template]);

  const normalized = useMemo(() => {
    return normalizeChapterTitle({
      chapterNo,
      inputTitle: suffixInput,
      styleTemplate: template,
      numberFormat: cfg.numberFormat ?? "chinese",
    });
  }, [cfg.numberFormat, chapterNo, suffixInput, template]);

  const shouldForceNormalize = normalized.hasConflict || normalizedFromOriginalTitle.hasConflict;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>发布为新章节</AlertDialogTitle>
          <AlertDialogDescription>
            将当前草稿发布为新章节，发布后会跳转到当前作品章节列表。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            将发布为：
            <span className="ml-2 font-semibold">{normalized.prefix}</span>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">章节标题后缀</div>
            <Input
              value={suffixInput}
              onChange={(e) => setSuffixInput(e.target.value)}
              placeholder="建议只填写标题后缀（系统会自动生成章号前缀）"
              disabled={isPending}
            />
            <div className="text-xs text-muted-foreground">
              最终标题预览：
              <span className="ml-2 font-medium text-foreground">{normalized.finalTitle || normalized.prefix}</span>
            </div>
          </div>

          {normalizedFromOriginalTitle.hasConflict ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="font-medium text-destructive">检测到草稿标题包含冲突章号，发布时将强制修正</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>
                  原草稿标题：<span className="font-medium">{draft.title || "(空)"}</span>
                </div>
                <div>
                  修正后标题：<span className="font-medium text-foreground">{normalizedFromOriginalTitle.finalTitle}</span>
                </div>
              </div>
            </div>
          ) : null}

          {normalized.hasConflict ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="font-medium text-destructive">检测到章号冲突，发布时将强制修正</div>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div>
                  你输入的标题检测到章号：<span className="font-medium">{normalized.detectedNo}</span>
                </div>
                <div>
                  将发布为系统章号：<span className="font-medium">{chapterNo}</span>
                </div>
                <div>
                  修正后标题：<span className="font-medium text-foreground">{normalized.finalTitle}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              onConfirm({
                chapterNo,
                inputTitle: suffixInput,
                normalizedTitle: normalized.finalTitle,
                hasConflict: normalized.hasConflict,
                detectedNo: normalized.detectedNo,
              });
            }}
            disabled={isPending}
          >
            确认发布
          </AlertDialogAction>
        </AlertDialogFooter>

        {shouldForceNormalize ? (
          <div className="pt-2 text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setSuffixInput(normalized.suffix)}
            >
              将标题替换为修正后
            </Button>
          </div>
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
