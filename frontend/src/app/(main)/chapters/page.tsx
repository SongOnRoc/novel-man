"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChapterList } from "@/components/chapter/ChapterList";
import { WorkSelector } from "@/components/chapter/WorkSelector";
import { useWorks } from "@/hooks/work/useWorks";
import { useChapters } from "@/hooks/useChapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Work } from "@/types/work";

export default function ChaptersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: worksResponse, isLoading: isLoadingWorks } = useWorks();
  const works = worksResponse?.data || [];

  const workId = searchParams.get("workId") || undefined;
  const selectedWork = workId ? works.find(w => w.id === Number(workId)) : null;

  useEffect(() => {
    if (!isLoadingWorks && works.length > 0 && !workId) {
      router.replace(`/chapters?workId=${works[0].id}`);
    }
  }, [works, isLoadingWorks, workId, router]);

  const {
    chapters,
    isLoading: isLoadingChapters,
    deleteChapter,
    updateChapterStatus,
  } = useChapters(workId);

  const handleSelectWork = (work: Work | null) => {
    if (work) {
      router.push(`/chapters?workId=${work.id}`);
    }
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (window.confirm("确定要删除这个章节吗？此操作不可撤销。")) {
      deleteChapter(chapterId);
    }
  };

  const handleUpdateStatus = (
    chapterId: string,
    status: "draft" | "published"
  ) => {
    const action = status === "published" ? "发布" : "设为草稿";
    if (window.confirm(`确定要${action}这个章节吗？`)) {
      updateChapterStatus(chapterId, status);
    }
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
        {isLoadingWorks ? (
          <Skeleton className="h-10 w-[200px]" />
        ) : (
          <WorkSelector
            works={works}
            selectedWork={selectedWork || null}
            onSelectWork={handleSelectWork}
          />
        )}
      </div>

      {isLoadingChapters || isLoadingWorks ? (
        <Skeleton className="h-[400px] w-full" />
      ) : workId ? (
        <ChapterList
          workId={workId}
          chapters={chapters}
          onDeleteChapter={handleDeleteChapter}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">请选择一个作品</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            选择一个作品来管理其章节。
          </p>
        </div>
      )}
    </div>
  );
}
