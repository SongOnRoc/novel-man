"use client";

import { Button } from "@/components/tailwind/ui/button";
import { ChapterManagement } from "@/components/work/chapter-management";
import { ChevronDown, ChevronLeft, Edit2, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Draft {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  updatedAt: string;
  volume: string;
}

type TabType = "chapters" | "drafts";

export default function DraftsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("drafts");
  const [drafts, setDrafts] = useState<Draft[]>([]);

  useEffect(() => {
    // 从localStorage加载草稿
    const savedDrafts = JSON.parse(localStorage.getItem("drafts") || "[]");
    // 默认草稿数据，如果localStorage为空
    const defaultDrafts = [
      {
        id: "1",
        title: "第一章 未命名章稿",
        content: "",
        wordCount: 0,
        updatedAt: "36秒前",
        volume: "第一卷：初见",
      },
      {
        id: "2",
        title: "第22章 人间仙境",
        content: "这是一个关于修仙的故事...",
        wordCount: 2610,
        updatedAt: "05-19 03:16:59",
        volume: "第一卷：初见",
      },
      {
        id: "3",
        title: "第23章 票型三比零",
        content: "",
        wordCount: 0,
        updatedAt: "05-18 21:48:44",
        volume: "第一卷：初见",
      },
      {
        id: "4",
        title: "明天",
        content: "简短的灵感记录",
        wordCount: 12,
        updatedAt: "昨天",
        volume: "第一卷：初见",
      },
    ];

    setDrafts(savedDrafts.length > 0 ? savedDrafts : defaultDrafts);

    // 检查URL参数设置默认标签页
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (tabParam === "drafts" || tabParam === "chapters") {
      setActiveTab(tabParam);
    }
  }, []);

  const [selectedVolume, _setSelectedVolume] = useState("第一卷：初见");

  const handleEditDraft = (draft: Draft) => {
    // 将草稿内容存储到localStorage，然后跳转到编辑页面
    localStorage.setItem("novel-title", draft.title);
    localStorage.setItem("novel-content", draft.content);
    localStorage.setItem("novel-text-length", draft.wordCount.toString());
    localStorage.setItem("current-draft-id", draft.id);

    router.push("/");
  };

  const handleDeleteDraft = (draftId: string) => {
    if (confirm("确定要删除这个草稿吗？")) {
      const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);
      setDrafts(updatedDrafts);
      // 同时更新localStorage
      localStorage.setItem("drafts", JSON.stringify(updatedDrafts));
    }
  };

  const renderDrafts = () => (
    <div className="divide-y">
      {drafts.map((draft) => (
        <div
          key={draft.id}
          className="p-4 hover:bg-muted/20 transition-colors cursor-pointer"
          onClick={() => handleEditDraft(draft)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleEditDraft(draft);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`编辑草稿: ${draft.title}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-medium mb-1">{draft.title}</h3>
              <div className="text-sm text-muted-foreground">{draft.wordCount}字</div>
              <div className="text-xs text-muted-foreground mt-1">{draft.updatedAt}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditDraft(draft);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteDraft(draft.id);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/manage")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <h1 className="text-lg font-semibold">永生网络</h1>

          <span className="text-sm text-muted-foreground">更多</span>
        </div>

        {/* Work Info */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs font-medium">
              永生网络
            </div>
            <div>
              <h2 className="font-medium">永生网络</h2>
              <div className="text-sm text-muted-foreground">连载中 · 已签约</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">52,376</div>
            <div className="text-sm text-muted-foreground">小说字数</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold">21</div>
            <div className="text-sm text-muted-foreground">已更新章节数</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            type="button"
            onClick={() => setActiveTab("chapters")}
            className={`flex-1 flex items-center justify-center py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "chapters"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            章节管理
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("drafts")}
            className={`flex-1 flex items-center justify-center py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "drafts"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            草稿箱
          </button>
        </div>
      </header>

      {/* Volume Selector - Only show for chapters tab */}
      {activeTab === "chapters" && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <button type="button" className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{selectedVolume}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4">
            <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>倒序</span>
            </button>
            <button type="button" className="flex items-center gap-1 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>筛选</span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "chapters" ? (
          <ChapterManagement showVolumeGrouping={true} showNewChapterButton={false} compact={false} />
        ) : (
          renderDrafts()
        )}
      </main>

      {/* Footer */}
      <footer className="border-t p-4 bg-background">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
            <Edit2 className="h-6 w-6 text-white" />
          </div>
        </div>
      </footer>
    </div>
  );
}
