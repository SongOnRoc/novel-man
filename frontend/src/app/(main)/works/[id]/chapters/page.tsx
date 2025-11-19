"use client";

import { LayoutGrid, List, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import React, { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChapterCard } from "@/features/chapters/components/ChapterCard";
import { ChapterList } from "@/features/chapters/components/chapter-list";
import {
  useChapterList,
  useDeleteChapter,
  useImportChapters,
} from "@/hooks/chapter/useChapterService";
import { ImportDialog } from "@/components/common/ImportDialog";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";

type ViewMode = "list" | "grid";

interface ChapterContentProps {
  workId: number;
  page: number;
  view: ViewMode;
  onPageChange: (newPage: number) => void;
  onDelete: (chapter: ChapterForClient) => void;
  onImportClick: () => void;
}

const ChapterContent = ({
  workId,
  page,
  view,
  onPageChange,
  onDelete,
  onImportClick,
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
        <div className="flex gap-4">
          <Button variant="outline" onClick={onImportClick}>
            导入章节
          </Button>
          <Button asChild>
            <Link href={`/drafts/new?workId=${workId}`}>
              <Plus className="mr-2 h-4 w-4" />
              创建第一章
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" ? (
        <ChapterList chapters={chapters} onDelete={onDelete} workId={workId} />
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
  const params = useParams();
  const searchParams = useSearchParams();
  const { setBreadcrumb } = useBreadcrumb();
  const [view, setView] = useState<ViewMode>("list");
  const [chapterToDelete, setChapterToDelete] =
    useState<ChapterForClient | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const { data: work, isLoading: isLoadingWork } = useWorkById(workId);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "章节列表");
    }
  }, [work, workId, setBreadcrumb]);

  const { mutate: deleteChapter, isPending: isDeleting } = useDeleteChapter();
  const { mutateAsync: importChaptersAsync, isPending: isImporting } = useImportChapters();

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const handlePageChange = (newPage: number): void => {
    if (isNaN(workId)) return;
    router.push(`/works/${workId}/chapters?page=${newPage}`);
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

  const handleImport = async (file: File) => {
    if (isNaN(workId)) throw new Error("Invalid Work ID");
    return importChaptersAsync({ workId, file });
  };

  const handleImportSuccess = (result: any) => {
    // ImportDialog handles the toast for success/failure counts
    // We just need to close the dialog
    setIsImportDialogOpen(false);
  };

  if (isLoadingWork || isNaN(workId)) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={work?.title || "章节列表"}
          description="管理您的作品章节，创建新章节，或编辑现有章节。"
          showBackButton={true}
          actions={
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(value) =>
                  value && setView(value as ViewMode)
                }
              >
                <ToggleGroupItem value="list" aria-label="列表视图">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="网格视图">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                导入章节
              </Button>
              <Button asChild>
                <Link href={`/drafts/new?workId=${workId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  新章节
                </Link>
              </Button>
            </div>
          }
        />
        <ChapterContent
          workId={workId}
          page={page}
          view={view}
          onPageChange={handlePageChange}
          onDelete={setChapterToDelete}
          onImportClick={() => setIsImportDialogOpen(true)}
        />
      </div>
      
      <ImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImport}
        onSuccess={handleImportSuccess}
        title="导入章节"
        description="支持导入 .txt, .md, .json, .zip 格式的文件。如果是压缩包，将自动解压并导入其中的章节。"
        allowedTypes={[".txt", ".md", ".json", ".zip"]}
        isUploading={isImporting}
      />

      {chapterToDelete && (
        <DeleteItemDialog
          open={!!chapterToDelete}
          onOpenChange={(open) => !open && setChapterToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          itemName={chapterToDelete.title!}
          itemType="章节"
        />
      )}
    </>
  );
}
