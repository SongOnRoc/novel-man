"use client";

import { Plus, Upload } from "lucide-react";
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
import { TOCChapterList } from "./components/TOCChapterList";
import {
  useChapterList,
  useDeleteChapter,
  useImportChapters,
} from "@/hooks/chapter/useChapterService";
import { ImportDialog } from "@/components/common/ImportDialog";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";
import { GlobalLoading } from "@/components/common/GlobalLoading";

export default function ChaptersPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { setBreadcrumb } = useBreadcrumb();
  const [chapterToDelete, setChapterToDelete] =
    useState<ChapterForClient | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
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

  const { data: chaptersResponse, isLoading: isLoadingChapters } =
    useChapterList({ workId, page });
  const chapters = chaptersResponse?.data || [];
  const pagination = chaptersResponse?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

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
    setIsImportDialogOpen(false);
  };

  if (!isValidWorkId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">请从作品列表重新进入章节管理页面。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>返回作品列表</Button>
      </div>
    );
  }

  if (!isLoadingWork && !work) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品不存在</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>返回作品列表</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title={work?.title || "章节列表"}
        description="管理您的作品章节，创建新章节，或编辑现有章节。"
        showBackButton={true}
        backHref={`/works/${workId}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              导入章节
            </Button>
            <Button asChild>
              <Link href={`/drafts?workId=${workId}`}>
                <Plus className="mr-2 h-4 w-4" />
                新章节
              </Link>
            </Button>
          </div>
        }
      />

      {isLoadingChapters ? (
        <GlobalLoading fullScreen={false} />
      ) : chapters.length > 0 ? (
        <div className="space-y-6">
          <TOCChapterList 
            chapters={chapters} 
            workId={workId} 
            onDelete={setChapterToDelete} 
          />
          
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(page + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
          <h2 className="text-2xl font-semibold">暂无章节</h2>
          <p className="mb-6 mt-2 text-muted-foreground">
            这部作品还没有任何章节，立即开始创作吧！
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              导入章节
            </Button>
            <Button asChild>
              <Link href={`/drafts?workId=${workId}`}>
                <Plus className="mr-2 h-4 w-4" />
                创建第一章
              </Link>
            </Button>
          </div>
        </div>
      )}
      
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
    </div>
  );
}
