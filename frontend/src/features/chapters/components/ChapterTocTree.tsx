"use client";

import React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, FileText, GripVertical, MoreVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { ChapterDirectoryGroup } from "@/features/chapters/lib/chapterDirectory";

interface ChapterTocTreeProps {
  groups?: ChapterDirectoryGroup[];
  chapters?: ChapterForClient[];
  isTreeMode?: boolean;
  expandedKeys?: string[];
  currentChapterId?: number;
  onToggleGroup?: (key: string) => void;
  workId: number;
  onDelete: (chapter: ChapterForClient) => void;
  onReorder: (chapter: ChapterForClient) => void;
}

function ChapterDirectoryItem({
  chapter,
  workId,
  isCurrent,
  onDelete,
  onReorder,
}: {
  chapter: ChapterForClient;
  workId: number;
  isCurrent: boolean;
  onDelete: (chapter: ChapterForClient) => void;
  onReorder: (chapter: ChapterForClient) => void;
}): React.ReactElement {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        isCurrent
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border/50 bg-background/70"
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
        {chapter.displayOrder ?? "-"}
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/works/${workId}/chapters/${chapter.id}`}
          data-current={isCurrent ? "true" : undefined}
          className={`block truncate text-sm font-medium hover:text-primary ${
            isCurrent ? "text-primary" : "text-foreground"
          }`}
        >
          {chapter.title || "无标题章节"}
        </Link>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {chapter.wordCount ?? 0} 字
          </span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">章节更多操作</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/works/${workId}/chapters/${chapter.id}/edit`}>编辑章节</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onReorder(chapter)}>
            <GripVertical className="mr-2 h-4 w-4" />
            调整章节号
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(chapter)}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除章节
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ChapterTocTree({
  groups = [],
  chapters,
  isTreeMode = false,
  expandedKeys = [],
  currentChapterId,
  onToggleGroup,
  workId,
  onDelete,
  onReorder,
}: ChapterTocTreeProps): React.ReactElement {
  if (!isTreeMode) {
    return (
      <div className="space-y-3">
        {(chapters || []).map((chapter) => (
          <ChapterDirectoryItem
            key={chapter.id}
            chapter={chapter}
            workId={workId}
            isCurrent={chapter.id === currentChapterId}
            onDelete={onDelete}
            onReorder={onReorder}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const expanded = expandedKeys.includes(group.key);

        return (
          <section key={group.key} className="rounded-2xl border border-border/50 bg-background/60 p-3">
            <button
              type="button"
              onClick={() => onToggleGroup?.(group.key)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="text-sm font-medium text-foreground">{group.label}</span>
              </div>
              <span className="text-xs text-muted-foreground">{group.chapters.length} 章</span>
            </button>

            {expanded ? (
              <div className="mt-3 space-y-3">
                {group.chapters.map((chapter) => (
                  <ChapterDirectoryItem
                    key={chapter.id}
                    chapter={chapter}
                    workId={workId}
                    isCurrent={chapter.id === currentChapterId}
                    onDelete={onDelete}
                    onReorder={onReorder}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
