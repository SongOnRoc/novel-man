"use client";

import { useState } from "react";
import { Draft, DraftCard } from "./components/DraftCard";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 模拟草稿数据
const draftData: Draft[] = [
  {
    id: "1",
    title: "第四章 灵田初成",
    content:
      "经过三天三夜的不懈努力，李青终于将灵力注入那片荒地，一股清新的灵气开始在土地中流转。他惊喜地发现，原本贫瘠的土地正在以肉眼可见的速度变得肥沃起来...",
    workTitle: "修仙从种田开始",
    workId: "1",
    chapterId: undefined,
    createdAt: "2023-09-19",
    updatedAt: "2023-09-20",
    wordCount: 2100,
  },
  {
    id: "2",
    title: "第三章 商业联姻",
    content:
      "张明站在高楼之上，俯瞰整个城市的灯火。他知道，今晚的宴会将决定他与林氏集团合作的成败。作为一个从军队退役的特种兵，他从未想过有一天会靠联姻来解决商业问题...",
    workTitle: "都市之全能高手",
    workId: "2",
    chapterId: undefined,
    createdAt: "2023-09-17",
    updatedAt: "2023-09-18",
    wordCount: 1800,
  },
  {
    id: "3",
    title: "新作品构思",
    content:
      "故事背景设定在2150年，人类已经开始在太阳系内多个行星建立殖民地。主角是一名星际运输船的机械师，在一次例行维修中发现了船舱内的神秘货物...",
    workTitle: undefined,
    workId: undefined,
    chapterId: undefined,
    createdAt: "2023-09-15",
    updatedAt: "2023-09-15",
    wordCount: 950,
  },
];

// 草稿类型
type DraftType = "all" | "chapter" | "note";

// 草稿箱页面组件
export default function DraftsPage() {
  // 当前选中的草稿类型
  const [draftType, setDraftType] = useState<DraftType>("all");

  // 根据类型筛选草稿
  const filteredDrafts = draftData.filter((draft) => {
    if (draftType === "all") return true;
    if (draftType === "chapter") return !!draft.workId;
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
