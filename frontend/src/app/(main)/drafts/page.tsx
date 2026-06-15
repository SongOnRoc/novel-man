"use client";

import { FilePlus, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { DraftCard } from "@/features/drafts/components/DraftCard";
import { DraftList } from "@/features/drafts/components/DraftList";
import { DraftToolbar } from "@/features/drafts/components/DraftToolbar";
import { NewDraftDialog } from "@/features/drafts/components/NewDraftDialog";
import { PublishDraftDialog } from "@/features/drafts/components/PublishDraftDialog";
import { useDraftCreationController } from "@/features/drafts/hooks/useDraftCreationController";
import { useDebounce } from "@/hooks/useDebounce";
import { useChapterList } from "@/hooks/chapter/useChapterService";
import {
  useCreateDraft,
  useDraftList,
  useDeleteDraft,
  usePublishDraft,
  useUpdateDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import { DraftForClient } from "@/lib/services/draft.service";
import { Work, WorksList } from "@/lib/services/work.service";

const UNLINKED_DRAFTS_WORK_ID = 0;

type ViewMode = "list" | "grid";

const getGlobalDraftEditHref = (draft: DraftForClient): string => `/drafts/${draft.id}/edit`;

const DraftsContent = ({
  page,
  view,
  searchQuery,
  works,
  onPageChange,
  onDelete,
  onPublish,
  onCreateDraft,
}: {
  page: number;
  view: ViewMode;
  searchQuery: string;
  works: Work[];
  onPageChange: (newPage: number) => void;
  onDelete: (draft: DraftForClient) => void;
  onPublish: (draft: DraftForClient) => void;
  onCreateDraft: () => void;
}) => {
  const { data: draftsResponse, isLoading } = useDraftList({
    workId: UNLINKED_DRAFTS_WORK_ID,
    page: page,
    limit: 10,
    q: searchQuery || undefined,
  });

  const displayDrafts = draftsResponse?.data || [];
  const totalPages = useMemo(() => {
    const total = draftsResponse?.pagination?.total || 0;
    return Math.ceil(total / 10) || 1;
  }, [draftsResponse]);

  if (isLoading) {
    return <GlobalLoading fullScreen={false} />;
  }
  if (displayDrafts.length === 0) {
    if (searchQuery) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
          <div className="mb-4 rounded-full bg-muted/30 p-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            未找到匹配结果
          </h3>
          <p className="mt-2 text-muted-foreground max-w-sm">
            未找到与 "{searchQuery}" 相关的草稿。
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={() => onPageChange(1)}>
              清除搜索
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--primary-200)]/60 bg-[var(--primary-50)]/40 p-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          灵感空空如也
        </h2>
        <p className="mb-6 mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          不要让灵感溜走。无论是只言片语还是宏大构想，这里都是它们最好的归宿。
        </p>
        <Button
          type="button"
          size="lg"
          onClick={onCreateDraft}
          className="h-11 rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <FilePlus className="mr-2 h-4 w-4" />
          开始创作
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {view === "list" ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DraftList
            drafts={displayDrafts}
            onDelete={onDelete}
            onPublish={onPublish}
            getDraftEditHref={getGlobalDraftEditHref}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayDrafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              workTitle={works.find((w) => w.id === draft.workId)?.title}
              onDelete={() => onDelete(draft)}
              onPublish={() => onPublish(draft)}
              getDraftEditHref={getGlobalDraftEditHref}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center pt-8">
          <Pagination>
            <PaginationContent>
              {page > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => onPageChange(page - 1)} />
                </PaginationItem>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => {
                  // Simple logic to show limited page numbers if too many
                  if (
                    totalPages > 7 &&
                    Math.abs(pageNumber - page) > 2 &&
                    pageNumber !== 1 &&
                    pageNumber !== totalPages
                  ) {
                    if (Math.abs(pageNumber - page) === 3) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNumber)}
                        isActive={page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
              )}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => onPageChange(page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default function DraftsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  // View Mode Persistence
  const [view, setView] = useState<ViewMode>("grid");
  useEffect(() => {
    const saved = localStorage.getItem("drafts-view-mode") as ViewMode;
    if (saved) setView(saved);
  }, []);

  const handleViewChange = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("drafts-view-mode", v);
  };

  // Search Persistence
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }

    // Only update URL if it's different to avoid loops
    if (params.toString() !== searchParams.toString()) {
      // Reset page if search changed
      if ((searchParams.get("q") || "") !== debouncedSearch) {
        params.set("page", "1");
      }
      router.replace(`/drafts?${params.toString()}`);
    }
  }, [debouncedSearch, router, searchParams]);

  const [draftToDelete, setDraftToDelete] = useState<DraftForClient | null>(
    null
  );

  const [draftToPublish, setDraftToPublish] = useState<DraftForClient | null>(null);
  const [isSelectingWork, setIsSelectingWork] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string | undefined>(undefined);

  const { data: worksResponse, isLoading: isLoadingWorks } = useWorkList({ limit: 1000 });
  const works = (worksResponse as WorksList)?.data || [];

  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();
  const { mutate: publishDraft, isPending: isPublishingPending } = usePublishDraft();
  const { mutateAsync: updateDraftAsync, isPending: isSaving } = useUpdateDraft();
  const { mutateAsync: createDraft } = useCreateDraft();

  const selectedWorkIdNumber = selectedWorkId ? parseInt(selectedWorkId, 10) : NaN;
  const isValidSelectedWorkId = Number.isInteger(selectedWorkIdNumber) && selectedWorkIdNumber > 0;
  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapterList({
    workId: isValidSelectedWorkId ? selectedWorkIdNumber : 0,
    page: 1,
    limit: 9999,
  });
  const chapters = chaptersResponse?.data || [];

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/drafts?${params.toString()}`);
  };

  const handlePageChange = (newPage: number): void => {
    updateParams({ page: newPage.toString() });
  };

  const handleConfirmDelete = () => {
    if (draftToDelete) {
      deleteDraft(draftToDelete.id!, {
        onSuccess: () => {
          toast.success("草稿已删除");
          setDraftToDelete(null);
        },
        onError: (error: Error) => {
          toast.error(`删除失败: ${error.message}`);
        },
      });
    }
  };

  const handlePublish = (draft: DraftForClient) => {
    setDraftToPublish(draft);
    if (draft.workId && Number.isInteger(draft.workId) && draft.workId > 0) {
      setSelectedWorkId(String(draft.workId));
    }
    setIsSelectingWork(true);
  };

  const handleNextFromWorkSelect = () => {
    if (!selectedWorkId) {
      toast.error("请选择一个作品进行发布。");
      return;
    }
    setIsSelectingWork(false);
    setIsPublishing(true);
  };

  const handleConfirmPublishWithTitle = async (args: { normalizedTitle: string }) => {
    if (!draftToPublish) {
      return;
    }
    if (!isValidSelectedWorkId) {
      toast.error("请选择一个作品进行发布。");
      return;
    }

    try {
      await updateDraftAsync({
        id: draftToPublish.id!,
        data: {
          workId: selectedWorkIdNumber,
          title: args.normalizedTitle,
        },
      });
    } catch (updateError) {
      toast.error(`发布前更新草稿失败: ${(updateError as Error).message}`);
      return;
    }

    publishDraft(draftToPublish.id!, {
      onSuccess: () => {
        toast.success(`草稿“${draftToPublish.title || "无标题草稿"}”已发布`);
        setIsPublishing(false);
        setDraftToPublish(null);
        router.push(`/works/${selectedWorkIdNumber}/chapters`);
      },
      onError: (error: Error) => {
        toast.error(`发布失败: ${error.message}`);
      },
    });
  };

  const {
    open,
    isCreating,
    values,
    errorMessage,
    openDialog,
    closeDialog,
    updateValues,
    confirmCreate,
  } = useDraftCreationController({
    createDraft,
    onNavigate: (path) => router.push(path),
    // 关联了作品 → 跳作品草稿编辑页（草稿归属该作品，不在全局列表）；
    // 未关联 → 跳全局草稿编辑页（保持全局草稿）。
    getDraftEditPath: (draftId, workId) =>
      workId
        ? `/works/${workId}/drafts/${draftId}/edit`
        : `/drafts/${draftId}/edit`,
  });

  const renderContent = (): React.ReactElement => {
    if (isLoadingWorks) {
      return <GlobalLoading fullScreen={false} />;
    }
    return (
      <DraftsContent
        page={page}
        view={view}
        searchQuery={searchQuery}
        onPageChange={handlePageChange}
        onDelete={setDraftToDelete}
        onPublish={handlePublish}
        onCreateDraft={() => openDialog()}
        works={works}
      />
    );
  };

  return (
    <>
      <div className="space-y-4 pb-12 animate-in fade-in duration-500 sm:space-y-5">
        <section className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-5 sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block"
          />
          <div className="relative space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
              <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
                <Sparkles className="h-3 w-3" />
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
                灵感沉淀
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              灵感草稿箱
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              这里只保留未关联作品的灵感草稿，方便统一沉淀零散想法。
            </p>
          </div>

          <div className="relative mt-4 sm:mt-5">
            <DraftToolbar
              viewMode={view}
              onViewModeChange={handleViewChange}
              onCreateDraft={() => openDialog()}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </section>

        <div className="min-h-[500px]">{renderContent()}</div>
      </div>

      {draftToDelete && (
        <DeleteItemDialog
          open={!!draftToDelete}
          onOpenChange={(open) => !open && setDraftToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          itemName={draftToDelete.title!}
          itemType="草稿"
        />
      )}

      {draftToPublish ? (
        <AlertDialog
          open={isSelectingWork}
          onOpenChange={(nextOpen) => {
            setIsSelectingWork(nextOpen);
            if (!nextOpen) {
              setIsPublishing(false);
              setDraftToPublish(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>发布为新章节</AlertDialogTitle>
              <AlertDialogDescription>
                请为这篇草稿选择要发布到的作品。发布时系统会提示将发布为第X章，并自动修正冲突章号。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Select onValueChange={setSelectedWorkId} defaultValue={selectedWorkId}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择关联作品" />
                </SelectTrigger>
                <SelectContent>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id!.toString()}>
                      {work.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleNextFromWorkSelect}>
                下一步
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {draftToPublish ? (
        <PublishDraftDialog
          open={isPublishing}
          onOpenChange={(nextOpen) => {
            setIsPublishing(nextOpen);
            if (!nextOpen) {
              setDraftToPublish(null);
            }
          }}
          draft={draftToPublish}
          workId={isValidSelectedWorkId ? selectedWorkIdNumber : 0}
          chapters={chapters}
          isPending={isSaving || isLoadingChapters || isPublishingPending}
          onConfirm={({ normalizedTitle }) => handleConfirmPublishWithTitle({ normalizedTitle })}
        />
      ) : null}

      <NewDraftDialog
        open={open}
        isCreating={isCreating}
        works={works}
        values={values}
        errorMessage={errorMessage}
        onOpenChange={(next) => {
          if (next) {
            openDialog();
            return;
          }
          closeDialog();
        }}
        onValuesChange={updateValues}
        onConfirm={confirmCreate}
      />
    </>
  );
}
