"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { PublishDraftDialog } from "@/features/drafts/components/PublishDraftDialog";
import {
  useDraftById,
  usePublishDraft,
  useUpdateDraft,
} from "@/hooks/draft/useDraftService";
import { UpdateDraftPayloadForClient } from "@/lib/services/draft.service";
import { useChapterList } from "@/hooks/chapter/useChapterService";

export default function WorkDraftEditPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();

  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const draftId =
    typeof params.draftId === "string" ? parseInt(params.draftId, 10) : NaN;

  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const isValidDraftId = Number.isInteger(draftId) && draftId > 0;

  const [isPublishing, setIsPublishing] = useState(false);

  const { data: draft, isLoading, error } = useDraftById(
    isValidDraftId ? draftId : 0,
  );
  const { mutateAsync: updateDraftAsync, isPending: isSaving } = useUpdateDraft();
  const { mutate: publishDraft, isPending: isPublishingPending } = usePublishDraft();
  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapterList({
    workId: isValidWorkId ? workId : 0,
    page: 1,
    limit: 9999,
  });
  const chapters = chaptersResponse?.data || [];

  useEffect(() => {
    if (error) {
      toast.error(`加载草稿数据失败: ${error.message}`);
    }
  }, [error]);

  const handleSave = async (data: {
    title: string;
    content: string;
    wordCount: number;
  }): Promise<void> => {
    const payload: UpdateDraftPayloadForClient = {
      title: data.title,
      content: data.content,
      wordCount: data.wordCount,
    };

    await updateDraftAsync({ id: draftId, data: payload });
  };

  const handleConfirmPublish = async (args: { normalizedTitle: string }) => {
    try {
      await updateDraftAsync({
        id: draftId,
        data: {
          title: args.normalizedTitle,
        },
      });
    } catch (updateError) {
      toast.error(`发布前更新草稿标题失败: ${(updateError as Error).message}`);
      return;
    }

    publishDraft(draftId, {
      onSuccess: () => {
        toast.success("发布成功！");
        setIsPublishing(false);
        router.push(`/works/${workId}/chapters`);
      },
      onError: (publishError) => {
        toast.error(`发布失败: ${publishError.message}`);
      },
    });
  };

  if (!isValidWorkId || !isValidDraftId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的草稿地址</h2>
        <p className="text-muted-foreground">请从作品详情页重新进入编辑页面。</p>
        <Button variant="outline" onClick={() => router.push("/works")}
        >
          返回作品列表
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <GlobalLoading fullScreen={false} />;
  }

  if (!draft || draft.workId !== workId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">草稿不存在</h2>
        <p className="text-muted-foreground">
          该草稿可能已被删除，或不属于当前作品。
        </p>
        <Button variant="outline" onClick={() => router.push(`/works/${workId}`)}>
          返回作品详情
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-hidden bg-background flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          <TiptapEditor
            initialContent={{
              title: draft.title || "",
              content: draft.content || "",
            }}
            onSave={handleSave}
            placeholder="开始你的创作..."
            autoFocus
            contentId={draft.id?.toString()}
            workId={String(workId)}
            containerId={`editor-${draft.id}`}
            targetCount={2000}
            onTargetCountChange={() => {}}
            isSaving={isSaving}
            onBack={() => router.push(`/works/${workId}`)}
            backLabel="返回作品"
            onPublish={() => setIsPublishing(true)}
          />
        </div>
      </div>

      <PublishDraftDialog
        open={isPublishing}
        onOpenChange={setIsPublishing}
        draft={draft}
        workId={workId}
        chapters={chapters}
        isPending={isPublishingPending || isSaving || isLoadingChapters}
        onConfirm={({ normalizedTitle }) => handleConfirmPublish({ normalizedTitle })}
      />
    </>
  );
}
