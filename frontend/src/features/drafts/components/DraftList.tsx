"use client";

import { MoreHorizontal, Edit2, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DraftForClient } from "@/lib/services/draft.service";
import { formatDate, formatWordCount, stripHtml } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface DraftListProps {
  drafts: DraftForClient[];
  onDelete: (draft: DraftForClient) => void;
  onPublish: (draft: DraftForClient) => void;
  getDraftEditHref?: (draft: DraftForClient) => string;
}

const getDefaultDraftEditHref = (draft: DraftForClient): string => `/drafts/${draft.id}/edit`;

export function DraftList({
  drafts,
  onDelete,
  onPublish,
  getDraftEditHref = getDefaultDraftEditHref,
}: DraftListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm">
      {/* Header - Hidden on mobile, visible on sm+ */}
      <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-border/30 bg-muted/30 px-6 py-3 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
        <div className="col-span-6">标题</div>
        <div className="col-span-2">字数</div>
        <div className="col-span-3">最后更新</div>
        <div className="col-span-1 text-right">操作</div>
      </div>
      
      {/* Body */}
      <div className="divide-y divide-border/30">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="group flex flex-col gap-3 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 px-4 sm:px-6 py-4 transition-colors hover:bg-muted/40 animate-in fade-in slide-in-from-left-4 duration-300"
          >
            {/* Title Section: Full width on mobile, 6 cols on desktop */}
            <div className="w-full sm:col-span-6">
              <Link
                href={getDraftEditHref(draft)}
                className="block text-base font-semibold text-foreground/90 transition-colors hover:text-primary"
              >
                {draft.title || "无标题草稿"}
              </Link>
              <p className="hidden sm:block mt-1.5 line-clamp-1 text-xs text-muted-foreground/60 font-light">
                {stripHtml(draft.content || "") || "暂无内容..."}
              </p>
            </div>

            {/* Mobile Layout: Rows 2 & 3 */}
            <div className="flex flex-col gap-3 sm:hidden w-full">
              {/* Row 2: Word Count */}
              <div>
                <Badge variant="secondary" className="font-mono text-[10px] font-normal text-muted-foreground/80 bg-muted/50">
                  {formatWordCount(draft.wordCount || 0)}字
                </Badge>
              </div>
              
              {/* Row 3: Date (Left) & Actions (Right) */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground/60 font-mono">
                  {formatDate(draft.updatedAt || draft.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                   <Button
                     variant="ghost"
                     size="icon"
                     className="h-8 w-8 rounded-full text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                     onClick={() => onPublish(draft)}
                     title="发布"
                   >
                     <Send className="h-3.5 w-3.5" />
                   </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={getDraftEditHref(draft)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          编辑草稿
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPublish(draft)}>
                        <Send className="mr-2 h-4 w-4" />
                        发布为章节
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setTimeout(() => {
                            onDelete(draft);
                          }, 0);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            
            {/* Desktop Columns (Hidden on Mobile) */}
            <div className="hidden sm:block sm:col-span-2">
              <Badge variant="secondary" className="font-mono text-[10px] font-normal text-muted-foreground/80 bg-muted/50 hover:bg-muted/70">
                {formatWordCount(draft.wordCount || 0)}
              </Badge>
            </div>
            
            <div className="hidden sm:block sm:col-span-3 text-xs text-muted-foreground/60 font-mono">
              {formatDate(draft.updatedAt || draft.createdAt)}
            </div>
            
            <div className="hidden sm:flex sm:col-span-1 justify-end items-center gap-1">
               <Button
                 variant="ghost"
                 size="icon"
                 className="h-8 w-8 rounded-full text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                 onClick={() => onPublish(draft)}
                 title="发布"
               >
                 <Send className="h-3.5 w-3.5" />
               </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground/40 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={getDraftEditHref(draft)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      编辑草稿
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPublish(draft)}>
                    <Send className="mr-2 h-4 w-4" />
                    发布为章节
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setTimeout(() => {
                        onDelete(draft);
                      }, 0);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
