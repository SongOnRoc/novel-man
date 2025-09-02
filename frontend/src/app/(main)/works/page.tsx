"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteWorkDialog } from "@/features/works/components/DeleteWorkDialog";
import { NewWorkButton } from "@/features/works/components/NewWorkButton";
import { WorkCard } from "@/features/works/components/WorkCard";
import { useWorkList, useDeleteWork } from "@/hooks/work/useWorkService";
import { Work, WorksList } from "@/lib/services/work.service";

export default function WorksPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const [deleteWorkId, setDeleteWorkId] = useState<number | null>(null);

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const { data: worksResponse, isLoading } = useWorkList({ page });
  const { mutate: deleteWork, isPending: isDeleting } = useDeleteWork();

  const works = (worksResponse as WorksList)?.data || [];
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
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">我的作品</h1>
            <p className="text-muted-foreground">
              管理您的所有创作作品，继续您的创作之旅。
            </p>
          </div>
          <NewWorkButton />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            {works.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {works.map((work: Work) => (
                  <WorkCard
                    key={work.id}
                    work={work}
                    onDelete={() => setDeleteWorkId(work.id!)}
                    isDeleting={isDeleting && deleteWorkId === work.id}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
                <h2 className="text-2xl font-semibold">暂无作品</h2>
                <p className="mb-6 mt-2 text-muted-foreground">
                  您还没有创建任何作品，点击下方按钮开始您的创作之旅。
                </p>
                <NewWorkButton />
              </div>
            )}
          </>
        )}

        {totalPages > 1 && (
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
        )}
      </div>
      <DeleteWorkDialog
        open={deleteWorkId !== null}
        onOpenChange={(open) => !open && setDeleteWorkId(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
