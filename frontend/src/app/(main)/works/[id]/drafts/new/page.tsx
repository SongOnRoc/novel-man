"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useRef } from "react";
import { toast } from "sonner";

import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { draftKeys, useCreateDraft } from "@/hooks/draft/useDraftService";
import { useWorkById } from "@/hooks/work/useWorkService";

/** 从 create 返回值中健壮地提取草稿 ID（兼容 id / data.id / data.data.id） */
function extractDraftId(payload: unknown): number | undefined {
  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && Number.isFinite(Number(v))) return Number(v);
    return undefined;
  };
  if (!payload || typeof payload !== "object") return undefined;
  const direct = toNum((payload as { id?: unknown }).id);
  if (direct) return direct;
  const data = (payload as { data?: unknown }).data;
  if (data && typeof data === "object") {
    const dataId = toNum((data as { id?: unknown }).id);
    if (dataId) return dataId;
    const nested = (data as { data?: unknown }).data;
    if (nested && typeof nested === "object") {
      const nestedId = toNum((nested as { id?: unknown }).id);
      if (nestedId) return nestedId;
    }
  }
  return undefined;
}

export default function WorkDraftNewPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;

  const { data: work, isLoading } = useWorkById(isValidWorkId ? workId : undefined);
  const { mutateAsync: createDraftAsync, isPending: isCreating } = useCreateDraft();

  // create 成功并发起跳转后置位：拦截“跳转生效前”可能触发的二次自动保存，避免重复创建。
  // 注意：它只在 create 之后拦截，不丢任何内容（内容已随 create 提交，且 edit 页接管后续保存）。
  const navigatedRef = useRef(false);

  // 新建页只负责“创建第一版”：首次自动保存即 create，拿到 ID 后跳转到 edit 路由，
  // 由 edit 页（useDraftById 加载 + update 自动保存 + 发布流程）接管后续。
  const handleSave = async (data: {
    title: string;
    content: string;
    wordCount: number;
  }): Promise<void> => {
    if (navigatedRef.current) {
      return;
    }
    const title = data.title.trim() || "无标题草稿";
    const created = await createDraftAsync({
      title,
      content: data.content,
      wordCount: data.wordCount,
      workId,
    });
    const newId = extractDraftId(created);
    if (!newId) {
      toast.error("草稿已创建，但未获取到 ID，请返回草稿列表查看。");
      return;
    }
    navigatedRef.current = true;
    // 预填详情缓存（后端原始 snake_case 格式）：edit 页 useDraftById 一挂载即命中缓存，
    // 不闪 loading、内容无缝衔接。内容就是刚提交的，完全一致。
    queryClient.setQueryData(draftKeys.detail(newId), {
      id: newId,
      work_id: workId,
      title,
      content: data.content,
      word_count: data.wordCount,
    });
    router.replace(`/works/${workId}/drafts/${newId}/edit`);
  };

  if (!isValidWorkId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">请从作品列表重新进入作品草稿页面。</p>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <GlobalLoading />;
  }

  if (!work) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品不存在</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="relative flex-1 overflow-hidden">
        <TiptapEditor
          initialContent={{ title: "", content: "" }}
          onSave={handleSave}
          placeholder="开始你的创作..."
          autoFocus
          contentId={`new-draft-${workId}`}
          workId={String(workId)}
          containerId={`editor-new-draft-${workId}`}
          targetCount={2000}
          onTargetCountChange={() => {}}
          isSaving={isCreating}
          onBack={() => router.push(`/works/${workId}/drafts`)}
          backLabel="返回草稿"
        />
      </div>
    </div>
  );
}
