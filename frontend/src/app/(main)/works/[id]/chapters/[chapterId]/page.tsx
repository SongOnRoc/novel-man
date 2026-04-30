"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toPng } from "html-to-image";
import { ChevronLeft, Download, FilePenLine } from "lucide-react";

import { AssistantDock } from "@/components/common/AssistantDock";
import { ExportDialog, ExportOptions } from "@/components/common/ExportDialog";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { ExtractAssistantPanel, ExtractReader } from "@/features/chapters/components/extract/shared";
import { useExtractWorkflow } from "@/features/chapters/hooks/useExtractWorkflow";
import type { ExtractCandidate } from "@/features/chapters/lib/extractTypes";
import { useCharacterList } from "@/hooks/character/useCharacters";
import { useChapterById, useChapterList } from "@/hooks/chapter/useChapterService";
import { useWorkById } from "@/hooks/work/useWorkService";
import type { CharacterList } from "@/lib/services/characters.service";

function getPlainTextParagraphs(html?: string | null): string[] {
  return (html || "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

const ChapterPage = (): React.ReactElement => {
  const params = useParams();
  const { setBreadcrumb } = useBreadcrumb();
  const [dockOpen, setDockOpen] = useState(false);

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
  const { data: charactersResponse } = useCharacterList({ page: 1, limit: 200 });

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${normalizedWorkId}`, work.title || "作品");
    }
    if (chapter) {
      setBreadcrumb(`chapters-${normalizedChapterId}`, chapter.title || "章节");
    }
  }, [chapter, normalizedChapterId, normalizedWorkId, setBreadcrumb, work]);

  const chapterParagraphs = useMemo(
    () => getPlainTextParagraphs(chapter?.content),
    [chapter?.content]
  );

  const workflow = useExtractWorkflow({
    chapterTitle: chapter?.title || "章节工作区",
    characters: (charactersResponse?.data as CharacterList | undefined)?.data ?? [],
    worldviewItems: [],
  });

  const triggerExtract = (paragraphs?: string[]) => {
    if (!chapter) {
      return;
    }
    workflow.open({
      scope: "combined",
      chapterTitle: chapter.title || "章节工作区",
      paragraphs: paragraphs ?? chapterParagraphs,
    });
    setDockOpen(true);
  };

  const handleIgnoreAll = () => {
    workflow.visibleCandidates.forEach((candidate) => workflow.ignoreCandidate(candidate.id));
  };

  const handleCandidateDetail = (_candidate: ExtractCandidate) => {
    // 详情跳转由候选卡内部 <Link/> 处理
  };

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

  const chapterIndex = useMemo(() => {
    if (!chapter?.id || !chaptersData?.data) return 1;
    const all = [...chaptersData.data].sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.id ?? 0) - (b.id ?? 0);
    });
    const idx = all.findIndex((c) => c.id === chapter.id);
    return idx >= 0 ? idx + 1 : 1;
  }, [chapter?.id, chaptersData?.data]);

  const wordCount = useMemo(
    () => chapterParagraphs.reduce((sum, p) => sum + p.replace(/\s+/g, "").length, 0),
    [chapterParagraphs]
  );
  const readingTime = Math.max(1, Math.ceil(wordCount / 350));

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
    <AssistantDock
      title="智能提取"
      description="从本章正文提取角色 / 世界观 / 纲要候选"
      open={dockOpen}
      onOpenChange={setDockOpen}
      panelContent={
        <ExtractAssistantPanel
          workflow={workflow}
          workId={normalizedWorkId}
          onTrigger={() => triggerExtract()}
          onConfirmAll={() => setDockOpen(false)}
          onIgnoreAll={handleIgnoreAll}
          onCandidateDetail={handleCandidateDetail}
        />
      }
    >
      {/* 主区：阅读纸张（占满高度） */}
      <div className="h-full overflow-hidden p-3 sm:p-5 lg:p-6">
        <article
          className="relative mx-auto flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--border-default)]/60 bg-card"
          style={{
            boxShadow:
              "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -8px rgba(15,23,42,0.06), 0 24px 48px -24px rgba(15,23,42,0.08)",
          }}
        >
          {/* Sticky 头部工具栏 */}
          <header className="sticky top-0 z-10 shrink-0 border-b border-[var(--border-subtle)] bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="-ml-1 h-9 rounded-full px-2 text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] sm:px-3"
                >
                  <Link href={`/works/${normalizedWorkId}/chapters`}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">章节目录</span>
                  </Link>
                </Button>
                <span aria-hidden className="hidden h-3 w-px bg-[var(--border-default)] sm:block" />
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
                  <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                    {String(chapterIndex).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                    章节
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-muted/40 p-1">
                <ExportDialog
                  onExport={handleExport}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]"
                      aria-label="导出"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  asChild
                  size="sm"
                  className="h-8 rounded-full bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Link
                    href={`/works/${normalizedWorkId}/chapters/${normalizedChapterId}/edit`}
                    className="inline-flex items-center gap-1"
                  >
                    <FilePenLine className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">编辑</span>
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* 滚动阅读区 */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-10 sm:py-14">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl xl:text-[2rem]">
                {chapter.title || "无标题章节"}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-[13px] text-muted-foreground">
                <span className="tabular-nums font-medium">{wordCount.toLocaleString()} 字</span>
                <span aria-hidden className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                <span>约 {readingTime} 分钟阅读</span>
              </div>

              <div className="my-6 h-px bg-[var(--border-subtle)]" aria-hidden />

              <ExtractReader
                paragraphs={chapterParagraphs}
                terms={workflow.terms}
                onTermClick={() => setDockOpen(true)}
              />
            </div>
          </div>
        </article>
      </div>
    </AssistantDock>
  );
};

export default ChapterPage;
