import { BookOpen, MoreVertical, FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

// 作品卡片组件 - 列表项样式
export function WorkCard({
  work,
  onDelete,
  isDeleting = false,
}: WorkCardProps) {
  return (
    <Card className="flex flex-col md:flex-row items-start gap-4 p-4 transition-all hover:bg-muted/50">
      {/* 封面 */}
      <div className="w-full md:w-24 aspect-[4/3] md:aspect-[2/3] bg-secondary rounded-md flex-shrink-0">
        {/* 在这里可以放置封面图片 */}
        {/* <img src={work.coverUrl} alt={work.title} className="object-cover w-full h-full rounded-md" /> */}
      </div>

      {/* 作品信息与操作 */}
      <div className="flex flex-col justify-between flex-1 w-full">
        <div className="md:mb-0 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/works/${work.id}/outline`}>
              <h3 className="text-lg font-semibold hover:underline">{work.title}</h3>
            </Link>
            <Badge variant="outline">征文作品</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            最近更新：第27章 再入古村？
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>27 章</span>
            <span>6.6 万字</span>
            <span>连载中 · 已签约</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chapters?workId=${work.id}`}>
              <BookOpen className="mr-2 h-4 w-4" />
              章节管理
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/works/${work.id}/drafts`}>
              <FileText className="mr-2 h-4 w-4" />
              作品推荐
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/chapters/new?workId=${work.id}`}>
              创建章节
            </Link>
          </Button>
          <div className="ml-auto">
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
          </div>
        </div>
      </div>
    </Card>
  );
}
