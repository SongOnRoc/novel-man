import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlusCircle, BookOpen, FileText, PenTool } from "lucide-react";

// 快速操作的类型
interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

// 快速操作列表
const quickActions: QuickAction[] = [
  {
    title: "创建新作品",
    description: "开始一个全新的创作之旅",
    icon: <PlusCircle className="h-5 w-5" />,
    href: "/works/new",
  },
  {
    title: "继续写作",
    description: "回到上次的创作内容",
    icon: <PenTool className="h-5 w-5" />,
    href: "/chapters/latest",
  },
  {
    title: "管理草稿",
    description: "查看和整理您的草稿",
    icon: <FileText className="h-5 w-5" />,
    href: "/drafts",
  },
  {
    title: "浏览作品",
    description: "查看您的所有作品",
    icon: <BookOpen className="h-5 w-5" />,
    href: "/works",
  },
];

// 快速操作组件
export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>快速操作</CardTitle>
        <CardDescription>常用功能快速访问</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-auto justify-start gap-3 p-4 text-left"
              asChild
            >
              <a href={action.href} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {action.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
