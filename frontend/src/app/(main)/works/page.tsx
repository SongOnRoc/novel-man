"use client";

import { WorkCard } from "./components/WorkCard";
import { NewWorkButton } from "./components/NewWorkButton";
import { useWorks } from "@/hooks/useWorks";
import { Skeleton } from "@/components/ui/skeleton";

// 作品列表页面组件
export default function WorksPage() {
  const { works, isLoading, deleteWork } = useWorks();

  const handleDeleteWork = (workId: string) => {
    if (window.confirm("确定要删除这个作品吗？此操作不可撤销。")) {
      deleteWork(workId);
    }
  };

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
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {works.map((work) => (
              <WorkCard
                key={work.id}
                work={work}
                onDelete={() => handleDeleteWork(work.id)}
              />
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
        </>
      )}
    </div>
  );
}
