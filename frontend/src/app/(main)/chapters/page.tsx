"use client";

import { useState } from "react";
import { ChapterList, Chapter } from "./components/ChapterList";
import { WorkSelector } from "./components/WorkSelector";

// 作品类型定义
interface Work {
  id: string;
  title: string;
}

// 模拟作品数据
const works: Work[] = [
  { id: "1", title: "修仙从种田开始" },
  { id: "2", title: "都市之全能高手" },
  { id: "3", title: "星际穿越之旅" },
];

// 模拟章节数据
const chaptersData: Record<string, Chapter[]> = {
  "1": [
    {
      id: "1-1",
      title: "第一章 意外得到仙家传承",
      wordCount: 3500,
      status: "published",
      updatedAt: "2023-09-15",
      order: 1,
      volumeId: "v1",
      volumeTitle: "第一卷：仙农初成",
    },
    {
      id: "1-2",
      title: "第二章 初试灵力",
      wordCount: 3200,
      status: "published",
      updatedAt: "2023-09-16",
      order: 2,
      volumeId: "v1",
      volumeTitle: "第一卷：仙农初成",
    },
    {
      id: "1-3",
      title: "第三章 神秘的种子",
      wordCount: 3800,
      status: "draft",
      updatedAt: "2023-09-18",
      order: 3,
      volumeId: "v2",
      volumeTitle: "第二卷：仙农再起",
    },
  ],
  "2": [
    {
      id: "2-1",
      title: "第一章 回归都市",
      wordCount: 4200,
      status: "published",
      updatedAt: "2023-09-10",
      order: 1,
      volumeId: "v1",
      volumeTitle: "第一卷：都市风云",
    },
    {
      id: "2-2",
      title: "第二章 初露锋芒",
      wordCount: 3900,
      status: "published",
      updatedAt: "2023-09-12",
      order: 2,
      volumeId: "v1",
      volumeTitle: "第一卷：都市风云",
    },
  ],
  "3": [],
};

// 章节管理页面组件
export default function ChaptersPage() {
  // 选中的作品状态
  const [selectedWork, setSelectedWork] = useState<Work | null>(works[0]);

  // 当前作品的章节
  const currentChapters = selectedWork
    ? chaptersData[selectedWork.id] || []
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
          works={works}
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
