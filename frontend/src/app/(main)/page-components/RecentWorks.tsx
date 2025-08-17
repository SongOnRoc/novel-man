import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, BookOpen } from "lucide-react";

// 模拟作品数据的类型
interface Work {
  id: string;
  title: string;
  chapters: number;
  updatedAt: string;
}

// 模拟作品数据
const recentWorks: Work[] = [
  {
    id: "1",
    title: "修仙从种田开始",
    chapters: 23,
    updatedAt: "2023-09-20",
  },
  {
    id: "2",
    title: "都市之全能高手",
    chapters: 15,
    updatedAt: "2023-09-18",
  },
  {
    id: "3",
    title: "星际穿越之旅",
    chapters: 7,
    updatedAt: "2023-09-15",
  },
];

// 最近作品组件
export function RecentWorks() {
  // 最近作品：放置于布局的左侧主列，列跨度由父级容器控制
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>最近作品</CardTitle>
        <CardDescription>您最近更新的作品列表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentWorks.map((work) => (
            <div
              key={work.id}
              className="flex items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0 hover:bg-accent/40 rounded-md px-2 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="h-10 w-10 rounded-md border p-2 text-primary" />
                <div>
                  <div className="font-semibold">{work.title}</div>
                  <div className="text-sm text-muted-foreground">
                    <span>{work.chapters} 章节</span>
                    <span className="mx-2">•</span>
                    <span>更新于 {work.updatedAt}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">继续编辑</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
