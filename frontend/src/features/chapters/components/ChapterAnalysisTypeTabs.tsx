"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import type { ChapterAnalysisKind } from "@/features/chapters/lib/chapterAnalysis";

interface ChapterAnalysisTypeTabsProps {
  value: ChapterAnalysisKind;
  onChange: (value: ChapterAnalysisKind) => void;
}

export function ChapterAnalysisTypeTabs({
  value,
  onChange,
}: ChapterAnalysisTypeTabsProps): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={value === "outline" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("outline")}
      >
        大纲
      </Button>
      <Button
        type="button"
        variant={value === "characters" ? "default" : "outline"}
        size="sm"
        onClick={() => onChange("characters")}
      >
        角色
      </Button>
    </div>
  );
}
