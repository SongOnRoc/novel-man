import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, MoreVertical, Edit, Eye, ArrowUpDown } from "lucide-react";
import Link from "next/link";

import { Chapter } from "@/types/work";
import { mockVolumes } from "@/lib/mock/volumes-mock-data";

// 章节列表属性
interface ChapterListProps {
  workId: string;
  chapters: Chapter[];
  onDeleteChapter: (chapterId: string) => void;
  onUpdateStatus: (chapterId: string, status: "draft" | "published") => void;
}

// 章节列表组件
export function ChapterList({
  workId,
  chapters,
  onDeleteChapter,
  onUpdateStatus,
}: ChapterListProps) {
  // 按分卷ID对章节进行分组
  const chaptersByVolume = chapters.reduce<Record<string, Chapter[]>>(
    (acc, chapter) => {
      const volumeId = chapter.volumeId || "unclassified";
      if (!acc[volumeId]) {
        acc[volumeId] = [];
      }
      acc[volumeId].push(chapter);
      return acc;
    },
    {}
  );

  const getVolumeTitle = (volumeId: string) => {
    if (volumeId === "unclassified") return "未分卷";
    const volume = mockVolumes.find((v) => v.id === volumeId);
    return volume ? volume.title : "未知分卷";
  };

  const getStatusBadge = (status: Chapter["status"]) => {
    // ... (getStatusBadge function remains the same)
    switch (status) {
      case "draft":
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            草稿
          </span>
        );
      case "published":
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            已发布
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>章节列表</CardTitle>
          <CardDescription>管理您的章节，可按分卷查看。</CardDescription>
        </div>
        <Button asChild>
          <Link href={`/chapters/new?workId=${workId}`}>
            <FileText className="mr-2 h-4 w-4" />
            新建章节
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">暂无章节</h3>
            <p className="text-sm text-muted-foreground mt-1">
              点击"新建章节"按钮开始创作。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(chaptersByVolume).map(
              ([volumeId, volumeChapters]) => (
                <div key={volumeId} className="space-y-4">
                  <h3 className="text-lg font-semibold tracking-tight border-b pb-2">
                    {getVolumeTitle(volumeId)}
                  </h3>
                  {volumeChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between rounded-lg border p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{chapter.title}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{chapter.wordCount} 字</span>
                            <span>•</span>
                            <span>更新于 {chapter.updatedAt}</span>
                            <span>•</span>
                            {getStatusBadge(chapter.status)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/chapters/${chapter.id}/preview`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">预览</span>
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/chapters/${chapter.id}/edit`}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">编辑</span>
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {chapter.status === "draft" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  onUpdateStatus(chapter.id, "published")
                                }
                              >
                                发布章节
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  onUpdateStatus(chapter.id, "draft")
                                }
                              >
                                设为草稿
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => onDeleteChapter(chapter.id)}
                            >
                              删除章节
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          共 {chapters.length} 章节
        </div>
      </CardFooter>
    </Card>
  );
}
