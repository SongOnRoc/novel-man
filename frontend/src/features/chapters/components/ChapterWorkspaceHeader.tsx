"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, FilePenLine, ListTree, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";

interface ChapterWorkspaceHeaderProps {
  workId: number;
  chapterId: number;
  title: string;
  mode?: "read" | "edit";
  onOpenAnalysis?: () => void;
  onStartSelection?: () => void;
}

export function ChapterWorkspaceHeader({
  workId,
  chapterId,
  title,
  mode = "read",
  onOpenAnalysis,
  onStartSelection,
}: ChapterWorkspaceHeaderProps): React.ReactElement {
  return (
    <PageHeader
      title={title || "章节工作区"}
      description="围绕当前章节进行阅读、编辑与分析。"
      backButton={{ href: `/works/${workId}/chapters`, label: "返回目录" }}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/works/${workId}/chapters`}>
              <ListTree className="mr-2 h-4 w-4" />
              目录
            </Link>
          </Button>
          <Button variant="outline" size="sm" type="button" onClick={onOpenAnalysis}>
            <Sparkles className="mr-2 h-4 w-4" />
            分析
          </Button>
          {onStartSelection ? (
            <Button variant="outline" size="sm" type="button" onClick={onStartSelection}>
              选择片段提取
            </Button>
          ) : null}
          {mode === "read" ? (
            <Button size="sm" asChild>
              <Link href={`/works/${workId}/chapters/${chapterId}/edit`}>
                <FilePenLine className="mr-2 h-4 w-4" />
                编辑
              </Link>
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link href={`/works/${workId}/chapters/${chapterId}`}>
                <BookOpen className="mr-2 h-4 w-4" />
                阅读
              </Link>
            </Button>
          )}
        </div>
      }
    />
  );
}
