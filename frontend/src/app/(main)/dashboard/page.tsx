import React from "react";
import { BookText, BookOpen, FileText, PenTool } from "lucide-react";

import { QuickActions } from "./components/QuickActions";
import { RecentWorks } from "./components/RecentWorks";
import { StatsCard } from "./components/StatsCard";

// 仪表盘页面（由原根页面迁移而来）
export default function DashboardPage(): React.ReactElement {
  return (
    <div className="flex flex-col gap-8">
      {/* 顶部标题区 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来，作家</h1>
        <p className="text-muted-foreground">
          这是您的小说创作管理系统，查看您的写作概览和最近更新。
        </p>
      </div>

      {/* 快速操作 */}
      <QuickActions />

      {/* 主内容区：数据概览 + 核心内容 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 左侧：统计卡片 */}
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-2 lg:grid-cols-2 items-start">
          <StatsCard
            title="总作品数"
            value="3"
            description="包含所有状态的作品"
            icon={<BookOpen className="h-8 w-8" />}
            className="text-primary"
          />
          <StatsCard
            title="总章节数"
            value="45"
            description="已完成的章节总数"
            icon={<BookText className="h-8 w-8" />}
            className="text-green-500"
          />
          <StatsCard
            title="草稿箱"
            value="7"
            description="待处理的草稿数量"
            icon={<FileText className="h-8 w-8" />}
            className="text-orange-500"
            highlight
          />
          <StatsCard
            title="总字数"
            value="125,430"
            description="所有作品的总字数"
            icon={<PenTool className="h-8 w-8" />}
            className="text-blue-500"
          />
        </div>

        {/* 右侧：最近作品 */}
        <div className="lg:col-span-1">
          <RecentWorks />
        </div>
      </div>
    </div>
  );
}