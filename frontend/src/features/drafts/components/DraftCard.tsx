"use client";

import {
  MoreHorizontal,
  Send,
  Trash2,
  Edit2,
  Calendar,
  FileText,
} from "lucide-react";
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
    // Prevent navigation if clicking on the action button or menu items
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[role="menuitem"]')
    ) {
      return;
    }
    router.push(`/drafts/${draft.id}/edit`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5 cursor-pointer animate-in fade-in zoom-in-95 duration-300"
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition-all duration-500 group-hover:bg-primary/10" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-between w-full">
              <Badge
                variant="secondary"
                className="h-5 bg-primary/5 px-2 font-medium text-[10px] text-primary hover:bg-primary/10 transition-colors"
              >
                {workTitle || "未关联作品"}
              </Badge>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Calendar className="h-3 w-3" />
                {formatDate(draft.updatedAt || draft.createdAt).split(" ")[0]}
              </span>
            </div>

            <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-foreground/90 transition-colors group-hover:text-primary">
              {draft.title || "无标题草稿"}
            </h3>
          </div>
        </div>

        <div className="relative min-h-[5rem]">
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground/70 group-hover:text-muted-foreground/90 transition-colors">
            {stripHtml(draft.content || "") || (
              <span className="italic text-muted-foreground/40">
                暂无内容，点击开始写作...
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/60 group-hover:text-muted-foreground/80 transition-colors">
          <FileText className="h-3.5 w-3.5" />
          <span>{formatWordCount(draft.wordCount || 0)} 字</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground/60 hover:bg-primary/10 hover:text-primary transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onPublish();
            }}
            title="发布"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground/60 hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">操作</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/drafts/${draft.id}/edit`);
                }}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPublish();
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                发布
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  // Use setTimeout to decouple the dialog opening from the menu closing.
                  // This prevents focus management conflicts between Radix UI primitives.
                  setTimeout(() => {
                    onDelete();
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
  );
}
