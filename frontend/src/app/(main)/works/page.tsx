import { WorkCard } from "./components/WorkCard";
import { Work } from "@/types/work";
import { NewWorkButton } from "./components/NewWorkButton";

import { mockWorks as works } from "@/lib/mock/works-mock-data";

// 作品列表页面组件
export default function WorksPage() {
  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的作品</h1>
          <p className="text-muted-foreground">
            管理您的所有创作作品，继续您的创作之旅。
          </p>
        </div>
        <NewWorkButton />
      </div>

      {/* 作品列表 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>

      {/* 当没有作品时显示的内容 */}
      {works.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">暂无作品</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            您还没有创建任何作品，点击下方按钮开始您的创作之旅。
          </p>
          <NewWorkButton />
        </div>
      )}
    </div>
  );
}
