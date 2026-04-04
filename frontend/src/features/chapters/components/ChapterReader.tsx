"use client";

import React from "react";

interface ChapterReaderProps {
  title: string;
  content?: string | null;
}

export function ChapterReader({ title, content }: ChapterReaderProps): React.ReactElement {
  const plainTextParagraphs = (content || "")
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <article className="prose prose-neutral max-w-none rounded-2xl border border-border/50 bg-background px-5 py-6 shadow-sm dark:prose-invert md:px-8">
      <h1>{title || "无标题章节"}</h1>
      {content ? (
        <div data-paragraph-count={plainTextParagraphs.length} dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p className="text-muted-foreground">本章节没有内容。</p>
      )}
    </article>
  );
}
