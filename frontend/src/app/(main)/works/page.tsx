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
    <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 shadow-sm md:p-10">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-background/80 px-3 py-1 text-sm text-primary shadow-sm">
              <FolderKanban className="mr-2 h-4 w-4" />
              作品管理入口
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">作品工作台</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
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
                  <Button variant="outline" size="lg" className="h-12 px-6">
                    <Upload className="mr-2 h-5 w-5" />
                    导入作品
                  </Button>
                }
              />
              <Button variant="ghost" size="lg" asChild className="h-12 px-6">
                <Link href="/drafts">
                  <Sparkles className="mr-2 h-5 w-5" />
                  打开全局草稿箱
                </Link>
              </Button>
            </div>
          </div>

          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
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

      <section className="space-y-4 rounded-3xl border border-border/60 bg-card/50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">我的作品</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              选择任一作品即可进入统一工作台，在当前作品上下文中继续章节、草稿与创作资产管理。
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/drafts">查看未关联草稿</Link>
          </Button>
        </div>

        <div className="px-1">
          {isLoading ? (
            <GlobalLoading fullScreen={false} />
          ) : works.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-background/50 py-20 text-center">
              <div className="mb-6 rounded-full bg-muted p-8">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <h2 className="text-2xl font-semibold">暂无作品</h2>
              <p className="mb-8 mt-2 max-w-md text-muted-foreground">
                先创建第一部作品，随后即可进入统一工作台，围绕章节、草稿、大纲与设定持续创作。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <NewWorkButton />
                <Button variant="outline" asChild>
                  <Link href="/drafts">先去草稿箱记录灵感</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center pt-6">
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
    <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
