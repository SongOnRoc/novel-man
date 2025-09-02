import React from "react";
import { PlusCircle, BookOpen, FileText, PenTool } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 快速操作的类型
interface QuickAction {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant: "default" | "outline";
}

const quickActions: QuickAction[] = [
  {
    title: "创建新作品",
    icon: PlusCircle,
    href: "/works/new",
    variant: "default",
  },
  {
    title: "继续写作",
    icon: PenTool,
    href: "/chapters/latest",
    variant: "outline",
  },
  {
    title: "管理草稿",
    icon: FileText,
    href: "/drafts",
    variant: "outline",
  },
  {
    title: "浏览作品",
    icon: BookOpen,
    href: "/works",
    variant: "outline",
  },
];

export function QuickActions(): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
        <CardDescription>常用功能快速访问</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.title} variant={action.variant} asChild>
                <a href={action.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  {action.title}
                </a>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
