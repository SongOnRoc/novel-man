"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toPng } from "html-to-image";

import { ExportDialog, ExportOptions } from "@/components/common/ExportDialog";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { ChapterReader } from "@/features/chapters/components/ChapterReader";
import { ChapterAnalysisPanel } from "@/features/chapters/components/ChapterAnalysisPanel";
import { ChapterAnalysisSheet } from "@/features/chapters/components/ChapterAnalysisSheet";
import { ChapterSelectionMode } from "@/features/chapters/components/ChapterSelectionMode";
import { ChapterWorkspaceHeader } from "@/features/chapters/components/ChapterWorkspaceHeader";
import { useChapterAnalysis } from "@/features/chapters/hooks/useChapterAnalysis";
import { useChapterById, useChapterList } from "@/hooks/chapter/useChapterService";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { useWorkById } from "@/hooks/work/useWorkService";

const ChapterPage = (): React.ReactElement => {
  const params = useParams();
  const { setBreadcrumb } = useBreadcrumb();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const workId = Number.parseInt(params.id as string, 10);
  const chapterId = Number.parseInt(params.chapterId as string, 10);

  const normalizedWorkId = Number.isNaN(workId) ? undefined : workId;
  const normalizedChapterId = Number.isNaN(chapterId) ? undefined : chapterId;

  const { data: work, isLoading: isLoadingWork } = useWorkById(normalizedWorkId);
  const { data: chapter, isLoading: isLoadingChapter } = useChapterById(normalizedChapterId ?? 0);
  const { data: chaptersData } = useChapterList({
    workId: normalizedWorkId ?? 0,
    page: 1,
    limit: 9999,
  });

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${normalizedWorkId}`, work.title || "作品");
    }
    if (chapter) {
      setBreadcrumb(`chapters-${normalizedChapterId}`, chapter.title || "章节");
    }
  }, [chapter, normalizedChapterId, normalizedWorkId, setBreadcrumb, work]);

  const handleExport = async (options: ExportOptions) => {
    if (!chapter) {
      return;
    }

    const chapters = chaptersData?.data ?? [];

    let contentToExport = "";
    let title = "";

    switch (options.range) {
      case "current":
        contentToExport = chapter.content ?? "";
        title = chapter.title ?? "章节";
        break;
      case "volume": {
        const volumeChapters = chapters.filter((item) => item.volumeId === chapter.volumeId);
        title = `分卷-${volumeChapters[0]?.volumeId ?? chapter.volumeId ?? ""}`;
        contentToExport = volumeChapters
          .map((item) => `## ${item.title}\n\n${item.content ?? ""}`)
          .join("\n\n---\n\n");
        break;
      }
      case "all":
        title = "全书";
        contentToExport = chapters
          .map((item) => `## ${item.title}\n\n${item.content ?? ""}`)
          .join("\n\n---\n\n");
        break;
      default:
        return;
    }

    if (options.format === "txt") {
      const blob = new Blob([contentToExport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title}.txt`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    const contentElement = document.querySelector("article");
    if (contentElement instanceof HTMLElement) {
      const dataUrl = await toPng(contentElement, { cacheBust: true });
      const link = document.createElement("a");
      link.download = `${title}.png`;
      link.href = dataUrl;
      link.click();
    }
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

  if (!normalizedChapterId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold">无效的章节 ID</h2>
        <p className="mt-2 text-muted-foreground">无法定位要打开的章节，请返回目录后重试。</p>
      </div>
    );
  }

  if (isLoadingWork || isLoadingChapter) {
    return <GlobalLoading />;
  }

  if (!chapter) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold">未找到章节</h2>
        <p className="mt-2 text-muted-foreground">当前章节不存在，或暂时无法加载。</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <ChapterWorkspaceHeader
        workId={normalizedWorkId ?? 0}
        chapterId={normalizedChapterId}
        title={chapter.title || "章节工作区"}
        onOpenAnalysis={() => openAnalysisFor("outline", chapterParagraphs)}
        onStartSelection={() => setIsSelectionMode(true)}
      />
      <div className="flex items-center justify-end">
        <ExportDialog onExport={handleExport} />
      </div>
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
        <ChapterReader title={chapter.title || "章节工作区"} content={chapter.content} />
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

export default ChapterPage;
