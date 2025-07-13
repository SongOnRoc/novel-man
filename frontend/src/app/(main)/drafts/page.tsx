"use client";

import { useState } from "react";
import { DraftCard } from "./components/DraftCard";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockDrafts } from "@/lib/mock/chapters-mock-data";
import { Draft } from "@/types/work";

// 草稿类型
type DraftType = "all" | "chapter" | "note";

// 草稿箱页面组件
export default function DraftsPage() {
  // 当前选中的草稿类型
  const [draftType, setDraftType] = useState<DraftType>("all");

  // 根据类型筛选草稿
  const filteredDrafts = mockDrafts.filter((draft: Draft) => {
    if (draftType === "all") return true;
    // 'chapter' 类型草稿现在被定义为有关联 workId 的草稿
    if (draftType === "chapter") return !!draft.workId;
    // 'note' 类型草稿被定义为没有关联 workId 的草稿
    if (draftType === "note") return !draft.workId;
    return true;
  });

  // 处理删除草稿
  const handleDelete = (id: string) => {
    // 这里将来会调用API删除草稿
    console.log("删除草稿:", id);
    alert(`删除草稿 ${id}`);
  };

  // 处理转换为正式章节
  const handleConvert = (id: string) => {
    // 这里将来会调用API转换草稿为正式章节
    console.log("转换草稿为正式章节:", id);
    alert(`转换草稿 ${id} 为正式章节`);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">草稿箱</h1>
          <p className="text-muted-foreground">
            管理您的草稿，将草稿转换为正式章节或继续编辑。
          </p>
        </div>
        <Button asChild>
          <Link href="/drafts/new">
            <FilePlus className="mr-2 h-4 w-4" />
            新建草稿
          </Link>
        </Button>
      </div>

      {/* 草稿类型选项卡 */}
      <Tabs
        defaultValue="all"
        value={draftType}
        onValueChange={(value) => setDraftType(value as DraftType)}
      >
        <TabsList>
          <TabsTrigger value="all">全部草稿</TabsTrigger>
          <TabsTrigger value="chapter">章节草稿</TabsTrigger>
          <TabsTrigger value="note">笔记草稿</TabsTrigger>
        </TabsList>
        <TabsContent value={draftType}>
          {filteredDrafts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDrafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onDelete={handleDelete}
                  onConvert={handleConvert}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h2 className="text-2xl font-semibold">暂无草稿</h2>
              <p className="mb-4 mt-2 text-muted-foreground">
                您还没有创建任何草稿，点击下方按钮开始创作。
              </p>
              <Button asChild>
                <Link href="/drafts/new">
                  <FilePlus className="mr-2 h-4 w-4" />
                  新建草稿
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
