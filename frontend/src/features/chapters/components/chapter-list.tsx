"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { formatDate, formatWordCount } from "@/lib/utils";

interface ChapterListProps {
  chapters: ChapterForClient[];
  onDelete: (chapter: ChapterForClient) => void;
  workId: number;
}

export const ChapterList = ({
  chapters,
  onDelete,
  workId,
}: ChapterListProps) => {
  const router = useRouter();

  return (
    <Card>
      <div className="space-y-2 p-4">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
          <div className="col-span-5">标题</div>
          <div className="col-span-2">状态</div>
          <div className="col-span-2">字数</div>
          <div className="col-span-2">最后更新</div>
          <div className="col-span-1 text-right">操作</div>
        </div>
        {/* Body */}
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="grid grid-cols-12 items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50"
          >
            <div className="col-span-5 font-medium">
              <Link
                href={`/works/${workId}/chapters/${chapter.id}/edit`}
                className="hover:underline"
              >
                {chapter.title}
              </Link>
            </div>
            <div className="col-span-2">
              <Badge
                variant={chapter.status === "published" ? "success" : "secondary"}
              >
                {chapter.status}
              </Badge>
            </div>
            <div className="col-span-2">{formatWordCount(chapter.wordCount || 0)}</div>
            <div className="col-span-2">
              {formatDate(chapter.updatedAt || chapter.createdAt)}
            </div>
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/works/${workId}/chapters/${chapter.id}/edit`)
                    }
                  >
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(chapter)}>
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
