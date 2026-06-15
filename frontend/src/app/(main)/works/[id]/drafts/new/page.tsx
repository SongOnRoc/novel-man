"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useRef } from "react";
import { toast } from "sonner";

import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { useCreateDraft, useUpdateDraft } from "@/hooks/draft/useDraftService";
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
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;

  const { data: work, isLoading } = useWorkById(isValidWorkId ? workId : undefined);
  const { mutateAsync: createDraftAsync, isPending: isCreating } = useCreateDraft();
  const { mutateAsync: updateDraftAsync, isPending: isUpdating } = useUpdateDraft();

  // 首次保存后记住新建草稿的 ID（用 ref 避免闭包陈旧 + 不触发重渲染）：
  // 之后所有保存都走 update，全程留在当前页，仅静默更新地址栏。
  const createdIdRef = useRef<number | null>(null);
  const creatingRef = useRef(false);

  const handleSave = async (data: {
    title: string;
    content: string;
    wordCount: number;
  }): Promise<void> => {
    // 已创建 → 更新
    if (createdIdRef.current) {
      await updateDraftAsync({ id: createdIdRef.current, data });
      return;
    }
    // 正在创建中 → 跳过本次自动保存，避免并发重复创建多条草稿
    if (creatingRef.current) {
      return;
    }
    creatingRef.current = true;
    try {
      const created = await createDraftAsync({
        title: data.title.trim() || "无标题草稿",
        content: data.content,
        wordCount: data.wordCount,
        workId,
      });
      const newId = extractDraftId(created);
      if (newId) {
        createdIdRef.current = newId;
        // 静默改地址栏到编辑页：刷新/后退行为正确，但不触发 Next 重渲染、不打断输入
        window.history.replaceState(null, "", `/works/${workId}/drafts/${newId}/edit`);
      } else {
        toast.error("草稿已创建，但未获取到 ID，请返回草稿列表查看。");
      }
    } finally {
      creatingRef.current = false;
    }
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
          isSaving={isCreating || isUpdating}
          onBack={() => router.push(`/works/${workId}/drafts`)}
          backLabel="返回草稿"
        />
      </div>
    </div>
  );
}
