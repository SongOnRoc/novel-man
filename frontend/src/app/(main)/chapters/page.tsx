"use client";

import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { ChapterCard } from "@/features/chapters/components/ChapterCard";
import { ChapterList } from "@/features/chapters/components/chapter-list";
import {
  useChapterList,
  useDeleteChapter,
} from "@/hooks/chapter/useChapterService";
import { useWorkList } from "@/hooks/work/useWorkService";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { WorksList } from "@/lib/services/work.service";

type ViewMode = "list" | "grid";

interface ChapterContentProps {
  workId: number;
  page: number;
  view: ViewMode;
  onPageChange: (newPage: number) => void;
  onDelete: (chapter: ChapterForClient) => void;
}

const ChapterContent = ({
  workId,
  page,
  view,
  onPageChange,
  onDelete,
}: ChapterContentProps) => {
  const { data: chaptersResponse, isLoading: isLoadingChapters } =
    useChapterList({ workId, page });
  const chapters = chaptersResponse?.data || [];
  const pagination = chaptersResponse?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  if (isLoadingChapters) {
    return (
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            : ""
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className={view === "grid" ? "h-64 w-full" : "h-16 w-full"}
          />
        ))}
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <h2 className="text-2xl font-semibold">暂无章节</h2>
        <p className="mb-6 mt-2 text-muted-foreground">
          这部作品还没有任何章节，立即开始创作吧！
        </p>
        <Button asChild>
          <Link href={`/chapters/new?workId=${workId}`}>
            <Plus className="mr-2 h-4 w-4" />
            创建第一章
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" ? (
        <ChapterList chapters={chapters} onDelete={onDelete} />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {chapters.map((chapter) => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              workId={workId}
              onDelete={() => onDelete(chapter)}
            />
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious onClick={() => onPageChange(page - 1)} />
              </PaginationItem>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => onPageChange(pageNumber)}
                    isActive={page === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext onClick={() => onPageChange(page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default function ChaptersPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("list");
  const [chapterToDelete, setChapterToDelete] =
    useState<ChapterForClient | null>(null);

  const { data: worksResponse, isLoading: isLoadingWorks } = useWorkList({});
  const works = (worksResponse as WorksList)?.data || [];

  const { mutate: deleteChapter, isPending: isDeleting } = useDeleteChapter();

  const workId = searchParams.get("workId");
  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const selectedWorkId = useMemo(
    () => (workId ? parseInt(workId, 10) : undefined),
    [workId]
  );

  const handleSelectWork = (workId: string): void => {
    router.push(`/chapters?workId=${workId}&page=1`);
  };

  const handlePageChange = (newPage: number): void => {
    if (!selectedWorkId) return;
    router.push(`/chapters?workId=${selectedWorkId}&page=${newPage}`);
  };

  const handleConfirmDelete = () => {
    if (chapterToDelete) {
      deleteChapter(chapterToDelete.id!, {
        onSuccess: () => {
          toast.success("章节已删除");
          setChapterToDelete(null);
        },
        onError: (error: Error) => {
          toast.error(`删除失败: ${error.message}`);
        },
      });
    }
  };

  const renderContent = (): React.ReactElement => {
    if (isLoadingWorks) {
      return <Skeleton className="h-[400px] w-full" />;
    }
    if (!selectedWorkId) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
          <h2 className="text-2xl font-semibold">请先选择一部作品</h2>
          <p className="mb-6 mt-2 text-muted-foreground">
            选择一部作品以管理其章节内容
          </p>
        </div>
      );
    }
    return (
      <ChapterContent
        workId={selectedWorkId}
        page={page}
        view={view}
        onPageChange={handlePageChange}
        onDelete={setChapterToDelete}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Chapter Management
          </h1>
          <p className="text-muted-foreground">
            Manage your work&apos;s chapters, create new ones, or edit existing
            ones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingWorks ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : (
            <Select
              onValueChange={handleSelectWork}
              defaultValue={selectedWorkId?.toString()}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a work" />
              </SelectTrigger>
              <SelectContent>
                {works?.map((work) => (
                  <SelectItem key={work.id} value={work.id!.toString()}>
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && setView(value as ViewMode)}
          >
            <ToggleGroupItem value="list" aria-label="列表视图">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="网格视图">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Button asChild disabled={!selectedWorkId}>
            <Link href={`/chapters/new?workId=${selectedWorkId}`}>
              <Plus className="mr-2 h-4 w-4" />
              新章节
            </Link>
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
