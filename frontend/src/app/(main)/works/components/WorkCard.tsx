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
import { Work } from "@/types/work";

// 作品卡片属性类型
interface WorkCardProps {
  work: Work;
  onDelete: () => void;
}

// 作品卡片组件
export function WorkCard({ work, onDelete }: WorkCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* 卡片头部：标题和操作菜单 */}
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="line-clamp-1">{work.name}</CardTitle>
          {/* <div className="text-sm text-muted-foreground">
            {work.chapterCount} 章节 · {work.wordCount.toLocaleString()} 字
          </div> */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">打开菜单</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>编辑信息</DropdownMenuItem>
            <DropdownMenuItem>导出作品</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              删除作品
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* 卡片内容：作品描述 */}
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {work.description || "暂无描述"}
        </p>
      </CardContent>

      {/* 卡片底部：操作按钮 */}
      <CardFooter className="grid grid-cols-3 gap-2">
        <Button variant="outline" size="sm" className="gap-1" asChild>
          <Link href={`/works/${work.id}/outline`}>
            <FileText className="h-4 w-4" />
            大纲管理
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="gap-1">
          <BookOpen className="h-4 w-4" />
          查看章节
        </Button>
        <Button size="sm" className="gap-1 col-span-1">
          <Edit className="h-4 w-4" />
          继续写作
        </Button>
      </CardFooter>
    </Card>
  );
}
