"use client";

import React from "react";
import { ChevronDown, ChevronUp, MoreHorizontal, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChapterDirectoryToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  showTreeControls?: boolean;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
}

export function ChapterDirectoryToolbar({
  query,
  onQueryChange,
  showTreeControls = false,
  onExpandAll,
  onCollapseAll,
}: ChapterDirectoryToolbarProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="搜索章节或分卷"
          placeholder="搜索章节或分卷"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showTreeControls ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onExpandAll}>
              <ChevronDown className="mr-2 h-4 w-4" />
              全部展开
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onCollapseAll}>
              <ChevronUp className="mr-2 h-4 w-4" />
              全部折叠
            </Button>
          </>
        ) : null}
        <Button type="button" variant="ghost" size="sm">
          <MoreHorizontal className="mr-2 h-4 w-4" />
          更多操作
        </Button>
      </div>
    </div>
  );
}
