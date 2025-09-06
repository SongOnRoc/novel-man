"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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

const EditDraftPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | undefined>(
    undefined
  );

  const draftId = parseInt(params.id as string, 10);
  const { data: draft, isLoading, error } = useDraftById(draftId);
  const { mutate: updateDraft, isPending: isSaving } = useUpdateDraft();
  const { mutate: publishDraft, isPending: isPublishingPending } =
    usePublishDraft();

  const { data: worksResponse } = useWorkList({});
  const works = worksResponse?.data || [];

  useEffect(() => {
    if (draft?.workId) {
      setSelectedWorkId(draft.workId.toString());
    }
  }, [draft]);

  useEffect(() => {
    if (error) {
      toast.error(`加载草稿数据失败: ${error.message}`);
    }
  }, [error]);

  const handleSave = (data: {
    title: string;
    content: string;
    wordCount: number;
  }): void => {
    const payload: UpdateDraftPayloadForClient = {
      title: data.title,
      content: data.content,
      wordCount: data.wordCount,
    };
    updateDraft(
      { id: draftId, data: payload },
      {
        onSuccess: () => {
          toast.success("草稿自动保存成功");
        },
        onError: (error: Error) => {
          toast.error(`自动保存失败: ${error.message}`);
        },
      }
    );
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
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="w-full h-[60vh]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">返回</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">编辑草稿</h1>
              <p className="text-muted-foreground">
                编辑草稿内容，内容将自动保存。
              </p>
            </div>
          </div>
        </div>

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
          />
        ) : (
          !isLoading && (
            <div className="text-center text-muted-foreground">
              草稿未找到或加载失败。
            </div>
          )
        )}

        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            disabled={isSaving || isPublishingPending}
            onClick={() =>
              toast.info("内容已自动保存，或使用编辑器工具栏中的保存按钮。")
            }
          >
            存为草稿
          </Button>
          <Button
            disabled={isSaving || isPublishingPending}
            onClick={() => setIsPublishing(true)}
          >
            {isPublishingPending ? "发布中..." : "发布为新章节"}
          </Button>
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
