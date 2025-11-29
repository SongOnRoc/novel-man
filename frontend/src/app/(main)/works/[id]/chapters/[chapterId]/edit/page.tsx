"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useChapterById,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import {
  UpdateChapterPayloadForClient,
} from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";

const EditChapterPage = (): React.ReactElement => {
  const params = useParams();
  const { setBreadcrumb } = useBreadcrumb();
  const [targetCount, setTargetCount] = useState(2000);

  const workId = parseInt(params.id as string, 10);
  const chapterId = parseInt(params.chapterId as string, 10);

  const { data: chapter, isLoading, error } = useChapterById(chapterId);
  const { data: work } = useWorkById(workId);
  const { mutate: updateChapter, isPending: isSaving } = useUpdateChapter();

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "作品");
    }
    if (chapter) {
      setBreadcrumb(`chapters-${chapterId}`, chapter.title || "编辑章节");
    }
  }, [work, chapter, workId, chapterId, setBreadcrumb]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load chapter data: ${error.message}`);
    }
  }, [error]);

  const handleSave = (data: {
    title: string;
    content: string;
    wordCount: number;
  }): void => {
    const payload: UpdateChapterPayloadForClient = {
      title: data.title,
      content: data.content,
      wordCount: data.wordCount,
    };
    updateChapter(
      { id: chapterId, data: payload },
      {
        onSuccess: () => {
          toast.success("章节保存成功");
        },
        onError: (error) => {
          toast.error(`章节保存失败: ${error.message}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="space-y-4 w-full max-w-3xl px-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold">未找到章节</h2>
        <p className="mb-4 mt-2 text-muted-foreground">
          无法加载章节数据，或指定的章节不存在。
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] -m-8"> 
      {/* -m-8 to counteract the default padding of the main layout if present, 
          but ideally we should control this via layout. 
          Assuming MainLayout adds padding, we might want to portal or use a different layout.
          For now, we'll try to fill the available space.
      */}
      <TiptapEditor
        initialContent={{
          title: chapter.title!,
          content: chapter.content!,
        }}
        onSave={handleSave}
        placeholder="开始你的章节创作..."
        autoFocus
        contentId={chapter.id!.toString()}
        workId={chapter.workId!.toString()}
        containerId={`editor-${chapter.id}`}
        targetCount={targetCount}
        onTargetCountChange={setTargetCount}
        isSaving={isSaving}
      />
    </div>
  );
};

export default EditChapterPage;
