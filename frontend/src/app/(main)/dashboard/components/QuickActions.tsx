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
              <Button
                key={action.title}
                variant={action.variant}
                asChild
                disabled={action.disabled}
              >
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
