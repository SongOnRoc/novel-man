"use client";

import { FilePlus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { GlobalLoading } from "@/components/common/GlobalLoading";
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
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { DraftCard } from "@/features/drafts/components/DraftCard";
import { DraftList } from "@/features/drafts/components/DraftList";
import { DraftToolbar } from "@/features/drafts/components/DraftToolbar";
import { BatchPublishDraftsDialog } from "@/features/drafts/components/BatchPublishDraftsDialog";
import { ImportInspirationDialog } from "@/features/drafts/components/ImportInspirationDialog";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useDeleteDraft,
  useDraftList,
  usePublishDraft,
  useUpdateDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkById } from "@/hooks/work/useWorkService";
import { DraftForClient } from "@/lib/services/draft.service";
import { PublishDraftDialog } from "@/features/drafts/components/PublishDraftDialog";
import { useChapterList } from "@/hooks/chapter/useChapterService";

type ViewMode = "list" | "grid";

const getWorkDraftEditHref = (workId: number, draft: DraftForClient): string =>
  `/works/${workId}/drafts/${draft.id}/edit`;

export default function WorkDraftsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumb } = useBreadcrumb();

  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;

  const [view, setView] = useState<ViewMode>("grid");
  useEffect(() => {
    const saved = localStorage.getItem("work-drafts-view-mode") as ViewMode | null;
    if (saved) {
      setView(saved);
    }
  }, []);

  const handleViewChange = (nextView: ViewMode) => {
    setView(nextView);
    localStorage.setItem("work-drafts-view-mode", nextView);
  };

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (!isValidWorkId) {
      return;
    }

    const currentQuery = searchParams.get("q") || "";
    if (currentQuery === debouncedSearch) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      nextParams.set("q", debouncedSearch);
    } else {
      nextParams.delete("q");
    }
    nextParams.set("page", "1");

    router.replace(`/works/${workId}/drafts?${nextParams.toString()}`);
  }, [debouncedSearch, isValidWorkId, router, searchParams, workId]);

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
    return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  }, [searchParams]);

  const { data: work, isLoading: isLoadingWork } = useWorkById(isValidWorkId ? workId : undefined);
  const { data: draftsResponse, isLoading: isLoadingDrafts } = useDraftList({
    workId: isValidWorkId ? workId : undefined,
    page,
    limit: 10,
    q: debouncedSearch || undefined,
  });
  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();
  const { mutate: publishDraft, isPending: isPublishingPending } = usePublishDraft();
  const { mutateAsync: updateDraftAsync, isPending: isSaving } = useUpdateDraft();
  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapterList({
    workId: isValidWorkId ? workId : 0,
    page: 1,
    limit: 9999,
  });
  const chapters = chaptersResponse?.data || [];

  const [draftToDelete, setDraftToDelete] = useState<DraftForClient | null>(null);
  const [draftToPublish, setDraftToPublish] = useState<DraftForClient | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBatchPublishOpen, setIsBatchPublishOpen] = useState(false);

  useEffect(() => {
    if (work && isValidWorkId) {
      setBreadcrumb(`works-${workId}`, work.title || "作品草稿");
    }
  }, [isValidWorkId, setBreadcrumb, work, workId]);

  const drafts = draftsResponse?.data || [];
  const totalPages = useMemo(() => {
    const total = draftsResponse?.pagination?.total || 0;
    return Math.ceil(total / 10) || 1;
  }, [draftsResponse]);

  const updateParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });
    router.push(`/works/${workId}/drafts?${nextParams.toString()}`);
  };

  const handlePageChange = (newPage: number): void => {
    updateParams({ page: newPage.toString() });
  };

  const handleConfirmDelete = () => {
    if (!draftToDelete) {
      return;
    }

    deleteDraft(draftToDelete.id!, {
      onSuccess: () => {
        toast.success("草稿已删除");
        setDraftToDelete(null);
      },
      onError: (error: Error) => {
        toast.error(`删除失败: ${error.message}`);
      },
    });
  };

  const handlePublish = (draft: DraftForClient) => {
    setDraftToPublish(draft);
  };

  const handleConfirmPublish = async (args: { normalizedTitle: string }) => {
    if (!draftToPublish) {
      return;
    }

    try {
      await updateDraftAsync({
        id: draftToPublish.id!,
        data: {
          title: args.normalizedTitle,
        },
      });
    } catch (updateError) {
      toast.error(`发布前更新草稿标题失败: ${(updateError as Error).message}`);
      return;
    }

    publishDraft(draftToPublish.id!, {
      onSuccess: () => {
        toast.success(`草稿“${draftToPublish.title || "无标题草稿"}”已发布`);
        setDraftToPublish(null);
        router.push(`/works/${workId}/chapters`);
      },
      onError: (error: Error) => {
        toast.error(`发布失败: ${error.message}`);
      },
    });
  };

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

  if (isLoadingWork) {
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
    <>
      <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
        <PageHeader
          title={work.title || "草稿管理"}
          description="管理当前作品下的创作草稿，并在准备就绪后发布为正式章节。"
          backButton={{ href: `/works/${workId}`, label: "返回作品" }}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setIsBatchPublishOpen(true)}>
                <Send className="mr-2 h-4 w-4" />
                批量发布
              </Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                引入灵感
              </Button>
              <Button asChild>
                <Link href={`/works/${workId}/drafts/new`}>
                  <FilePlus className="mr-2 h-4 w-4" />
                  新建
                </Link>
              </Button>
            </div>
          }
        />

        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold">作品草稿列表</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                这里只显示已关联当前作品的草稿，保持当前作品下的独立创作视图。
              </p>
            </div>
            <DraftToolbar
              viewMode={view}
              onViewModeChange={handleViewChange}
              onCreateDraft={() => router.push(`/works/${workId}/drafts/new`)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {isLoadingDrafts ? (
            <GlobalLoading fullScreen={false} />
          ) : drafts.length > 0 ? (
            <div className="space-y-8">
              {view === "list" ? (
                <DraftList
                  drafts={drafts}
                  onDelete={setDraftToDelete}
                  onPublish={handlePublish}
                  getDraftEditHref={(draft) => getWorkDraftEditHref(workId, draft)}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {drafts.map((draft) => (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      workTitle={work.title}
                      onDelete={() => setDraftToDelete(draft)}
                      onPublish={() => handlePublish(draft)}
                      getDraftEditHref={(currentDraft) => getWorkDraftEditHref(workId, currentDraft)}
                    />
                  ))}
                </div>
              )}

              {totalPages > 1 ? (
                <div className="flex justify-center pt-2">
                  <Pagination>
                    <PaginationContent>
                      {page > 1 ? (
                        <PaginationItem>
                          <PaginationPrevious onClick={() => handlePageChange(page - 1)} />
                        </PaginationItem>
                      ) : null}
                      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={page === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {page < totalPages ? (
                        <PaginationItem>
                          <PaginationNext onClick={() => handlePageChange(page + 1)} />
                        </PaginationItem>
                      ) : null}
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </div>
          ) : debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-muted/30 p-4">
                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">未找到匹配结果</h3>
              <p className="mt-2 max-w-sm text-muted-foreground">
                当前作品下未找到与“{debouncedSearch}”相关的草稿。
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
              <h2 className="text-2xl font-semibold">这部作品暂无草稿</h2>
              <p className="mb-6 mt-2 text-muted-foreground">
                可以直接在作品上下文中创建草稿，后续再从这里继续编辑或发布为章节。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href={`/works/${workId}/drafts/new`}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    新建
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  引入灵感
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {draftToDelete ? (
        <DeleteItemDialog
          open={!!draftToDelete}
          onOpenChange={(nextOpen) => !nextOpen && setDraftToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          itemName={draftToDelete.title || "无标题草稿"}
          itemType="草稿"
        />
      ) : null}

      {draftToPublish ? (
        <PublishDraftDialog
          open={!!draftToPublish}
          onOpenChange={(nextOpen) => !nextOpen && setDraftToPublish(null)}
          draft={draftToPublish}
          workId={workId}
          chapters={chapters}
          isPending={isLoadingChapters || isSaving || isPublishingPending}
          onConfirm={({ normalizedTitle }) => handleConfirmPublish({ normalizedTitle })}
        />
      ) : null}

      <ImportInspirationDialog
        workId={workId}
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
      />

      <BatchPublishDraftsDialog
        workId={workId}
        open={isBatchPublishOpen}
        onOpenChange={setIsBatchPublishOpen}
      />
    </>
  );
}
