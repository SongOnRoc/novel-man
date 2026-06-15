"use client";

import { Sparkles } from "lucide-react";
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
import { useDraftList, useUpdateDraft } from "@/hooks/draft/useDraftService";
import { cn } from "@/lib/utils";

// 全局草稿箱（未关联作品）的 workId 约定为 0
const UNLINKED_WORK_ID = 0;

interface ImportInspirationDialogProps {
  workId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 从灵感箱引入：列出未关联作品的全局草稿，勾选后关联到当前作品（更新 workId）。
 * 引入后这些草稿出现在当前作品草稿列表，可正常发布为章节。
 */
export function ImportInspirationDialog({
  workId,
  open,
  onOpenChange,
}: ImportInspirationDialogProps): React.ReactElement {
  const { data, isLoading } = useDraftList({ workId: UNLINKED_WORK_ID, limit: 999 });
  const drafts = data?.data ?? [];
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { mutateAsync: updateDraft, isPending } = useUpdateDraft();

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

  const handleImport = async () => {
    if (selected.size === 0) {
      return;
    }
    try {
      await Promise.all(
        [...selected].map((id) => updateDraft({ id, data: { workId } })),
      );
      toast.success(`已引入 ${selected.size} 篇草稿到本作品`);
      setSelected(new Set());
      onOpenChange(false);
    } catch (error) {
      toast.error(`引入失败：${(error as Error).message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>从灵感箱引入</DialogTitle>
          <DialogDescription>
            选择未关联作品的灵感草稿，引入到当前作品后即可继续编辑、发布为章节。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto py-1">
          {isLoading ? (
            <GlobalLoading fullScreen={false} />
          ) : drafts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              灵感箱里暂无未关联的草稿。
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
            onClick={handleImport}
            disabled={isPending || selected.size === 0}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {isPending ? "引入中…" : `引入${selected.size > 0 ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
