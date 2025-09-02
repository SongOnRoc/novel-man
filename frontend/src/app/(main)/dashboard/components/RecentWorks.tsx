import React from "react";
import { BookOpen, Edit } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Work {
  id: string;
  title: string;
  chapters: number;
  updatedAt: string;
}

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

export function RecentWorks(): React.ReactElement {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>最近作品</CardTitle>
        <CardDescription>您最近更新的作品列表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentWorks.map((work) => (
            <a
              key={work.id}
              href={`/works/${work.id}`}
              className="group flex items-center justify-between rounded-lg p-3 transition-all duration-300 hover:bg-accent/50 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
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
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
