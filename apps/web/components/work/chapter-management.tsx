"use client";

import { Button } from "@/components/tailwind/ui/button";
import { ChevronDown, Edit2, Eye, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  publishTime: string;
  status: "已发布" | "草稿";
  readCount: number;
  volume: string;
}

interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
  isExpanded: boolean;
}

interface ChapterManagementProps {
  showVolumeGrouping?: boolean;
  showNewChapterButton?: boolean;
  compact?: boolean;
}

export function ChapterManagement({
  showVolumeGrouping = true,
  showNewChapterButton = true,
  compact = false,
}: ChapterManagementProps) {
  const [volumes, setVolumes] = useState<Volume[]>([
    {
      id: "1",
      title: "第一卷：初见",
      isExpanded: true,
      chapters: [
        {
          id: "21",
          title: "第21章 全票通过却被打飞",
          wordCount: 2513,
          publishTime: "05-17 15:47:28",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
        {
          id: "20",
          title: "第20章 我们是老仙女",
          wordCount: 2523,
          publishTime: "05-02 18:12:52",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
        {
          id: "19",
          title: "第19章 票型三比零",
          wordCount: 2092,
          publishTime: "04-24 13:55:23",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
        {
          id: "18",
          title: "第18章 古村",
          wordCount: 2441,
          publishTime: "04-21 12:59:51",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
        {
          id: "17",
          title: "第17章 初见永生网络",
          wordCount: 2138,
          publishTime: "04-13 02:04:14",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
        {
          id: "16",
          title: "第16章 两包辣条",
          wordCount: 2996,
          publishTime: "03-30 14:23:35",
          status: "已发布",
          readCount: 0,
          volume: "第一卷：初见",
        },
      ],
    },
  ]);

  const toggleVolume = (volumeId: string) => {
    setVolumes(
      volumes.map((volume) => (volume.id === volumeId ? { ...volume, isExpanded: !volume.isExpanded } : volume)),
    );
  };

  const handleEditChapter = (chapterId: string) => {
    // TODO: 跳转到编辑页面
    console.log("Edit chapter:", chapterId);
  };

  const handleViewChapter = (chapterId: string) => {
    // TODO: 跳转到阅读页面
    console.log("View chapter:", chapterId);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (confirm("确定要删除这一章吗？")) {
      // TODO: 实现删除逻辑
      console.log("Delete chapter:", chapterId);
    }
  };

  // 如果不显示分卷分组，则平铺所有章节
  const allChapters = volumes.flatMap((volume) => volume.chapters);

  const renderChapterItem = (chapter: Chapter) => (
    <div key={chapter.id} className={`${compact ? "p-3" : "p-4"} hover:bg-muted/20 transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-medium ${compact ? "text-sm" : ""}`}>{chapter.title}</h4>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                chapter.status === "已发布" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {chapter.status}
            </span>
          </div>
          <div className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
            {showVolumeGrouping ? `${chapter.volume} | ` : ""}
            {chapter.wordCount}字 | {chapter.publishTime} | 读者纠错 {chapter.readCount} 处
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditChapter(chapter.id)}
            className={`${compact ? "h-7 w-7" : "h-8 w-8"} p-0`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewChapter(chapter.id)}
            className={`${compact ? "h-7 w-7" : "h-8 w-8"} p-0`}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteChapter(chapter.id)}
            className={`${compact ? "h-7 w-7" : "h-8 w-8"} p-0 text-destructive hover:text-destructive`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={compact ? "p-2" : "p-4"}>
      {/* 顶部操作栏 */}
      {showNewChapterButton && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">倒序</span>
            <span className="text-sm text-muted-foreground">筛选</span>
          </div>
          <Button size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            新建章节
          </Button>
        </div>
      )}

      {/* 章节列表 */}
      <div className="space-y-4">
        {showVolumeGrouping ? (
          // 分卷显示
          volumes.map((volume) => (
            <div key={volume.id} className="border rounded-lg overflow-hidden">
              {/* 分卷标题 */}
              <button
                onClick={() => toggleVolume(volume.id)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <h3 className="font-medium">{volume.title}</h3>
                <ChevronDown className={`h-4 w-4 transition-transform ${volume.isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* 章节列表 */}
              {volume.isExpanded && <div className="divide-y">{volume.chapters.map(renderChapterItem)}</div>}
            </div>
          ))
        ) : (
          // 平铺显示
          <div className="divide-y border rounded-lg">{allChapters.map(renderChapterItem)}</div>
        )}
      </div>
    </div>
  );
}
