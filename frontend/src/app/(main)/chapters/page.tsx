"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChapterList } from "@/components/chapter/ChapterList";
import { WorkSelector } from "@/components/chapter/WorkSelector";
import { useWorks } from "@/hooks/work/useWorks";
import {
  useChapters,
  useDeleteChapter,
  useUpdateChapter,
} from "@/hooks/chapter/useChapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Work } from "@/types/work";
import { Chapter } from "@/types/chapter";

export default function ChaptersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: worksResponse, isLoading: isLoadingWorks } = useWorks({});
  const works = worksResponse?.data || [];

  const workId = searchParams.get("workId");
  const selectedWorkId = workId ? parseInt(workId, 10) : undefined;

  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapters({
    work_id: selectedWorkId,
  });
  const chapters = chaptersResponse?.data || [];

  const deleteChapterMutation = useDeleteChapter();
  const updateChapterMutation = useUpdateChapter();

  useEffect(() => {
    if (!isLoadingWorks && works.length > 0 && !selectedWorkId) {
      router.replace(`/chapters?workId=${works[0].id}`);
    }
  }, [works, isLoadingWorks, selectedWorkId, router]);

  const handleSelectWork = (work: Work | null) => {
    if (work) {
      router.push(`/chapters?workId=${work.id}`);
    }
  };

  const handleDeleteChapter = (chapterId: number) => {
    if (window.confirm("确定要删除这个章节吗？此操作不可撤销。")) {
      deleteChapterMutation.mutate(chapterId);
    }
  };

  const handleUpdateStatus = (
    chapterId: number,
    status: "draft" | "published",
  ) => {
    const action = status === "published" ? "发布" : "设为草稿";
    if (window.confirm(`确定要${action}这个章节吗？`)) {
      updateChapterMutation.mutate({ id: chapterId, data: { status } });
    }
  };

  const selectedWork = selectedWorkId
    ? works.find((w: Work) => w.id === selectedWorkId)
    : null;

  const renderContent = () => {
    if (isLoadingChapters || isLoadingWorks) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (!selectedWorkId) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">请选择一个作品</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            选择一个作品来管理其章节。
          </p>
        </div>
      );
    }

    if (chapters.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">没有章节</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            这个作品还没有任何章节。
          </p>
          <Button asChild>
            <Link href={`/chapters/new?workId=${selectedWorkId}`}>
              创建第一个章节
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <ChapterList
        chapters={chapters}
        volumes={selectedWork?.volumes || []}
        onDeleteChapter={handleDeleteChapter}
        onUpdateStatus={handleUpdateStatus}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">章节管理</h1>
          <p className="text-muted-foreground">
            管理您的作品章节，创建新章节或编辑现有章节。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingWorks ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : (
            <WorkSelector
              works={works}
              selectedWork={selectedWork || null}
              onSelectWork={handleSelectWork}
            />
          )}
          <Button asChild>
            <Link href={`/chapters/new?workId=${selectedWorkId}`}>
              新建章节
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/works">返回作品列表</Link>
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
