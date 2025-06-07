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
import { FileText, MoreVertical, Edit, Eye, ArrowUpDown } from "lucide-react";
import Link from "next/link";

// 章节类型定义
export interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  status: "draft" | "published";
  updatedAt: string;
  order: number;
}

// 章节列表属性
interface ChapterListProps {
  workId: string;
  chapters: Chapter[];
}

// 章节列表组件
export function ChapterList({ workId, chapters }: ChapterListProps) {
  // 获取状态标签的样式
  const getStatusBadge = (status: Chapter["status"]) => {
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            草稿
          </span>
        );
      case "published":
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            已发布
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>章节列表</CardTitle>
          <CardDescription>管理您的章节，拖动可以调整顺序。</CardDescription>
        </div>
        <Button asChild>
          <Link href={`/chapters/new?workId=${workId}`}>
            <FileText className="mr-2 h-4 w-4" />
            新建章节
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">暂无章节</h3>
            <p className="text-sm text-muted-foreground mt-1">
              点击"新建章节"按钮开始创作。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="flex items-center justify-between rounded-lg border p-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{chapter.title}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{chapter.wordCount} 字</span>
                      <span>•</span>
                      <span>更新于 {chapter.updatedAt}</span>
                      <span>•</span>
                      {getStatusBadge(chapter.status)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/chapters/${chapter.id}/view`}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">查看</span>
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/chapters/${chapter.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">编辑</span>
                    </Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">更多操作</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>设为草稿</DropdownMenuItem>
                      <DropdownMenuItem>发布章节</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        删除章节
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          共 {chapters.length} 章节，
          {chapters
            .reduce((sum, chapter) => sum + chapter.wordCount, 0)
            .toLocaleString()}{" "}
          字
        </div>
      </CardFooter>
    </Card>
  );
}
