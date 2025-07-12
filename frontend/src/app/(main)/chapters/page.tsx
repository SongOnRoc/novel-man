"use client";

import { useState } from "react";
import { ChapterList } from "./components/ChapterList";
import { WorkSelector } from "./components/WorkSelector";
import { mockWorks } from "@/lib/mock/works-mock-data";
import { mockChapters } from "@/lib/mock/chapters-mock-data";
import { Work } from "@/types/work";
import { ChapterDraft } from "@/types/outline";

// 章节管理页面组件
export default function ChaptersPage() {
  // 选中的作品状态
  const [selectedWork, setSelectedWork] = useState<Work | null>(
    mockWorks[0] || null
  );

  // 当前作品的章节
  const currentChapters: ChapterDraft[] = selectedWork
    ? mockChapters.filter((chapter) => chapter.workId === selectedWork.id)
    : [];

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
        <WorkSelector
          works={mockWorks}
          selectedWork={selectedWork}
          onSelectWork={setSelectedWork}
        />
      </div>

      {/* 章节列表 */}
      {selectedWork ? (
        <ChapterList workId={selectedWork.id} chapters={currentChapters} />
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
