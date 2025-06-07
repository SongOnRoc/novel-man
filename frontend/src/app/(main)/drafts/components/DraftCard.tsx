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

// 草稿类型定义
export interface Draft {
  id: string;
  title: string;
  content: string;
  workTitle?: string;
  workId?: string;
  chapterId?: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

// 草稿卡片属性
interface DraftCardProps {
  draft: Draft;
  onDelete?: (id: string) => void;
  onConvert?: (id: string) => void;
}

// 草稿卡片组件
export function DraftCard({ draft, onDelete, onConvert }: DraftCardProps) {
  // 获取草稿内容预览（截取前100个字符）
  const contentPreview =
    draft.content.length > 100
      ? `${draft.content.substring(0, 100)}...`
      : draft.content;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold leading-tight">
            {draft.title || "无标题草稿"}
          </h3>
          {draft.workTitle && (
            <p className="text-sm text-muted-foreground">
              作品：{draft.workTitle}
            </p>
          )}
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
              <DropdownMenuItem onClick={() => onConvert?.(draft.id)}>
                转为正式章节
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
          <span>更新于 {draft.updatedAt}</span>
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
