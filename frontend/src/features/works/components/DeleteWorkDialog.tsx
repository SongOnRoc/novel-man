import React, { useEffect, useState } from "react";

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
import type { DraftHandling } from "@/lib/services/work.service";

type ConflictErrorLike = {
  code?: number;
  data?: {
    draftCount?: number;
  };
};

function parseDraftCountFromConflict(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;

  const maybe = error as ConflictErrorLike;
  if (maybe.code !== 409) return null;

  const draftCount = maybe.data?.draftCount;
  if (typeof draftCount !== "number" || !Number.isFinite(draftCount))
    return null;

  return draftCount;
}

interface DeleteWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (draftHandling?: DraftHandling) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteWorkDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: DeleteWorkDialogProps) {
  const [phase, setPhase] = useState<"initial" | "resolveDrafts">("initial");
  const [draftCount, setDraftCount] = useState<number | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPhase("initial");
      setDraftCount(null);
      setErrorText(null);
    }
  }, [open]);

  const handleInitialConfirm = async (): Promise<void> => {
    setErrorText(null);

    try {
      await onConfirm();
    } catch (error) {
      const count = parseDraftCountFromConflict(error);
      if (count !== null) {
        setDraftCount(count);
        setPhase("resolveDrafts");
        return;
      }

      setErrorText("删除失败，请稍后重试");
    }
  };

  const handleSecondConfirm = async (
    draftHandling: DraftHandling
  ): Promise<void> => {
    setErrorText(null);

    try {
      await onConfirm(draftHandling);
    } catch {
      setErrorText("删除失败，请稍后重试");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          {phase === "initial" ? (
            <>
              <AlertDialogTitle>确定要删除这个作品吗？</AlertDialogTitle>
              <AlertDialogDescription>
                删除后不可恢复。若该作品下存在草稿，系统会提示你选择草稿处理方式。
              </AlertDialogDescription>
            </>
          ) : (
            <>
              <AlertDialogTitle>检测到关联草稿</AlertDialogTitle>
              <AlertDialogDescription>
                该作品下有 {draftCount ?? 0}{" "}
                篇草稿。删除作品前需要选择处理方式：
                <br />
                解除关联（unlink）：保留草稿，但会变为“未关联作品”的草稿。
                <br />
                删除草稿（delete）：将草稿永久删除，不可恢复。
              </AlertDialogDescription>
            </>
          )}
          {errorText ? (
            <AlertDialogDescription className="text-destructive">
              {errorText}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>

          {phase === "initial" ? (
            <AlertDialogAction
              asChild
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                void handleInitialConfirm();
              }}
              disabled={isDeleting}
            >
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "删除中..." : "确认删除"}
              </Button>
            </AlertDialogAction>
          ) : (
            <>
              <AlertDialogAction
                asChild
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  void handleSecondConfirm("unlink");
                }}
                disabled={isDeleting}
              >
                <Button variant="secondary" disabled={isDeleting}>
                  {isDeleting ? "处理中..." : "解除关联并删除作品"}
                </Button>
              </AlertDialogAction>

              <AlertDialogAction
                asChild
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  void handleSecondConfirm("delete");
                }}
                disabled={isDeleting}
              >
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? "处理中..." : "删除草稿并删除作品"}
                </Button>
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
