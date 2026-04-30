"use client";

import { BookOpen, Clock3, FolderKanban, Plus, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Button } from "@/components/ui/button";
import { DeleteWorkDialog } from "@/features/works/components/DeleteWorkDialog";
import { NewWorkButton } from "@/features/works/components/NewWorkButton";
import { WorkCard } from "@/features/works/components/WorkCard";
import { useWorkList, useDeleteWork, useImportWorks } from "@/hooks/work/useWorkService";
import { WorkForClient, WorksList } from "@/lib/services/work.service";
import { ImportDialog } from "@/components/common/ImportDialog";
import { sortByUpdatedAtDesc } from "@/lib/utils";

export default function WorksPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [deleteWorkId, setDeleteWorkId] = useState<number | null>(null);
  const importMutation = useImportWorks();

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const { data: worksResponse, isLoading } = useWorkList({ page, limit: 12 });
  const { mutateAsync: deleteWork, isPending: isDeleting } = useDeleteWork();

  const rawWorks = ((worksResponse as WorksList)?.data || []) as WorkForClient[];
  const works: WorkForClient[] = useMemo(() => sortByUpdatedAtDesc(rawWorks), [rawWorks]);
  const pagination = (worksResponse as WorksList)?.pagination;

  const handleConfirmDelete = async (draftHandling?: "delete" | "unlink"): Promise<void> => {
    if (deleteWorkId !== null) {
      await deleteWork({ id: deleteWorkId, draftHandling });
      setDeleteWorkId(null);
    }
  };

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  const totals = useMemo(() => {
    return works.reduce(
      (acc, work) => {
        acc.words += work.totalWordCount || 0;
        acc.chapters += work.totalChapterCount || 0;
        return acc;
      },
      { words: 0, chapters: 0 }
    );
  }, [works]);

  return (
    <div className="relative space-y-4 pb-12 animate-in fade-in duration-500 sm:space-y-5">
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-5 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 hidden h-44 w-44 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block"
          />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
              <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                <FolderKanban className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                作品管理入口
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">作品工作台</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                从这里进入每一部作品的统一工作台，围绕总览、章节、草稿、大纲、角色与设定持续推进创作。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <NewWorkButton />
              <ImportDialog
                title="导入作品"
                description="支持 .json 格式的作品数据导入。"
                allowedTypes={[".json"]}
                onImport={(file) => importMutation.mutateAsync(file)}
                trigger={
                  <Button variant="outline" size="lg" className="h-11 rounded-full border-[var(--border-default)]/60 px-5">
                    <Upload className="mr-2 h-4 w-4" />
                    导入作品
                  </Button>
                }
              />
              <Button variant="ghost" size="lg" asChild className="h-11 rounded-full px-5">
                <Link href="/drafts">
                  <Sparkles className="mr-2 h-4 w-4" />
                  打开全局草稿箱
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-1">
          <SummaryPanel
            icon={FolderKanban}
            title="当前页职责"
            value={`${works.length} 部作品`}
            description="按最近更新时间排序，作为进入单作品工作台的统一入口。"
          />
          <SummaryPanel
            icon={BookOpen}
            title="章节总量"
            value={`${totals.chapters} 章`}
            description="快速感知当前作品库中已经沉淀的章节规模。"
          />
          <SummaryPanel
            icon={Clock3}
            title="字数总量"
            value={`${totals.words.toLocaleString()} 字`}
            description="结合作品工作台继续追踪章节与草稿的推进情况。"
          />
        </div>
      </div>

      <section className="space-y-4 rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">我的作品</h2>
            <p className="text-[13px] leading-5 text-muted-foreground">
              选择任一作品即可进入统一工作台，在当前作品上下文中继续章节、草稿与创作资产管理。
            </p>
          </div>
          <Button variant="outline" asChild className="rounded-full border-[var(--border-default)]/60">
            <Link href="/drafts">查看未关联草稿</Link>
          </Button>
        </div>

        <div className="px-1">
          {isLoading ? (
            <GlobalLoading fullScreen={false} />
          ) : works.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {works.map((work: WorkForClient, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <WorkCard
                    work={work}
                    onDelete={() => setDeleteWorkId(work.id!)}
                    isDeleting={isDeleting && deleteWorkId === work.id}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)]/70 bg-muted/30 py-16 text-center">
              <div className="mb-5 rounded-xl bg-primary/10 p-5 text-primary">
                <BookOpen className="h-9 w-9" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">暂无作品</h2>
              <p className="mb-6 mt-2 max-w-md text-sm text-muted-foreground">
                先创建第一部作品，随后即可进入统一工作台，围绕章节、草稿、大纲与设定持续创作。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <NewWorkButton />
                <Button variant="outline" asChild className="rounded-full border-[var(--border-default)]/60">
                  <Link href="/drafts">先去草稿箱记录灵感</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/works?page=${page - 1}`} />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink href={`/works?page=${pageNumber}`} isActive={page === pageNumber}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/works?page=${page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>

      <DeleteWorkDialog
        open={deleteWorkId !== null}
        onOpenChange={(open) => !open && setDeleteWorkId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

function SummaryPanel({
  icon: Icon,
  title,
  value,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">{title}</div>
      <div className="mt-1 text-xl font-extrabold tracking-tight text-foreground tabular-nums">{value}</div>
      <p className="mt-2 text-[13px] leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
