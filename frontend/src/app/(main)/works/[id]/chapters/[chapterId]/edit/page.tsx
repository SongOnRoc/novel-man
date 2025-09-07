"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useChapterById,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import {
  ChapterForClient,
  UpdateChapterPayloadForClient,
} from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";

const EditChapterPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumb } = useBreadcrumb();
  const [targetCount, setTargetCount] = useState(2000);

  const workId = parseInt(params.id as string, 10);
  const chapterId = parseInt(params.chapterId as string, 10);

  const { data: chapter, isLoading, error } = useChapterById(chapterId);
  const { data: work } = useWorkById(workId);
  const { mutate: updateChapter, isPending: isSaving } = useUpdateChapter();

  useEffect(() => {
    if (work) {
      // e.g., 'works-1'
      setBreadcrumb(`works-${workId}`, work.title || "作品");
    }
    if (chapter) {
      // e.g., 'chapters-1'
      setBreadcrumb(`chapters-${chapterId}`, chapter.title || "编辑章节");
    }
  }, [work, chapter, workId, chapterId, setBreadcrumb]);

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load chapter data: ${error.message}`);
    }
  }, [error]);

  const handleBack = (): void => {
    router.back();
  };

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

  const handleSaveClick = (): void => {
    if (!chapter) return;
    toast.info("Please use the save button in the editor toolbar.");
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
    <div className="space-y-6">
      <PageHeader
        title="编辑章节"
        description="编辑章节内容，稿件将自动保存。"
      />

      {chapter ? (
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
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-2xl font-semibold">未找到章节</h2>
            <p className="mb-4 mt-2 text-muted-foreground">
              无法加载章节数据，或指定的章节不存在。
            </p>
          </div>
        )
      )}

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/works/${workId}/chapters`}>返回章节列表</Link>
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={isSaving || !chapter}
            onClick={handleSaveClick}
          >
            {isSaving ? "保存中..." : "存为草稿"}
          </Button>
          <Button disabled={isSaving || !chapter} onClick={handleSaveClick}>
            {isSaving ? "发布中..." : "发布章节"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          Tip: Press Ctrl+G to jump to a specific line; use the bookmark manager
          to add bookmarks at important locations.
        </p>
      </div>
    </div>
  );
};

export default EditChapterPage;
