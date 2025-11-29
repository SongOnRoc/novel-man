"use client";

import { motion } from "framer-motion";
import { MoreHorizontal, Send, Trash2, Edit2, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate, formatWordCount, stripHtml } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DraftForClient } from "@/lib/services/draft.service";
import { Badge } from "@/components/ui/badge";

interface DraftCardProps {
  draft: DraftForClient;
  workTitle?: string;
  onDelete: () => void;
  onPublish: () => void;
}

export function DraftCard({
  draft,
  workTitle,
  onDelete,
  onPublish,
}: DraftCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on the action button
    if ((e.target as HTMLElement).closest("button")) return;
    router.push(`/drafts/${draft.id}/edit`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/30 hover:bg-background/60 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
              {draft.title || "无标题草稿"}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="h-5 bg-primary/5 px-1.5 font-normal text-primary hover:bg-primary/10">
                {workTitle || "未关联作品"}
              </Badge>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(draft.updatedAt || draft.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground/80">
            {stripHtml(draft.content || "") || (
              <span className="italic text-muted-foreground/50">
                暂无内容，点击开始写作...
              </span>
            )}
          </p>
          {/* Fade out effect for text */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background/40 to-transparent" />
        </div>
      </div>

      <div className="relative z-10 mt-6 flex items-center justify-between border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span>{formatWordCount(draft.wordCount || 0)} 字</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">操作</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => router.push(`/drafts/${draft.id}/edit`)}>
              <Edit2 className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onPublish}>
              <Send className="mr-2 h-4 w-4" />
              发布
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
