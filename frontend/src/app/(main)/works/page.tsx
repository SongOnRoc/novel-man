"use client";

import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Upload, BookOpen } from "lucide-react";

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
  const { mutate: deleteWork, isPending: isDeleting } = useDeleteWork();

  const rawWorks = ((worksResponse as WorksList)?.data || []) as WorkForClient[];
  const works: WorkForClient[] = useMemo(
    () => sortByUpdatedAtDesc(rawWorks),
    [rawWorks]
  );
  const pagination = (worksResponse as WorksList)?.pagination;

  const handleConfirmDelete = (): void => {
    if (deleteWorkId) {
      deleteWork(deleteWorkId, {
        onSuccess: () => {
          setDeleteWorkId(null);
        },
      });
    }
  };

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  return (
    <div className="min-h-screen space-y-12 pb-20 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-10 md:p-16">
        <div className="relative z-10 max-w-2xl">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            我的作品库
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-muted-foreground"
          >
            管理您的所有创作作品，继续您的创作之旅。每一个故事都值得被认真对待。
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-4"
          >
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
          </motion.div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Works Grid */}
      <div className="px-2">
        {isLoading ? (
          <GlobalLoading fullScreen={false} />
        ) : (
          <>
            {works.length > 0 ? (
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 rounded-full bg-muted p-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                </div>
                <h2 className="text-2xl font-semibold">暂无作品</h2>
                <p className="mb-8 mt-2 max-w-md text-muted-foreground">
                  您还没有创建任何作品。点击上方的“创建新作品”按钮，开始您的第一个故事吧。
                </p>
              </div>
            )}
          </>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/works?page=${page - 1}`} />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href={`/works?page=${pageNumber}`}
                        isActive={page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/works?page=${page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <DeleteWorkDialog
        open={deleteWorkId !== null}
        onOpenChange={(open) => !open && setDeleteWorkId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
