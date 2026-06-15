"use client";

import { Send } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBatchPublishDrafts, useDraftList } from "@/hooks/draft/useDraftService";
import { cn } from "@/lib/utils";

interface BatchPublishDraftsDialogProps {
  workId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 批量发布：列出当前作品下的草稿，勾选多篇后一键发布为章节。
 * 发布遵守"章节只能由草稿发布"的铁律，逐篇发布、部分成功语义。
 */
export function BatchPublishDraftsDialog({
  workId,
  open,
  onOpenChange,
}: BatchPublishDraftsDialogProps): React.ReactElement {
  const { data, isLoading } = useDraftList({ workId, limit: 999 });
  const drafts = data?.data ?? [];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { mutateAsync: batchPublish, isPending } = useBatchPublishDrafts();

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const close = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }
    if (!nextOpen) {
      setSelected(new Set());
    }
    onOpenChange(nextOpen);
  };

  const handlePublish = async () => {
    if (selected.size === 0) {
      return;
    }
    try {
      const result = await batchPublish([...selected]);
      const success = result?.success ?? 0;
      const failed = result?.failed ?? 0;
      if (success > 0) {
        toast.success(
          failed > 0
            ? `已发布 ${success} 篇为章节，${failed} 篇失败`
            : `已发布 ${success} 篇草稿为章节`,
        );
      } else {
        toast.error(`发布失败：${result?.errors?.join("，") || "未知错误"}`);
      }
      setSelected(new Set());
      onOpenChange(false);
    } catch (error) {
      toast.error(`批量发布失败：${(error as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>批量发布为章节</DialogTitle>
          <DialogDescription>
            勾选要发布的草稿，确认后将逐篇发布为章节（发布后草稿转为正式章节）。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto py-1">
          {isLoading ? (
            <GlobalLoading fullScreen={false} />
          ) : drafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              当前作品下暂无可发布的草稿。
            </p>
          ) : (
            drafts.map((draft) => (
              <label
                key={draft.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  selected.has(draft.id!)
                    ? "border-[var(--primary-200)] bg-[var(--primary-50)]/50"
                    : "border-[var(--border-default)]/60 hover:bg-muted/40",
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(draft.id!)}
                  onChange={() => toggle(draft.id!)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-default)] accent-[var(--primary-500)]"
                />
                <span className="block min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {draft.title || "无标题草稿"}
                </span>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={isPending}
            className="rounded-full"
          >
            取消
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPending || selected.size === 0}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="mr-1.5 h-4 w-4" />
            {isPending ? "发布中…" : `发布${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
