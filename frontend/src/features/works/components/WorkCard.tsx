import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Edit, MoreVertical, FileText } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Work } from "@/lib/services/work.service";

// 作品卡片属性类型
interface WorkCardProps {
  work: Work;
  onDelete: () => void;
  isDeleting?: boolean;
}

// 作品卡片组件
export function WorkCard({
  work,
  onDelete,
  isDeleting = false,
}: WorkCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* 卡片头部：标题和操作菜单 */}
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="line-clamp-1">{work.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {/* TODO: Implement chapterCount and wordCount */}
            {/* {(work.chapterCount ?? 0).toLocaleString()} 章节 ·{" "} */}
            {/* {(work.wordCount ?? 0).toLocaleString()} 字 */}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/works/${work.id}/edit`}>编辑信息</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert(`导出作品： ${work.title}`)}>
              导出作品
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "删除作品"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* 卡片内容：作品描述 */}
      <CardContent>
        <div className="space-y-2">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {work.description || "暂无描述"}
          </p>
          {/* TODO: Implement lastUpdatedChapter */}
          {/* {work.lastUpdatedChapter && (
            <div className="text-xs text-muted-foreground">
              最近更新：
              <span className="font-medium text-primary">
                {work.lastUpdatedChapter.title}
              </span>
              <span className="mx-1">·</span>
              <span>{work.lastUpdatedChapter.updatedAt}</span>
            </div>
          )} */}
        </div>
      </CardContent>

      {/* 卡片底部：操作按钮 */}
      <CardFooter className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href={`/works/${work.id}/outline`}>
            <FileText className="h-4 w-4" />
            大纲管理
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href={`/chapters?workId=${work.id}`}>
            <BookOpen className="h-4 w-4" />
            查看章节
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href={`/drafts?workId=${work.id}`}>
            <FileText className="h-4 w-4" />
            查看草稿
          </Link>
        </Button>
        <Button size="sm" className="gap-1" asChild disabled={true}>
          <Link href="#">
            <Edit className="h-4 w-4" />
            继续写作
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
