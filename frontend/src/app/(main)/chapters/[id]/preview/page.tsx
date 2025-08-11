"use client";

import { useRef } from "react";
import { useChapter } from "@/hooks/chapter/useChapters";
import { notFound, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { ExportDialog, ExportOptions } from "@/components/common/ExportDialog";

export default function ChapterPreviewPage() {
  const params = useParams();
  const chapterId = Array.isArray(params.id) ? params.id[0] : params.id;
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: chapter, isLoading } = useChapter(Number(chapterId));

  if (!chapterId) {
    return notFound();
  }

  const handleExport = (options: ExportOptions) => {
    if (!chapter) return;

    let contentToExport = "";
    let title = "";

    switch (options.range) {
      case "current":
        contentToExport = chapter.content;
        title = chapter.title;
        break;
      // The following cases need to be re-implemented as getChaptersByVolume and chapters are not available in useChapter
      // case "volume":
      //   const volumeChapters = getChaptersByVolume(chapter.volumeId);
      //   title = `分卷-${volumeChapters[0]?.volumeId}`; // Simplified title
      //   contentToExport = volumeChapters
      //     .map((c) => `## ${c.title}\n\n${c.content}`)
      //     .join("\n\n---\n\n");
      //   break;
      // case "all":
      //   title = `全书`;
      //   contentToExport = chapters
      //     .map((c) => `## ${c.title}\n\n${c.content}`)
      //     .join("\n\n---\n\n");
      //   break;
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
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!chapter) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chapters?workId=${chapter.workId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回章节列表
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chapters/${chapter.id}/edit`}>返回编辑</Link>
          </Button>
        </div>
        <ExportDialog onExport={handleExport} />
      </div>
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
