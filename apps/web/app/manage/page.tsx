"use client";

import { Button } from "@/components/tailwind/ui/button";
import { ChapterManagement } from "@/components/work/chapter-management";
import { WorkSettings } from "@/components/work/work-settings";
import { WritingManagement } from "@/components/work/writing-management";
import { BookOpen, ChevronLeft, Edit3, Settings } from "lucide-react";
import { useState } from "react";

type TabType = "writing" | "chapters" | "settings";

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<TabType>("writing");

  const tabs = [
    { id: "writing" as TabType, label: "写作管理", icon: Edit3 },
    { id: "chapters" as TabType, label: "章节管理", icon: BookOpen },
    { id: "settings" as TabType, label: "作品管理", icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "writing":
        return <WritingManagement />;
      case "chapters":
        return <ChapterManagement />;
      case "settings":
        return <WorkSettings />;
      default:
        return <WritingManagement />;
    }
  };

  const navigateToWorks = () => {
    window.location.href = "/works";
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={navigateToWorks}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-semibold">永生网络</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Work Info */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs font-medium">
              永生网络
            </div>
            <div>
              <h2 className="font-medium">永生网络</h2>
              <div className="text-sm text-muted-foreground">5.2万字 | 21章 | 连载中 · 已签约</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">最近更新：第21章 全票通过却被打飞</div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Content */}
      <main className="flex-1 overflow-y-auto">{renderTabContent()}</main>
    </div>
  );
}
