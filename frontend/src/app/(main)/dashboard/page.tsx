import { BookText, BookOpen, FileText, PenTool } from "lucide-react";
import { StatsCard } from "../page-components/StatsCard";
import { RecentWorks } from "../page-components/RecentWorks";
import { QuickActions } from "../page-components/QuickActions";

// 仪表盘页面（由原根页面迁移而来）
export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 lg:px-8 space-y-8">
      {/* 顶部标题区：一级标题 + 辅助说明 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">欢迎回来，作家</h1>
        <p className="text-muted-foreground">
          这是您的小说创作管理系统，查看您的写作概览和最近更新。
        </p>
      </div>

      {/* 统计卡片：响应式 2/4 栅格，卡片间距放大以增强呼吸感 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="总作品数"
          value="3"
          description="包含所有状态的作品"
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="总章节数"
          value="45"
          description="已完成的章节总数"
          icon={<BookText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="草稿箱"
          value="7"
          description="待处理的草稿数量"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="总字数"
          value="125,430"
          description="所有作品的总字数"
          icon={<PenTool className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* 主内容区：左 2 列（最近作品），右 1 列（快速操作） */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <RecentWorks />
        </div>
        <div className="md:col-span-1">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}