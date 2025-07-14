"use client";

import { useChapters } from "@/hooks/useChapters";
import { notFound, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChapterPreviewPage() {
  const params = useParams();
  const chapterId = Array.isArray(params.id) ? params.id[0] : params.id;

  // We call useChapters without a workId to get all chapters, then find the one we need.
  // This is inefficient for a real app, but acceptable for our mock data setup.
  const { chapters, isLoading } = useChapters();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const chapter = chapters.find((c) => c.id === chapterId);

  if (!chapter) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/chapters?workId=${chapter.workId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回章节列表
          </Link>
        </Button>
      </div>
      <article className="prose dark:prose-invert max-w-none">
        <h1>{chapter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
      </article>
    </div>
  );
}