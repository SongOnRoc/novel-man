"use client";

import { motion } from "framer-motion";
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
}

export function DraftList({ drafts, onDelete, onPublish }: DraftListProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-background/40 backdrop-blur-md">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border/30 bg-muted/20 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-6">标题</div>
        <div className="col-span-2">字数</div>
        <div className="col-span-3">最后更新</div>
        <div className="col-span-1 text-right">操作</div>
      </div>
      
      {/* Body */}
      <div className="divide-y divide-border/30">
        {drafts.map((draft, index) => (
          <motion.div
            key={draft.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-primary/5"
          >
            <div className="col-span-6">
              <Link
                href={`/drafts/${draft.id}/edit`}
                className="block font-medium text-foreground transition-colors hover:text-primary"
              >
                {draft.title || "无标题草稿"}
              </Link>
              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/70">
                {stripHtml(draft.content || "") || "暂无内容..."}
              </p>
            </div>
            
            <div className="col-span-2">
              <Badge variant="outline" className="font-mono text-xs font-normal text-muted-foreground">
                {formatWordCount(draft.wordCount || 0)}
              </Badge>
            </div>
            
            <div className="col-span-3 text-sm text-muted-foreground">
              {formatDate(draft.updatedAt || draft.createdAt)}
            </div>
            
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full opacity-0 transition-all hover:bg-background/80 hover:text-primary hover:shadow-sm group-hover:opacity-100 focus:opacity-100"
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild>
                    <Link href={`/drafts/${draft.id}/edit`}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      编辑
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPublish(draft)}>
                    <Send className="mr-2 h-4 w-4" />
                    发布
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(draft)} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}