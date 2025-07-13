"use client";

import { useState, useEffect } from "react";
import { ChapterList } from "./components/ChapterList";
import { WorkSelector } from "./components/WorkSelector";
import { useWorks } from "@/hooks/useWorks";
import { useChapters } from "@/hooks/useChapters";
import { Work } from "@/types/work";
import { Skeleton } from "@/components/ui/skeleton";

// 章节管理页面组件
export default function ChaptersPage() {
  const { works, isLoading: isLoadingWorks } = useWorks();
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  // 当作品数据加载后，设置默认选中的作品
  useEffect(() => {
    if (works.length > 0 && !selectedWork) {
      setSelectedWork(works[0]);
    }
  }, [works, selectedWork]);

  const {
    chapters,
    isLoading: isLoadingChapters,
    deleteChapter,
    updateChapterStatus,
  } = useChapters(selectedWork?.id);

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
      {/* 页面标题和作品选择器 */}
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
            selectedWork={selectedWork}
            onSelectWork={setSelectedWork}
          />
        )}
      </div>

      {/* 章节列表 */}
      {isLoadingChapters ? (
        <Skeleton className="h-[400px] w-full" />
      ) : selectedWork ? (
        <ChapterList
          workId={selectedWork.id}
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
