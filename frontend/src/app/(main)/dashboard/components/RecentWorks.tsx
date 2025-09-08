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
    <Card className="h-full glass-card">
      <CardHeader>
        <CardTitle className="text-gradient-accent">最近作品</CardTitle>
        <CardDescription>您最近更新的作品列表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentWorks.map((work, index) => (
            <a
              key={work.id}
              href={`/works/${work.id}`}
              className="group flex items-center justify-between rounded-xl p-4 transition-all duration-300 hover:bg-primary/5 hover:shadow-md hover:-translate-y-1 border border-transparent hover:border-primary/20 animate-fadeInUp"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800 p-2">
                  <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-300" />
                </div>
                <div>
                  <div className="font-semibold text-primary">{work.title}</div>
                  <div className="text-sm text-muted-foreground">
                    <span>更新于 {formatDate(work.updatedAt)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 transition-all duration-300 group-hover:opacity-100 hover:bg-primary/10 hover:text-primary"
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
