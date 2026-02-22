"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useDraftById,
  useUpdateDraft,
  usePublishDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import {
  DraftForClient,
  UpdateDraftPayloadForClient,
} from "@/lib/services/draft.service";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

const EditDraftPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumb } = useBreadcrumb();

  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | undefined>(
    undefined
  );
  const [isAIOpen, setIsAIOpen] = useState(true);
  const [selectedText, setSelectedText] = useState("");

  const draftId = parseInt(params.id as string, 10);
  const { data: draft, isLoading, error } = useDraftById(draftId);
  const {
    mutate: updateDraft,
    mutateAsync: updateDraftAsync,
    isPending: isSaving,
  } = useUpdateDraft();
  const { mutate: publishDraft, isPending: isPublishingPending } =
    usePublishDraft();

  const { data: worksResponse } = useWorkList({});
  const works = worksResponse?.data || [];

  useEffect(() => {
    if (draft) {
      if (draft.workId) {
        setSelectedWorkId(draft.workId.toString());
      }
      // Use unique key like 'drafts-123' to avoid conflicts
      setBreadcrumb(`drafts-${draftId}`, draft.title || "Untitled Draft");
    }
  }, [draft, draftId, setBreadcrumb]);

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

    try {
      await updateDraftAsync({ id: draftId, data: payload });
      // toast.success("草稿自动保存成功");
    } catch (error: any) {
      // toast.error(`自动保存失败: ${error.message}`);
      throw error; // Re-throw to let TiptapEditor know it failed
    }
  };

  const handleConfirmPublish = () => {
    if (!selectedWorkId) {
      toast.error("请选择一个作品进行发布。");
      return;
    }

    const associateAndPublish = () => {
      publishDraft(draftId, {
        onSuccess: () => {
          toast.success("发布成功！");
          router.push(`/works/${selectedWorkId}/chapters`);
        },
        onError: (err) => {
          toast.error(`发布失败: ${err.message}`);
        },
      });
    };

    if (draft?.workId?.toString() !== selectedWorkId) {
      updateDraft(
        { id: draftId, data: { workId: parseInt(selectedWorkId, 10) } },
        {
          onSuccess: () => {
            toast.success("作品关联成功，正在发布...");
            associateAndPublish();
          },
          onError: (err) => {
            toast.error(`关联作品失败: ${err.message}`);
          },
        }
      );
    } else {
      associateAndPublish();
    }
  };

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <>
      <div className="h-full overflow-hidden bg-background flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {draft ? (
            <TiptapEditor
              initialContent={{
                title: draft.title!,
                content: draft.content!,
              }}
              onSave={handleSave}
              placeholder="开始你的创作..."
              autoFocus
              contentId={draft.id!.toString()}
              workId={draft.workId?.toString()}
              containerId={`editor-${draft.id}`}
              targetCount={2000}
              onTargetCountChange={() => {}}
              isSaving={isSaving}
              onBack={() => router.back()}
              onPublish={() => setIsPublishing(true)}
            />
          ) : (
            <div className="text-center text-muted-foreground p-8">
              草稿未找到或加载失败。
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={isPublishing} onOpenChange={setIsPublishing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>发布为新章节</AlertDialogTitle>
            <AlertDialogDescription>
              请为这篇草稿选择要发布到的作品。如果作品不在此列表中，请先到作品管理页面创建新作品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select
              onValueChange={setSelectedWorkId}
              defaultValue={selectedWorkId}
            >
              <SelectTrigger>
                <SelectValue placeholder="请选择关联作品" />
              </SelectTrigger>
              <SelectContent>
                {works.map((work) => (
                  <SelectItem key={work.id} value={work.id!.toString()}>
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPublish}>
              确认发布
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditDraftPage;
