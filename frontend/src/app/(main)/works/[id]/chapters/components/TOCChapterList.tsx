"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Edit, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { cn } from "@/lib/utils";

interface TOCChapterListProps {
  chapters: ChapterForClient[];
  workId: number;
  onDelete: (chapter: ChapterForClient) => void;
  onReorder: (chapter: ChapterForClient) => void;
}

export function TOCChapterList({ chapters, workId, onDelete, onReorder }: TOCChapterListProps) {
  return (
    <div className="space-y-2">
      {chapters.map((chapter, index) => (
        <motion.div
          key={chapter.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group flex items-center gap-4 rounded-lg border border-transparent bg-card p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
        >
          {/* Drag Handle (Visual only for now) */}
          <div className="cursor-grab text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Chapter Order (display_order authoritative) */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            {chapter.displayOrder ?? "-"}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link 
                href={`/works/${workId}/chapters/${chapter.id}/edit`}
                className="truncate text-base font-medium text-foreground hover:text-primary hover:underline transition-colors"
              >
                {chapter.title}
              </Link>
              {chapter.status === "draft" && (
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-600">
                  草稿
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {chapter.wordCount || 0} 字
              </span>
              <span>
                更新于 {formatDistanceToNow(new Date(chapter.updatedAt || new Date()), { addSuffix: true, locale: zhCN })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href={`/works/${workId}/chapters/${chapter.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/works/${workId}/chapters/${chapter.id}/preview`}>
                      预览章节
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onReorder(chapter)}>
                    <GripVertical className="mr-2 h-4 w-4" />
                    调整章节号
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(chapter)}
                  >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
