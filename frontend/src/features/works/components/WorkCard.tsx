import {
  BookOpen,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Work } from "@/lib/services/work.service";

interface WorkCardProps {
  work: Work;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function WorkCard({
  work,
  onDelete,
  isDeleting = false,
}: WorkCardProps) {
  const statusMap: { [key: string]: string } = {
    serializing: "连载中",
    completed: "已完结",
    on_hiatus: "断更中",
  };

  const statusColorMap: { [key: string]: "default" | "destructive" | "success" } = {
    serializing: "default",
    completed: "success",
    on_hiatus: "destructive",
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* 封面占位符 */}
      <div className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 to-primary/5">
        {/* <img src={work.coverUrl} alt={work.title} className="object-cover w-full h-full" /> */}
      </div>

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <Link href={`/works/${work.id}/outline`}>
            <h3 className="text-2xl font-bold hover:underline">{work.title}</h3>
          </Link>
          <WorkCardMenu onDelete={onDelete} isDeleting={isDeleting} work={work} />
        </div>
        <p className="text-sm text-muted-foreground pt-1">
          最近更新：第27章 再入古村？
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* 统计数据 */}
        <div className="flex items-center gap-6 text-base">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">27 章 / 6.6 万字</span>
          </div>
        </div>
        {/* 状态标签 */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusColorMap[work.status || "serializing"] || "default"}>
            {statusMap[work.status || "serializing"] || "未知"}
          </Badge>
          <Badge variant="outline">已签约</Badge>
          <Badge variant="secondary">征文作品</Badge>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" size="lg" asChild>
          <Link href={`/works/${work.id}/drafts`}>
            <Edit className="mr-2 h-5 w-5" />
            继续写作
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function WorkCardMenu({
  onDelete,
  isDeleting,
  work,
}: {
  onDelete: () => void;
  isDeleting?: boolean;
  work: Work;
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
          <Link href={`/chapters?workId=${work.id}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            章节管理
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/works/${work.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            编辑信息
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert(`导出作品： ${work.title}`)}>
          <Download className="mr-2 h-4 w-4" />
          导出作品
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "删除中..." : "删除作品"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
