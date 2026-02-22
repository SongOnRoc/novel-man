"use client";

import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Work } from "@/lib/services/work.service";

export type DraftTemplateKey = "blank" | "plot" | "character" | "scene";

export type NewDraftDialogFormValues = {
  title: string;
  workId: string;
  templateKey: DraftTemplateKey;
};

export const DRAFT_TEMPLATE_OPTIONS: {
  key: DraftTemplateKey;
  label: string;
  content: string;
}[] = [
  { key: "blank", label: "空白模板", content: "" },
  {
    key: "plot",
    label: "剧情推进",
    content:
      "<h2>剧情推进草稿</h2><p>目标：推进冲突与情节转折。</p><p>当前冲突：</p><p>关键事件：</p><p>下一步推动：</p>",
  },
  {
    key: "character",
    label: "人物塑造",
    content:
      "<h2>人物塑造草稿</h2><p>角色：</p><p>外在表现：</p><p>内在动机：</p><p>关系变化：</p>",
  },
  {
    key: "scene",
    label: "场景描写",
    content:
      "<h2>场景描写草稿</h2><p>时间与地点：</p><p>感官细节：</p><p>人物动作：</p><p>情绪氛围：</p>",
  },
];

interface NewDraftDialogProps {
  open: boolean;
  isCreating: boolean;
  works: Work[];
  values: NewDraftDialogFormValues;
  errorMessage?: string;
  onOpenChange: (open: boolean) => void;
  onValuesChange: (next: Partial<NewDraftDialogFormValues>) => void;
  onConfirm: () => void;
}

export function NewDraftDialog({
  open,
  isCreating,
  works,
  values,
  errorMessage,
  onOpenChange,
  onValuesChange,
  onConfirm,
}: NewDraftDialogProps): React.ReactElement {
  const handleOpenChange = (nextOpen: boolean) => {
    if (isCreating && !nextOpen) {
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={!isCreating}
        onInteractOutside={(event) => {
          if (isCreating) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>新建草稿</DialogTitle>
          <DialogDescription>
            先确认基础信息，再创建草稿并进入编辑页。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-draft-title" className="text-sm font-medium">
              草稿标题（可选）
            </label>
            <Input
              id="new-draft-title"
              placeholder="无标题草稿"
              value={values.title}
              disabled={isCreating}
              onChange={(event) =>
                onValuesChange({ title: event.currentTarget.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">关联作品（可选）</label>
            <Select
              value={values.workId}
              onValueChange={(value) => onValuesChange({ workId: value })}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="不关联作品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不关联作品</SelectItem>
                {works.map((work) => (
                  <SelectItem key={work.id} value={work.id!.toString()}>
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">模板（可选）</label>
            <Select
              value={values.templateKey}
              onValueChange={(value) =>
                onValuesChange({ templateKey: value as DraftTemplateKey })
              }
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="空白模板" />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_TEMPLATE_OPTIONS.map((option) => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage ? (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isCreating}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button type="button" disabled={isCreating} onClick={onConfirm}>
            {isCreating ? "创建中..." : "确认创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
