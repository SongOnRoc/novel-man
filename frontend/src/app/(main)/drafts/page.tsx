"use client";

import { FilePlus, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { DraftCard } from "@/features/drafts/components/DraftCard";
import { DraftList } from "@/features/drafts/components/DraftList";
import {
  useDraftList,
  useDeleteDraft,
  usePublishDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import { DraftForClient } from "@/lib/services/draft.service";
import { Work, WorksList } from "@/lib/services/work.service";

type DraftType = "all" | "chapter" | "note";
type ViewMode = "list" | "grid";

const DraftsContent = ({
  workId,
  page,
  view,
  onPageChange,
  onDelete,
  onPublish,
  works,
}: {
  workId?: number;
  page: number;
  view: ViewMode;
  works: Work[];
  onPageChange: (newPage: number) => void;
  onDelete: (draft: DraftForClient) => void;
  onPublish: (draft: DraftForClient) => void;
}) => {
  // If workId is 0 ("Other Drafts"), fetch all drafts from the backend.
  // The filtering for "Other Drafts" will be done on the client side.
  const apiWorkId = workId === 0 ? undefined : workId;
  const { data: draftsResponse, isLoading } = useDraftList({
    workId: apiWorkId,
    page,
  });
  const allDrafts = draftsResponse?.data || [];

  // Client-side filtering for "Other Drafts"
  const drafts = useMemo(() => {
    if (workId === 0) {
      return allDrafts.filter((draft) => !draft.workId);
    }
    return allDrafts;
  }, [allDrafts, workId]);
  const pagination = draftsResponse?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  if (isLoading) {
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
            className={view === "grid" ? "h-48 w-full" : "h-16 w-full"}
          />
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center">
        <h2 className="text-2xl font-semibold">暂无草稿</h2>
        <p className="mb-6 mt-2 text-muted-foreground">
          {workId
            ? "这部作品还没有任何草稿，立即开始创作吧！"
            : "您还没有任何草稿，开始新的创作吧！"}
        </p>
        <Button asChild>
          <Link href={workId ? `/drafts/new?workId=${workId}` : "/drafts/new"}>
            <FilePlus className="mr-2 h-4 w-4" />
            创建新草稿
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === "list" ? (
        <DraftList
          drafts={drafts}
          onDelete={onDelete}
          onPublish={onPublish}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {drafts.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              workTitle={
                works.find((w) => w.id === draft.workId)?.title
              }
              onDelete={() => onDelete(draft)}
              onPublish={() => onPublish(draft)}
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

export default function DraftsPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("grid");
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

  const handleSelectWork = (workId: string): void => {
    if (workId === "all") {
      router.push(`/drafts?page=1`);
    } else {
      router.push(`/drafts?workId=${workId}&page=1`);
    }
  };

  const handlePageChange = (newPage: number): void => {
    const query = new URLSearchParams();
    if (selectedWorkId) {
      query.set("workId", selectedWorkId.toString());
    }
    query.set("page", newPage.toString());
    router.push(`/drafts?${query.toString()}`);
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
      return <Skeleton className="h-[400px] w-full" />;
    }
    return (
      <DraftsContent
        workId={selectedWorkId}
        page={page}
        view={view}
        onPageChange={handlePageChange}
        onDelete={setDraftToDelete}
        onPublish={handlePublish}
        works={works}
      />
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">草稿箱</h1>
            <p className="text-muted-foreground">
              管理您的草稿，将它们转化为章节，或继续您的创作。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              onValueChange={handleSelectWork}
              value={workId ?? "all"}
            >
              <SelectTrigger className="w-auto min-w-[180px]">
                <SelectValue placeholder="选择作品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部作品</SelectItem>
                <SelectItem value="0">其他草稿</SelectItem>
                {works?.map((work) => (
                  <SelectItem key={work.id} value={work.id!.toString()}>
                    {work.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Button asChild>
              <Link
                href={
                  selectedWorkId
                    ? `/drafts/new?workId=${selectedWorkId}`
                    : "/drafts/new"
                }
              >
                <FilePlus className="mr-2 h-4 w-4" />
                新草稿
              </Link>
            </Button>
          </div>
        </div>
        {renderContent()}
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

