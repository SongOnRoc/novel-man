"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { ChapterAnalysisPanel } from "@/features/chapters/components/ChapterAnalysisPanel";
import { ChapterAnalysisSheet } from "@/features/chapters/components/ChapterAnalysisSheet";
import { ChapterSelectionMode } from "@/features/chapters/components/ChapterSelectionMode";
import { ChapterWorkspaceHeader } from "@/features/chapters/components/ChapterWorkspaceHeader";
import { useChapterAnalysis } from "@/features/chapters/hooks/useChapterAnalysis";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useChapterById,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { UpdateChapterPayloadForClient } from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";

const EditChapterPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumb } = useBreadcrumb();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
          // toast.success("章节保存成功");
        },
        onError: (error) => {
          toast.error(`章节保存失败: ${error.message}`);
        },
      }
    );
  };

  const getPlainTextParagraphs = (html?: string | null) =>
    (html || "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const chapterParagraphs = getPlainTextParagraphs(chapter?.content);
  const {
    isOpen: isAnalysisOpen,
    inputLabel: analysisInputLabel,
    analysisKind,
    result: analysisResult,
    status: analysisStatus,
    errorMessage: analysisErrorMessage,
    openAnalysisFor,
    closeAnalysis,
    retryAnalysis,
  } = useChapterAnalysis(chapter?.title || "章节工作区");

  if (isLoading) {
    return <GlobalLoading />;
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
    <div className="space-y-6 bg-background pb-10">
      <ChapterWorkspaceHeader
        workId={workId}
        chapterId={chapterId}
        title={chapter.title || "章节工作区"}
        mode="edit"
        onOpenAnalysis={() => openAnalysisFor("outline", chapterParagraphs)}
        onStartSelection={() => setIsSelectionMode(true)}
      />
      {isSelectionMode ? (
        <ChapterSelectionMode
          paragraphs={chapterParagraphs}
          onCancel={() => setIsSelectionMode(false)}
          onExtract={({ type, paragraphs }) => {
            setIsSelectionMode(false);
            openAnalysisFor(type, paragraphs, `已选 ${paragraphs.length} 段`);
          }}
        />
      ) : (
        <div className="h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
          <TiptapEditor
            initialContent={{
              title: chapter.title!,
              content: chapter.content!,
            }}
            onSave={handleSave}
            placeholder="开始你的创作..."
            autoFocus
            contentId={chapter.id!.toString()}
            workId={workId.toString()}
            containerId={`editor-${chapter.id}`}
            targetCount={2000}
            onTargetCountChange={() => {}}
            isSaving={isSaving}
            onBack={() => router.push(`/works/${workId}`)}
            backLabel="返回作品"
          />
        </div>
      )}
      {isDesktop ? (
        isAnalysisOpen ? (
          <ChapterAnalysisPanel
            chapterTitle={chapter.title || "章节工作区"}
            inputLabel={analysisInputLabel}
            status={analysisStatus}
            errorMessage={analysisErrorMessage}
            analysisKind={analysisKind}
            onAnalysisKindChange={(kind) => openAnalysisFor(kind, chapterParagraphs, analysisInputLabel)}
            result={analysisResult}
            onRetry={retryAnalysis}
            onClose={closeAnalysis}
          />
        ) : null
      ) : (
        <ChapterAnalysisSheet
          chapterTitle={chapter.title || "章节工作区"}
          inputLabel={analysisInputLabel}
          status={analysisStatus}
          errorMessage={analysisErrorMessage}
          analysisKind={analysisKind}
          onAnalysisKindChange={(kind) => openAnalysisFor(kind, chapterParagraphs, analysisInputLabel)}
          result={analysisResult}
          open={isAnalysisOpen}
          onRetry={retryAnalysis}
          onOpenChange={(open) => {
            if (!open) {
              closeAnalysis();
            }
          }}
        />
      )}
    </div>
  );
};

export default EditChapterPage;
