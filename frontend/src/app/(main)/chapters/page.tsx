"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChapterList } from "@/features/chapters/components/chapter-list";
import { useWorkList } from "@/hooks/work/useWorkService";
import { useChapterList } from "@/hooks/chapter/useChapterService";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { WorksList } from "@/lib/services/work.service";
import { ChapterListResponse } from "@/lib/services/chapter.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ChapterContentProps {
  workId: number;
  page: number;
  onPageChange: (newPage: number) => void;
}

const ChapterContent = ({
  workId,
  page,
  onPageChange,
}: ChapterContentProps) => {
  const { data: chaptersResponse, isLoading: isLoadingChapters } =
    useChapterList({
      work_id: workId,
      page: page,
    });
  const chapters = (chaptersResponse as ChapterListResponse)?.data || [];
  const pagination = (chaptersResponse as ChapterListResponse)?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) {
      return 1;
    }
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  if (isLoadingChapters) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (chapters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-2xl font-semibold">No Chapters</h2>
        <p className="mb-4 mt-2 text-muted-foreground">
          This work does not have any chapters yet.
        </p>
        <Button asChild>
          <Link href={`/chapters/new?workId=${workId}`}>
            Create the first chapter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChapterList workId={workId} chapters={chapters} />
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page - 1);
                  }}
                />
              </PaginationItem>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(pageNumber);
                    }}
                    isActive={page === pageNumber}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            {page < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(page + 1);
                  }}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default function ChaptersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: worksResponse, isLoading: isLoadingWorks } = useWorkList({});
  const works = (worksResponse as WorksList)?.data || [];

  const workId = searchParams.get("workId");
  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const selectedWorkId = useMemo(
    () => (workId ? parseInt(workId, 10) : undefined),
    [workId]
  );

  const handleSelectWork = (workId: string) => {
    router.push(`/chapters?workId=${workId}&page=1`);
  };

  const handlePageChange = (newPage: number) => {
    router.push(`/chapters?workId=${selectedWorkId}&page=${newPage}`);
  };

  const renderContent = () => {
    if (isLoadingWorks) {
      return <Skeleton className="h-[400px] w-full" />;
    }

    if (!selectedWorkId) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">Please select a work</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            Select a work to manage its chapters.
          </p>
        </div>
      );
    }

    return (
      <ChapterContent
        workId={selectedWorkId}
        page={page}
        onPageChange={handlePageChange}
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
            Manage your work&apos;s chapters, create new ones, or edit existing ones.
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
          <Button asChild disabled={!selectedWorkId}>
            <Link href={`/chapters/new?workId=${selectedWorkId}`}>
              New Chapter
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/works">Back to Works</Link>
          </Button>
        </div>
      </div>
      {renderContent()}
    </div>
  );
}
