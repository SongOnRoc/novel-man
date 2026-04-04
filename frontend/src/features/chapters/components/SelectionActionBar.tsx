"use client";

import React from "react";

import { Button } from "@/components/ui/button";

interface SelectionActionBarProps {
  selectedCount: number;
  onExtractOutline: () => void;
  onExtractCharacters: () => void;
  onCancel: () => void;
}

export function SelectionActionBar({
  selectedCount,
  onExtractOutline,
  onExtractCharacters,
  onCancel,
}: SelectionActionBarProps): React.ReactElement {
  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/95 p-3 shadow-lg backdrop-blur">
      <div className="text-sm font-medium">已选 {selectedCount} 段</div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消选择
        </Button>
        <Button type="button" variant="outline" onClick={onExtractCharacters} disabled={selectedCount === 0}>
          提取角色经历
        </Button>
        <Button type="button" onClick={onExtractOutline} disabled={selectedCount === 0}>
          提取大纲
        </Button>
      </div>
    </div>
  );
}
