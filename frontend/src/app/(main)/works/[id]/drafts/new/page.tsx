"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { DraftForm } from "@/features/drafts/components/draft-form";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { useWorkById } from "@/hooks/work/useWorkService";

export default function WorkDraftNewPage(): React.ReactElement {
  const params = useParams();
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const { data: work, isLoading } = useWorkById(isValidWorkId ? workId : undefined);

  if (!isValidWorkId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">请从作品列表重新进入作品草稿页面。</p>
        <Button variant="outline" asChild>
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <GlobalLoading fullScreen={false} />;
  }

  if (!work) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品不存在</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" asChild>
          <Link href="/works">返回作品列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title="新建作品草稿"
        description="直接在当前作品下创建草稿，完成后自动回到作品草稿列表。"
        backButton={{ href: `/works/${workId}`, label: "返回作品" }}
      />

      <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm md:p-6">
        <DraftForm workId={workId} onSuccessNavigateTo={`/works/${workId}/drafts`} />
      </div>
    </div>
  );
}
