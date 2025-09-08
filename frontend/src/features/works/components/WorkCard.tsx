import {
  BookOpen,
  MoreVertical,
  FileText,
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
import { useDraftList } from "@/hooks/draft/useDraftService";
import { WorkForClient } from "@/lib/services/work.service";
import { formatDate, formatWordCount } from "@/lib/utils";

interface WorkCardProps {
  work: WorkForClient;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function WorkCard({
  work,
  onDelete,
  isDeleting = false,
}: WorkCardProps) {
  const router = useRouter();
  const { data: draftsResponse } = useDraftList({ workId: work.id });

  const latestDraft = useMemo(() => {
    if (!draftsResponse?.data || draftsResponse.data.length === 0) {
      return null;
    }
    // Sort drafts by updatedAt in descending order to find the most recent one.
    const sortedDrafts = [...draftsResponse.data].sort(
      (a, b) =>
        new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
    );
    return sortedDrafts[0];
  }, [draftsResponse]);

  const handleContinueWriting = () => {
    if (latestDraft) {
      router.push(`/drafts/${latestDraft.id}/edit`);
    } else {
      router.push(`/works/${work.id}/chapters`);
    }
  };

  const statusMap: { [key: string]: string } = {
    serializing: "连载中",
    completed: "已完结",
    on_hiatus: "断更中",
  };

  const statusColorMap: {
    [key: string]: "default" | "destructive" | "success";
  } = {
    serializing: "default",
    completed: "success",
    on_hiatus: "destructive",
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
      {/* 封面占位符 */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        <img
          src={
            work.coverImageUrl
              ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${work.coverImageUrl}`
              : `https://fakeimg.pl/400x225/14b8a6/ffffff?text=${encodeURIComponent(
                  work.title!
                )}&font=noto`
          }
          alt={work.title!}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/works/${work.id}`}>
            <h3 className="text-xl font-bold hover:text-primary transition-colors duration-200">{work.title}</h3>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          最近更新：{formatDate(work.updatedAt)}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* 统计数据 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">
              {work.totalChapterCount || 0} 章
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <span className="font-medium">
              {formatWordCount(work.totalWordCount || 0)} 字
            </span>
          </div>
        </div>
        {/* 状态标签 */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              statusColorMap[work.status as keyof typeof statusColorMap] ||
              "default"
            }
            className="rounded-full px-3 py-1 text-xs"
          >
            {statusMap[work.status!] || "未知"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
          size="lg"
          onClick={handleContinueWriting}
        >
          <Edit className="mr-2 h-4 w-4" />
          继续写作
        </Button>
      </CardFooter>
    </Card>
  );
}
