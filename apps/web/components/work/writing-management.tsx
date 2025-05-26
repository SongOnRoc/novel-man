"use client";

import { useState } from "react";
import { WritingAssistant } from "./writing-assistant";
import { ChapterManagement } from "./chapter-management";

type ManagementTab = "assistant" | "chapters" | "goals" | "inspiration";

export function WritingManagement() {
  const [activeTab, setActiveTab] = useState<ManagementTab>("assistant");

  const renderTabContent = () => {
    switch (activeTab) {
      case "assistant":
        return <WritingAssistant />;
      case "chapters":
        return <ChapterManagement showVolumeGrouping={true} showNewChapterButton={true} />;
      case "goals":
        return <div className="p-6">写作目标功能即将上线...</div>;
      case "inspiration":
        return <div className="p-6">创意灵感功能即将上线...</div>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">写作管理</h1>

      <div className="flex border-b mb-6">
        <TabButton active={activeTab === "assistant"} onClick={() => setActiveTab("assistant")}>
          写作助手
        </TabButton>
        <TabButton active={activeTab === "chapters"} onClick={() => setActiveTab("chapters")}>
          章节管理
        </TabButton>
        <TabButton active={activeTab === "goals"} onClick={() => setActiveTab("goals")}>
          写作目标
        </TabButton>
        <TabButton active={activeTab === "inspiration"} onClick={() => setActiveTab("inspiration")}>
          创意灵感
        </TabButton>
      </div>

      <div className="bg-white rounded-lg shadow">{renderTabContent()}</div>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      className={`px-4 py-2 font-medium ${
        active ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:text-gray-700"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
