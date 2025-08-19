"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { NewWorkButton } from "@/features/works/components/NewWorkButton";
import { WorkCard } from "@/features/works/components/WorkCard";
import { useWorkList, useDeleteWork } from "@/hooks/work/useWorkService";
import { Work, WorksList } from "@/lib/services/work.service";

// 作品列表页面组件
export default function WorksPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const { data: worksResponse, isLoading } = useWorkList({ page });
  const { mutate: deleteWork, isPending: isDeleting } = useDeleteWork();

  const works = (worksResponse as WorksList)?.data || [];
  const pagination = (worksResponse as WorksList)?.pagination;

  const handleDeleteWork = (workId: number): void => {
    if (window.confirm("确定要删除这个作品吗？此操作不可撤销。")) {
      deleteWork(workId);
    }
  };

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) {
      return 1;
    }
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  return (
    <div className="space-y-6">
      {/* 页面标题和新建按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">我的作品</h1>
          <p className="text-muted-foreground">
            管理您的所有创作作品，继续您的创作之旅。
          </p>
        </div>
        <NewWorkButton />
      </div>

      {/* 作品列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[125px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {works.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((work: Work) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  onDelete={() => handleDeleteWork(work.id!)}
                  isDeleting={isDeleting}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
              <h2 className="text-2xl font-semibold">暂无作品</h2>
              <p className="mb-4 mt-2 text-muted-foreground">
                您还没有创建任何作品，点击下方按钮开始您的创作之旅。
              </p>
              <NewWorkButton />
            </div>
          )}
        </>
      )}

      {/* 分页 */}
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
  );
}
