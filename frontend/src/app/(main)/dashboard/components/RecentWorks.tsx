"use client";

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
import { WorkForClient } from "@/lib/services/work.service";
import { formatDate } from "@/lib/utils";

interface RecentWorksProps {
  recentWorks: WorkForClient[];
}

export function RecentWorks({ recentWorks }: RecentWorksProps): React.ReactElement {
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
                    <span>更新于 {formatDate(work.updatedAt)}</span>
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
