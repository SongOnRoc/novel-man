import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Edit, FileText, MoreVertical, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

import { Draft } from "@/types/draft";
import { useWorks } from "@/hooks/work/useWorks";
import { Work } from "@/types/work";

// 草稿卡片属性
interface DraftCardProps {
  draft: Draft;
  works: Work[];
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
}

// 草稿卡片组件
export function DraftCard({
  draft,
  works,
  onDelete,
  onPublish,
}: DraftCardProps) {
  const getWorkNameById = (workId: number | string) => {
    const id = typeof workId === "string" ? parseInt(workId, 10) : workId;
    return works.find((work) => work.id === id)?.title || "未知作品";
  };

  // 获取草稿内容预览（截取前100个字符）
  const contentPreview =
    draft.content && draft.content.length > 100
      ? `${draft.content.substring(0, 100)}...`
      : draft.content;

  const workName = draft.workId ? getWorkNameById(draft.workId) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-tight">
            {draft.title || "无标题草稿"}
          </h3>
          <p className="text-sm text-muted-foreground h-5">
            {workName ? `作品：${workName}` : <></>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">操作菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/drafts/${draft.id}/edit`}>编辑草稿</Link>
            </DropdownMenuItem>
            {draft.workId && (
              <DropdownMenuItem onClick={() => onPublish?.(draft.id)}>
                发布
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(draft.id)}
            >
              删除草稿
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {contentPreview || "空白草稿"}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1 h-3.5 w-3.5" />
          <span>更新于 {new Date(draft.updatedAt).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <FileText className="mr-1 h-3.5 w-3.5" />
          <span>{draft.wordCount} 字</span>
        </div>
        <Button asChild size="sm">
          <Link href={`/drafts/${draft.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            继续编辑
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
