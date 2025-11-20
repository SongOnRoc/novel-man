"use client";

import { FilePlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo, useEffect } from "react";
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
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { DraftCard } from "@/features/drafts/components/DraftCard";
import { DraftList } from "@/features/drafts/components/DraftList";
import { DraftToolbar } from "@/features/drafts/components/DraftToolbar";
import { useDebounce } from "@/hooks/useDebounce";
import {
  useDraftList,
  useDeleteDraft,
  usePublishDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import { DraftForClient } from "@/lib/services/draft.service";
import { Work, WorksList } from "@/lib/services/work.service";

type ViewMode = "list" | "grid";

const DraftsContent = ({
  workId,
  page,
  view,
  searchQuery,
  works,
  onPageChange,
  onDelete,
  onPublish,
}: {
  workId?: number;
  page: number;
  view: ViewMode;
  searchQuery: string;
  works: Work[];
  onPageChange: (newPage: number) => void;
  onDelete: (draft: DraftForClient) => void;
  onPublish: (draft: DraftForClient) => void;
}) => {
  // Determine if we are filtering by "Other Drafts" (workId=0)
  // workId=0 means drafts without a work association
  // Backend now supports work_id=0 to filter drafts with work_id IS NULL
  const apiWorkId = workId;

  const { data: draftsResponse, isLoading } = useDraftList({
    workId: apiWorkId,
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
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/10 bg-primary/5 p-20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-8 rounded-full bg-background p-6 shadow-xl shadow-primary/5 ring-1 ring-primary/10">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {workId ? "这部作品暂无草稿" : "灵感空空如也"}
        </h2>
        <p className="mb-8 mt-3 max-w-md text-muted-foreground leading-relaxed">
          {workId
            ? "每一个伟大的故事都始于一个微小的想法。现在就开始记录，让灵感生根发芽。"
            : "不要让灵感溜走。无论是只言片语还是宏大构想，这里都是它们最好的归宿。"}
        </p>
        <Button
          asChild
          size="lg"
          className="h-12 rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30"
        >
          <Link href={workId ? `/drafts/new?workId=${workId}` : "/drafts/new"}>
            <FilePlus className="mr-2 h-5 w-5" />
            开始创作
          </Link>
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

  const { data: worksResponse, isLoading: isLoadingWorks } = useWorkList({});
  const works = (worksResponse as WorksList)?.data || [];

  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();
  const { mutate: publishDraft } = usePublishDraft();

  const workId = searchParams.get("workId");
  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const selectedWorkId = useMemo(
    () => (workId ? parseInt(workId, 10) : undefined),
    [workId]
  );

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/drafts?${params.toString()}`);
  };

  const handleSelectWork = (wid: string): void => {
    updateParams({
      workId: wid === "all" ? null : wid,
      page: "1",
    });
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
    publishDraft(draft.id!, {
      onSuccess: () => {
        toast.success(`草稿 "${draft.title}" 已发布`);
      },
      onError: (error: Error) => {
        toast.error(`发布失败: ${error.message}`);
      },
    });
  };

  const renderContent = (): React.ReactElement => {
    if (isLoadingWorks) {
      return <GlobalLoading fullScreen={false} />;
    }
    return (
      <DraftsContent
        workId={selectedWorkId}
        page={page}
        view={view}
        searchQuery={searchQuery}
        onPageChange={handlePageChange}
        onDelete={setDraftToDelete}
        onPublish={handlePublish}
        works={works}
      />
    );
  };

  return (
    <>
      <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              灵感草稿箱
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              捕捉稍纵即逝的想法，将碎片化的灵感编织成动人的故事。
            </p>
          </div>

          <DraftToolbar
            viewMode={view}
            onViewModeChange={handleViewChange}
            workId={workId ?? "all"}
            onWorkIdChange={handleSelectWork}
            works={works}
            newDraftHref={
              selectedWorkId
                ? `/drafts/new?workId=${selectedWorkId}`
                : "/drafts/new"
            }
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

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
    </>
  );
}
