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
import { WorkForClient } from "@/lib/services/work.service";
import { DraftForClient } from "@/lib/services/draft.service";

interface QuickAction {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant: "default" | "outline";
  disabled?: boolean;
}

interface QuickActionsProps {
  latestWork?: WorkForClient;
  latestDraft?: DraftForClient;
}

export function QuickActions({
  latestWork,
  latestDraft,
}: QuickActionsProps): React.ReactElement {
  const quickActions: QuickAction[] = [
    {
      title: "继续写作",
      icon: PenTool,
      href: latestDraft ? `/drafts/${latestDraft.id}/edit` : "#",
      variant: "default",
      disabled: !latestDraft,
    },
    {
      title: "最新章节",
      icon: FileText,
      href: latestWork ? `/works/${latestWork.id}/chapters` : "#",
      variant: "outline",
      disabled: !latestWork,
    },
    {
      title: "创建新作品",
      icon: PlusCircle,
      href: "/works/new",
      variant: "outline",
    },
    {
      title: "浏览作品",
      icon: BookOpen,
      href: "/works",
      variant: "outline",
    },
  ];

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-gradient-primary">快速操作</CardTitle>
        <CardDescription>常用功能快速访问</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                asChild
                disabled={action.disabled}
                className="h-auto flex-col py-4 px-3 gap-2 animate-fadeInUp"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <a href={action.href} className="flex flex-col items-center justify-center">
                  <Icon className="h-6 w-6 mb-1" />
                  <span className="text-xs">{action.title}</span>
                </a>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
