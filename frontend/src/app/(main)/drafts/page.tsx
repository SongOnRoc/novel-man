"use client";

import { useState, useMemo } from "react";
import { DraftCard } from "./components/DraftCard";
import { Button } from "@/components/ui/button";
import { FilePlus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDrafts,
  useDeleteDraft,
  usePublishDraft,
} from "@/hooks/draft/useDrafts";
import { useWorks } from "@/hooks/work/useWorks";
import { Skeleton } from "@/components/ui/skeleton";
import { Draft } from "@/types/draft";
import { useSearchParams } from "next/navigation";

// 草稿类型
type DraftType = "all" | "chapter" | "note";

// 草稿箱页面组件
export default function DraftsPage() {
  const searchParams = useSearchParams();
  const workId = searchParams.get("work_id");

  const [draftType, setDraftType] = useState<DraftType>("all");
  const { data, isLoading } = useDrafts(workId ? parseInt(workId) : undefined);
  const { data: worksData } = useWorks({ limit: 999 }); // Fetch all works for selection
  const deleteDraftMutation = useDeleteDraft();
  const publishDraftMutation = usePublishDraft();

  const drafts = useMemo(() => data?.data || [], [data]);
  const works = useMemo(() => worksData?.data || [], [worksData]);

  const handleDelete = (id: number) => {
    if (window.confirm("确定要删除这个草稿吗？此操作不可撤销。")) {
      deleteDraftMutation.mutate(id);
    }
  };

  const handlePublish = (id: number) => {
    if (window.confirm("确定要发布这个草稿吗？")) {
      publishDraftMutation.mutate(id);
    }
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
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : drafts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  works={works}
                  onDelete={() => handleDelete(draft.id)}
                  onPublish={() => handlePublish(draft.id)}
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
