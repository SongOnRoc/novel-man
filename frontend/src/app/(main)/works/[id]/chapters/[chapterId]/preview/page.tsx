"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import React, { useRef, useEffect } from "react";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { ExportDialog, ExportOptions } from "@/components/common/ExportDialog";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import {
  useChapterById,
  useChapterList,
} from "@/hooks/chapter/useChapterService";
import {
  ChapterForClient,
  ChapterListResponse,
} from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";

export default function ChapterPreviewPage(): React.ReactElement {
  const params = useParams();
  const { setBreadcrumb } = useBreadcrumb();
  const workId = parseInt(params.id as string, 10);
  const chapterId = parseInt(params.chapterId as string, 10);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: chapter, isLoading } = useChapterById(chapterId);
  const { data: work } = useWorkById(workId);

  useEffect(() => {
    if (work) {
      // e.g., 'works-1'
      setBreadcrumb(`works-${workId}`, work.title || "作品");
    }
    if (chapter) {
      // e.g., 'chapters-1'
      setBreadcrumb(`chapters-${chapterId}`, chapter.title || "预览章节");
    }
  }, [work, chapter, workId, chapterId, setBreadcrumb]);

  const { data: chaptersData } = useChapterList({
    workId: workId,
    page: 1,
    limit: 9999,
  });

  const chapters: ChapterForClient[] =
    (chaptersData as ChapterListResponse)?.data ?? [];

  if (!chapterId) {
    return notFound();
  }

  const handleExport = (options: ExportOptions): void => {
    if (!chapter) return;

    let contentToExport = "";
    let title = "";

    switch (options.range) {
      case "current":
        contentToExport = chapter.content ?? "";
        title = chapter.title ?? "";
        break;
      case "volume":
        const volumeChapters =
          chapters?.filter(
            (c: ChapterForClient) => c.volumeId === chapter.volumeId
          ) ?? [];
        title = `分卷-${volumeChapters[0]?.volumeId ?? chapter.volumeId ?? ""}`;
        contentToExport = volumeChapters
          .map((c: ChapterForClient) => `## ${c.title}\n\n${c.content}`)
          .join("\n\n---\n\n");
        break;
      case "all":
        title = `全书`;
        contentToExport =
          chapters
            ?.map((c: ChapterForClient) => `## ${c.title}\n\n${c.content}`)
            .join("\n\n---\n\n") ?? "";
        break;
      default:
        return;
    }

    if (options.format === "txt") {
      const blob = new Blob([contentToExport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (options.format === "png") {
      if (contentRef.current) {
        toPng(contentRef.current, { cacheBust: true })
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error("oops, something went wrong!", err);
          });
      }
    }
  };

  if (isLoading) {
    return <GlobalLoading />;
  }

  if (!chapter) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <PageHeader
        title={chapter.title || "章节预览"}
        backButton={{ href: `/works/${workId}`, label: "返回作品" }}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/works/${workId}/chapters`}>返回章节列表</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/works/${workId}/chapters/${chapterId}/edit`}>
                返回编辑
              </Link>
            </Button>
            <ExportDialog onExport={handleExport} />
          </div>
        }
      />
      <article
        ref={contentRef}
        className="prose dark:prose-invert max-w-none bg-background p-6 rounded-md"
      >
        <h1>{chapter.title}</h1>
        {chapter.content ? (
          <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
        ) : (
          <p className="text-muted-foreground">本章节没有内容。</p>
        )}
      </article>

      <style jsx global>{`
        .prose h1 {
          font-size: 2.25rem; /* text-4xl */
          font-weight: 700;
          margin-bottom: 2rem;
        }
        .prose p {
          text-indent: 2em;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
