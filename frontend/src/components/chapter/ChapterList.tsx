import { useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, MoreVertical, Edit, Eye, ArrowUp, ArrowDown, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedVolume, setSelectedVolume] = useState<string>("all");

  const filteredAndSortedChapters = useMemo(() => {
    let filtered = chapters;

    if (selectedVolume !== "all") {
      filtered = filtered.filter(
        (chapter) => (chapter.volumeId || "unclassified") === selectedVolume
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((chapter) =>
        chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.order - b.order;
      } else {
        return b.order - a.order;
      }
    });

    return sorted;
  }, [chapters, searchTerm, sortOrder, selectedVolume]);

  const chaptersByVolume = filteredAndSortedChapters.reduce<
    Record<string, Chapter[]>
  >((acc, chapter) => {
    const volumeId = chapter.volumeId || "unclassified";
    if (!acc[volumeId]) {
      acc[volumeId] = [];
    }
    acc[volumeId].push(chapter);
    return acc;
  }, {});

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
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>章节列表</CardTitle>
            <CardDescription>管理您的章节，可按分卷查看。</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索章节标题..."
                className="w-full rounded-lg bg-background pl-8 sm:w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={selectedVolume}
              onValueChange={setSelectedVolume}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="筛选分卷" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">所有分卷</SelectItem>
                {mockVolumes.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.title}
                  </SelectItem>
                ))}
                <SelectItem value="unclassified">未分卷</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAndSortedChapters.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">未找到匹配的章节</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              请尝试调整搜索或筛选条件。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(chaptersByVolume).map(
              ([volumeId, volumeChapters]) => (
                <div key={volumeId} className="space-y-4">
                  <h3 className="border-b pb-2 text-lg font-semibold tracking-tight">
                    {getVolumeTitle(volumeId)}
                  </h3>
                  {volumeChapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className="flex items-center justify-between rounded-lg border p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground">
                          {chapter.order}
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
          共 {filteredAndSortedChapters.length} / {chapters.length} 章节
        </div>
      </CardFooter>
    </Card>
  );
}
