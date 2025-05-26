"use client";

import { Button } from "@/components/tailwind/ui/button";
import { BookOpen, Clock, Eye, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Work {
  id: string;
  title: string;
  author: string;
  wordCount: number;
  chapterCount: number;
  status: "连载中" | "已完结" | "暂停";
  lastUpdated: string;
  cover?: string;
  category: string;
}

export default function WorksPage() {
  const router = useRouter();
  const [works, setWorks] = useState<Work[]>([
    {
      id: "1",
      title: "永生网络",
      author: "门前快石子路",
      wordCount: 52376,
      chapterCount: 21,
      status: "连载中",
      lastUpdated: "第21章 全票通过却被打飞",
      category: "征文作品",
    },
    {
      id: "2",
      title: "星河之旅",
      author: "门前快石子路",
      wordCount: 15420,
      chapterCount: 8,
      status: "暂停",
      lastUpdated: "第8章 星际迷航",
      category: "科幻",
    },
  ]);

  const handleWorkClick = (workId: string) => {
    router.push(`/manage?workId=${workId}`);
  };

  const handleCreateWork = () => {
    // TODO: 创建新作品的逻辑
    console.log("Create new work");
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-xl font-bold">我的作品</h1>
          <Button onClick={handleCreateWork} size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            新建作品
          </Button>
        </div>
      </header>

      {/* Works Grid */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((work) => (
            <div
              key={work.id}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleWorkClick(work.id)}
            >
              {/* Cover */}
              <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {work.cover ? (
                  <img src={work.cover} alt={work.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <div className="text-sm font-medium text-gray-600">{work.title}</div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold mb-1 truncate">{work.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{work.author}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>{work.wordCount.toLocaleString()}字</span>
                  <span>{work.chapterCount}章</span>
                  <span
                    className={`px-2 py-1 rounded-full ${
                      work.status === "连载中"
                        ? "bg-green-100 text-green-700"
                        : work.status === "已完结"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {work.status}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" />
                    <span>最近更新：{work.lastUpdated}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{work.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {works.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">还没有作品</h3>
            <p className="text-gray-500 mb-4">开始创作您的第一部作品吧</p>
            <Button onClick={handleCreateWork}>
              <Plus className="h-4 w-4 mr-2" />
              新建作品
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
