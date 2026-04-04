"use client";

import React from "react";

import { Button } from "@/components/ui/button";

import { SelectionActionBar } from "./SelectionActionBar";

interface ChapterSelectionModeProps {
  paragraphs: string[];
  onCancel: () => void;
  onExtract: (payload: { type: "outline" | "characters"; paragraphs: string[] }) => void;
}

export function ChapterSelectionMode({
  paragraphs,
  onCancel,
  onExtract,
}: ChapterSelectionModeProps): React.ReactElement {
  const [selectedIndexes, setSelectedIndexes] = React.useState<number[]>([]);

  const toggleIndex = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  };

  const selectedParagraphs = selectedIndexes.map((index) => paragraphs[index]).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/80 px-4 py-3 shadow-sm">
        <div className="space-y-1">
          <div className="text-sm font-semibold">片段选择模式</div>
          <p className="text-sm text-muted-foreground">点击段落选择需要提取的片段。</p>
        </div>
        <Button type="button" variant="ghost" onClick={onCancel}>
          退出选择
        </Button>
      </div>

      <div className="space-y-3">
        {paragraphs.map((paragraph, index) => {
          const selected = selectedIndexes.includes(index);
          return (
            <button
              key={`${index}-${paragraph.slice(0, 12)}`}
              type="button"
              onClick={() => toggleIndex(index)}
              className={`block w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border/50 bg-background/70 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                第 {index + 1} 段
              </div>
              <div className="text-sm leading-7">{paragraph}</div>
            </button>
          );
        })}
      </div>

      <SelectionActionBar
        selectedCount={selectedParagraphs.length}
        onCancel={onCancel}
        onExtractOutline={() => onExtract({ type: "outline", paragraphs: selectedParagraphs })}
        onExtractCharacters={() => onExtract({ type: "characters", paragraphs: selectedParagraphs })}
      />
    </div>
  );
}
