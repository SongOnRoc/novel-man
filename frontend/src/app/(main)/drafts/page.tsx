"use client";

import { FilePlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useMemo } from "react";
import { toast } from "sonner";

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
import { DraftCard } from "@/features/drafts/components/DraftCard";
import {
  useDraftList,
  useDeleteDraft,
  usePublishDraft,
} from "@/hooks/draft/useDraftService";
import { useWorkList } from "@/hooks/work/useWorkService";
import { DraftForClient } from "@/lib/services/draft.service";
import { WorksList } from "@/lib/services/work.service";

type DraftType = "all" | "chapter" | "note";

export default function DraftsPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const router = useRouter();

  const workId = searchParams.get("workId");
  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const selectedWorkId = useMemo(
    () => (workId ? parseInt(workId, 10) : undefined),
    [workId]
  );

  const [draftType, setDraftType] = useState<DraftType>("all");
  const { data: draftsResponse, isLoading } = useDraftList({
    workId: selectedWorkId,
    page: page,
  });
  const { data: worksResponse, isLoading: isLoadingWorks } = useWorkList({});
  const deleteDraftMutation = useDeleteDraft();
  const publishDraftMutation = usePublishDraft();

  const drafts = draftsResponse?.data || [];
  const pagination = draftsResponse?.pagination;
  const works = (worksResponse as WorksList)?.data || [];

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) {
      return 1;
    }
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  const handleDelete = (id: number): void => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      deleteDraftMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Draft deleted successfully");
        },
        onError: (error) => {
          toast.error(`Failed to delete draft: ${error.message}`);
        },
      });
    }
  };

  const handlePublish = (id: number): void => {
    if (window.confirm("Are you sure you want to publish this draft?")) {
      publishDraftMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Draft published successfully");
        },
        onError: (error) => {
          toast.error(`Failed to publish draft: ${error.message}`);
        },
      });
    }
  };

  const handleSelectWork = (workId: string): void => {
    router.push(`/drafts?workId=${workId}&page=1`);
  };

  const handlePageChange = (newPage: number): void => {
    router.push(`/drafts?workId=${selectedWorkId}&page=${newPage}`);
  };

  const renderContent = (): React.ReactElement => {
    if (!selectedWorkId) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <h2 className="text-2xl font-semibold">Please select a work</h2>
          <p className="mb-4 mt-2 text-muted-foreground">
            Select a work to manage its drafts.
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      );
    }

    if (drafts.length > 0) {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                works={works}
                onDelete={() => handleDelete(draft.id!)}
                onPublish={() => handlePublish(draft.id!)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page - 1);
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
                          handlePageChange(pageNumber);
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
                        handlePageChange(page + 1);
                      }}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h2 className="text-2xl font-semibold">No Drafts</h2>
        <p className="mb-4 mt-2 text-muted-foreground">
          You haven't created any drafts yet for this work.
        </p>
        <Button asChild>
          <Link href={`/drafts/new?workId=${selectedWorkId}`}>
            <FilePlus className="mr-2 h-4 w-4" />
            New Draft
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
          <p className="text-muted-foreground">
            Manage your drafts, convert them to chapters, or continue editing.
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
            <Link href={`/drafts/new?workId=${selectedWorkId}`}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Draft
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={draftType}
        onValueChange={(value) => setDraftType(value as DraftType)}
      >
        <TabsList>
          <TabsTrigger value="all">All Drafts</TabsTrigger>
          <TabsTrigger value="chapter">Chapter Drafts</TabsTrigger>
          <TabsTrigger value="note">Note Drafts</TabsTrigger>
        </TabsList>
        <TabsContent value={draftType}>{renderContent()}</TabsContent>
      </Tabs>
    </div>
  );
}
