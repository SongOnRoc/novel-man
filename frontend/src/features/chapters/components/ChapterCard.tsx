import { BookText, Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChapterForClient } from "@/lib/services/chapter.service";

interface ChapterCardProps {
  chapter: ChapterForClient;
  workId: number;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function ChapterCard({
  chapter,
  workId,
  onDelete,
  isDeleting = false,
}: ChapterCardProps) {
  const statusMap: { [key: string]: string } = {
    published: "已发布",
    draft: "草稿",
    scheduled: "待发布",
  };

  const statusColorMap: { [key: string]: "success" | "secondary" | "default" } = {
    published: "success",
    draft: "secondary",
    scheduled: "default",
  };

  return (
    <Card className="flex h-full flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <Link href={`/chapters/${chapter.id}/edit`}>
            <CardTitle className="hover:underline">{chapter.title}</CardTitle>
          </Link>
          <ChapterCardMenu
            chapterId={chapter.id!}
            workId={workId}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        </div>
        <CardDescription>
          更新于 {new Date(chapter.updatedAt!).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookText className="h-4 w-4" />
            <span>{chapter.wordCount} 字</span>
          </div>
          <Badge
            variant={statusColorMap[chapter.status || "draft"] || "secondary"}
          >
            {statusMap[chapter.status || "draft"] || "草稿"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/chapters/${chapter.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            编辑章节
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function ChapterCardMenu({
  chapterId,
  workId,
  onDelete,
  isDeleting,
}: {
  chapterId: number;
  workId: number;
  onDelete: () => void;
  isDeleting?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/chapters/${chapterId}/preview`}>预览</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "删除中..." : "删除"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}