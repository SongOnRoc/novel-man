"use client";

import { FilePlus, LayoutGrid, List, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
import { GlobalLoading } from "@/components/common/GlobalLoading";
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
    return <GlobalLoading fullScreen={false} />;
  }

  if (drafts.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-primary/10 bg-primary/5 p-20 text-center"
      >
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
        <Button asChild size="lg" className="h-12 rounded-full px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30">
          <Link href={workId ? `/drafts/new?workId=${workId}` : "/drafts/new"}>
            <FilePlus className="mr-2 h-5 w-5" />
            开始创作
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {view === "list" ? (
        <DraftList
          drafts={drafts}
          onDelete={onDelete}
          onPublish={onPublish}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        <div className="flex justify-center pt-8">
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
        </div>
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
      return <GlobalLoading fullScreen={false} />;
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
      <div className="min-h-screen space-y-10 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              灵感草稿箱
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              捕捉稍纵即逝的想法，将碎片化的灵感编织成动人的故事。
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-background/50 p-2 rounded-2xl backdrop-blur-sm border border-border/40">
            <Select
              onValueChange={handleSelectWork}
              value={workId ?? "all"}
            >
              <SelectTrigger className="w-full sm:w-[180px] border-0 bg-transparent focus:ring-0 hover:bg-muted/50 transition-colors">
                <SelectValue placeholder="筛选作品" />
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
            
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
            
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) => value && setView(value as ViewMode)}
              className="bg-muted/30 p-1 rounded-lg"
            >
              <ToggleGroupItem value="list" aria-label="列表视图" size="sm" className="rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="网格视图" size="sm" className="rounded-md data-[state=on]:bg-background data-[state=on]:shadow-sm transition-all">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <Button asChild className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30">
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
        
        <div className="min-h-[500px]">
          {renderContent()}
        </div>
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

