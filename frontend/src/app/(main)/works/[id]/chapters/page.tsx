"use client";

import { GripVertical } from "lucide-react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import React, { useMemo, useState, useEffect, useCallback } from "react";
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
import { ChapterDirectoryToolbar } from "@/features/chapters/components/ChapterDirectoryToolbar";
import { ChapterTocTree } from "@/features/chapters/components/ChapterTocTree";
import {
  buildChapterDirectoryGroups,
  paginateDirectoryChapters,
  paginateDirectoryGroups,
  resolveDirectoryPageByCurrentChapter,
  sortDirectoryChapters,
} from "@/features/chapters/lib/chapterDirectory";
import {
  useChapterList,
  useDeleteChapter,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import { ChapterForClient } from "@/lib/services/chapter.service";
import { useWorkById } from "@/hooks/work/useWorkService";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { getChapterNumberStyleTemplate, getEffectiveChapterNumberingConfig } from "@/features/chapters/lib/chapterNumberingStorage";
import { buildChapterReorderPlan } from "@/features/chapters/lib/chapterReorder";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatChapterNumber } from "@/features/chapters/lib/chapterNumbering";

export default function ChaptersPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { setBreadcrumb } = useBreadcrumb();
  const [chapterToDelete, setChapterToDelete] = useState<ChapterForClient | null>(null);
  const [chapterToReorder, setChapterToReorder] = useState<ChapterForClient | null>(null);
  const [targetDisplayOrder, setTargetDisplayOrder] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [manualExpandedKeys, setManualExpandedKeys] = useState<string[]>([]);
  const [hasInitializedExpandedKeys, setHasInitializedExpandedKeys] = useState(false);

  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const { data: work, isLoading: isLoadingWork } = useWorkById(isValidWorkId ? workId : 0);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "章节列表");
    }
  }, [work, workId, setBreadcrumb]);

  const { mutate: deleteChapter, isPending: isDeleting } = useDeleteChapter();
  const { mutateAsync: updateChapterAsync, isPending: isReordering } = useUpdateChapter();

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;

    return Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  }, [searchParams]);

  const order = useMemo(() => {
    const orderParam = searchParams.get("order");
    return orderParam === "desc" ? "desc" : "asc";
  }, [searchParams]);

  const updateParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        nextParams.set(key, value);
      } else {
        nextParams.delete(key);
      }
    });

    router.push(`/works/${workId}/chapters?${nextParams.toString()}`);
  };

  const TREE_PAGE_SIZE = 2;
  const FLAT_PAGE_SIZE = 10;
  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapterList({
    workId: isValidWorkId ? workId : 0,
    page: 1,
    limit: 9999,
  });
  const chapters = chaptersResponse?.data || [];
  const numberingConfig = useMemo(() => getEffectiveChapterNumberingConfig(workId), [workId]);
  const styleTemplate = useMemo(() => getChapterNumberStyleTemplate(numberingConfig), [numberingConfig]);

  const sortedChapters = useMemo(() => {
    const next = sortDirectoryChapters(chapters);
    return order === "asc" ? next : next.reverse();
  }, [chapters, order]);

  const hasVolumeData = useMemo(
    () => sortedChapters.some((chapter) => typeof chapter.volumeId === "number"),
    [sortedChapters],
  );

  const directoryGroups = useMemo(() => buildChapterDirectoryGroups(sortedChapters), [sortedChapters]);

  const normalizedDirectoryQuery = useMemo(() => directoryQuery.trim().toLowerCase(), [directoryQuery]);

  const filteredDirectoryGroups = useMemo(() => {
    if (!normalizedDirectoryQuery) {
      return directoryGroups;
    }

    return directoryGroups
      .map((group) => {
        const labelMatched = group.label.toLowerCase().includes(normalizedDirectoryQuery);
        if (labelMatched) {
          return group;
        }

        const matchedChapters = group.chapters.filter((chapter) => {
          const title = (chapter.title || "").toLowerCase();
          const displayOrderText = `第 ${chapter.displayOrder ?? ""} 章`;
          return title.includes(normalizedDirectoryQuery) || displayOrderText.toLowerCase().includes(normalizedDirectoryQuery);
        });

        if (matchedChapters.length === 0) {
          return null;
        }

        return {
          ...group,
          chapters: matchedChapters,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);
  }, [directoryGroups, normalizedDirectoryQuery]);

  const filteredFlatChapters = useMemo(() => {
    if (!normalizedDirectoryQuery) {
      return sortedChapters;
    }

    return sortedChapters.filter((chapter) => {
      const title = (chapter.title || "").toLowerCase();
      const displayOrderText = `第 ${chapter.displayOrder ?? ""} 章`;
      return title.includes(normalizedDirectoryQuery) || displayOrderText.toLowerCase().includes(normalizedDirectoryQuery);
    });
  }, [normalizedDirectoryQuery, sortedChapters]);

  const currentChapterId = useMemo(() => {
    const raw = searchParams.get("currentChapterId");
    if (!raw) {
      return undefined;
    }

    const parsed = parseInt(raw, 10);
    return Number.isInteger(parsed) ? parsed : undefined;
  }, [searchParams]);

  const effectivePage = useMemo(() => {
    const resolved = resolveDirectoryPageByCurrentChapter({
      groups: filteredDirectoryGroups,
      chapters: filteredFlatChapters,
      currentChapterId,
      pageSize: hasVolumeData ? TREE_PAGE_SIZE : FLAT_PAGE_SIZE,
      isTreeMode: hasVolumeData,
    });

    return resolved ?? page;
  }, [
    FLAT_PAGE_SIZE,
    TREE_PAGE_SIZE,
    currentChapterId,
    filteredDirectoryGroups,
    filteredFlatChapters,
    hasVolumeData,
    page,
  ]);

  const totalPages = useMemo(() => {
    const totalItems = hasVolumeData ? filteredDirectoryGroups.length : filteredFlatChapters.length;
    const pageSize = hasVolumeData ? TREE_PAGE_SIZE : FLAT_PAGE_SIZE;
    return Math.ceil(totalItems / pageSize) || 1;
  }, [FLAT_PAGE_SIZE, TREE_PAGE_SIZE, filteredDirectoryGroups.length, filteredFlatChapters.length, hasVolumeData]);

  const pagedGroups = useMemo(
    () => paginateDirectoryGroups(filteredDirectoryGroups, effectivePage, TREE_PAGE_SIZE),
    [TREE_PAGE_SIZE, effectivePage, filteredDirectoryGroups],
  );

  const pagedChapters = useMemo(
    () => paginateDirectoryChapters(filteredFlatChapters, effectivePage, FLAT_PAGE_SIZE),
    [FLAT_PAGE_SIZE, effectivePage, filteredFlatChapters],
  );

  useEffect(() => {
    if (!hasVolumeData) {
      return;
    }

    if (hasInitializedExpandedKeys) {
      return;
    }

    setManualExpandedKeys(directoryGroups.map((group) => group.key));
    setHasInitializedExpandedKeys(true);
  }, [directoryGroups, hasInitializedExpandedKeys, hasVolumeData]);

  const searchMatchedKeys = useMemo(() => {
    if (!normalizedDirectoryQuery) {
      return [];
    }

    return pagedGroups.map((group) => group.key);
  }, [normalizedDirectoryQuery, pagedGroups]);
  const currentChapterGroupKey = useMemo(() => {
    if (!currentChapterId) {
      return undefined;
    }

    return filteredDirectoryGroups.find((group) =>
      group.chapters.some((chapter) => chapter.id === currentChapterId),
    )?.key;
  }, [currentChapterId, filteredDirectoryGroups]);

  const expandedKeys = useMemo(() => {
    if (!hasVolumeData) {
      return [];
    }

    const keys = new Set(manualExpandedKeys.filter((key) => pagedGroups.some((group) => group.key === key)));
    searchMatchedKeys.forEach((key) => keys.add(key));
    if (currentChapterGroupKey) {
      keys.add(currentChapterGroupKey);
    }

    return [...keys];
  }, [currentChapterGroupKey, hasVolumeData, manualExpandedKeys, pagedGroups, searchMatchedKeys]);

  const isDirectoryEmptyAfterFilter = hasVolumeData
    ? filteredDirectoryGroups.length === 0
    : filteredFlatChapters.length === 0;

  const handleToggleGroup = useCallback((key: string) => {
    if (normalizedDirectoryQuery) {
      return;
    }

    setManualExpandedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }, [normalizedDirectoryQuery]);

  const handleExpandAll = useCallback(() => {
    setManualExpandedKeys((current) => {
      const next = new Set(current);
      pagedGroups.forEach((group) => next.add(group.key));
      return [...next];
    });
  }, [pagedGroups]);

  const handleCollapseAll = useCallback(() => {
    setManualExpandedKeys((current) => current.filter((key) => !pagedGroups.some((group) => group.key === key)));
  }, [pagedGroups]);

  const handlePageChange = (newPage: number): void => {
    if (isNaN(workId)) return;

      updateParams({
        page: newPage.toString(),
        order,
      });
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

  const reorderPreviewPrefix = useMemo(() => {
    const nextDisplayOrder = parseInt(targetDisplayOrder, 10);
    if (!Number.isInteger(nextDisplayOrder) || nextDisplayOrder <= 0 || nextDisplayOrder > chapters.length) {
      return null;
    }

    try {
      return formatChapterNumber(nextDisplayOrder, styleTemplate, {
        numberFormat: numberingConfig.numberFormat ?? "chinese",
      });
    } catch {
      return null;
    }
  }, [chapters.length, numberingConfig.numberFormat, styleTemplate, targetDisplayOrder]);

  const openReorderDialog = (chapter: ChapterForClient) => {
    setChapterToReorder(chapter);
    setTargetDisplayOrder(String(chapter.displayOrder ?? ""));
  };

  const handleConfirmReorder = async () => {
    if (!chapterToReorder?.id) {
      return;
    }

    const nextDisplayOrder = parseInt(targetDisplayOrder, 10);
    if (!Number.isInteger(nextDisplayOrder) || nextDisplayOrder <= 0 || nextDisplayOrder > chapters.length) {
      toast.error(`目标章节号必须在 1 到 ${chapters.length} 之间`);
      return;
    }

    const currentDisplayOrder = chapterToReorder.displayOrder ?? 0;
    if (currentDisplayOrder === nextDisplayOrder) {
      setChapterToReorder(null);
      return;
    }

    const plan = buildChapterReorderPlan({
      chapters,
      movingChapterId: chapterToReorder.id,
      targetDisplayOrder: nextDisplayOrder,
      styleTemplate,
      numberFormat: numberingConfig.numberFormat ?? "chinese",
    });

    if (plan.updates.length === 0) {
      setChapterToReorder(null);
      return;
    }

    try {
      for (const update of plan.updates) {
        await updateChapterAsync(update);
      }
      toast.success(`已将章节调整为第 ${nextDisplayOrder} 章`);
      setChapterToReorder(null);
    } catch (error) {
      toast.error(`重排失败：${(error as Error).message}；正在刷新章节列表`);
      setChapterToReorder(null);
      router.refresh();
    }
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

  if (isLoadingWork) {
    return <GlobalLoading fullScreen={false} />;
  }

  if (!work) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品不存在</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>返回作品列表</Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
        <PageHeader
          title="章节目录"
          description="快速定位卷章结构，并进入目标章节继续阅读或编辑。"
          backButton={{ href: `/works/${workId}`, label: "返回作品" }}
        />

        <div className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm md:p-6">
          <div className="space-y-6">
             <ChapterDirectoryToolbar
               query={directoryQuery}
               onQueryChange={setDirectoryQuery}
               showTreeControls={hasVolumeData}
               onExpandAll={handleExpandAll}
               onCollapseAll={handleCollapseAll}
             />

           {isLoadingChapters ? (
             <GlobalLoading fullScreen={false} />
           ) : chapters.length > 0 ? (
             <div className="space-y-6">
              {isDirectoryEmptyAfterFilter ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  没有匹配的章节或分卷
                </div>
              ) : (
                <ChapterTocTree
                  groups={pagedGroups}
                  chapters={pagedChapters}
                  isTreeMode={hasVolumeData}
                  expandedKeys={expandedKeys}
                  currentChapterId={currentChapterId}
                  onToggleGroup={handleToggleGroup}
                  workId={workId}
                  onDelete={setChapterToDelete}
                  onReorder={openReorderDialog}
                />
              )}

              {totalPages > 1 && !isDirectoryEmptyAfterFilter && (
                <Pagination>
                  <PaginationContent>
                    {effectivePage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(effectivePage - 1)} />
                      </PaginationItem>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNumber)}
                            isActive={effectivePage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    {effectivePage < totalPages && (
                      <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(effectivePage + 1)} />
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
                当前作品还没有正式章节。前往作品草稿页新建或导入草稿，写好后发布为章节。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => router.push(`/works/${workId}/drafts/new`)}>
                  新建草稿
                </Button>
                <Button variant="outline" onClick={() => router.push(`/works/${workId}/drafts`)}>
                  前往草稿页
                </Button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

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

      <Dialog
        open={!!chapterToReorder}
        onOpenChange={(open) => {
          if (!open) {
            setChapterToReorder(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整章节号</DialogTitle>
            <DialogDescription>
              将当前章节插入到目标章节号位置，其余章节会自动顺延或前移，并同步修正标题前缀。
            </DialogDescription>
          </DialogHeader>

          {chapterToReorder ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                <div className="font-medium text-foreground">{chapterToReorder.title || "无标题章节"}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  当前章节号：第 {chapterToReorder.displayOrder ?? "-"} 章
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="target-display-order" className="text-sm font-medium">
                  目标章节号
                </label>
                <Input
                  id="target-display-order"
                  type="number"
                  min={1}
                  max={chapters.length || 1}
                  value={targetDisplayOrder}
                  onChange={(e) => setTargetDisplayOrder(e.target.value)}
                  disabled={isReordering}
                />
                <div className="text-xs text-muted-foreground">可填写范围：1 - {chapters.length}</div>
                {reorderPreviewPrefix ? (
                  <div className="text-sm text-foreground">将变为：{reorderPreviewPrefix}</div>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterToReorder(null)} disabled={isReordering}>
              取消
            </Button>
            <Button onClick={handleConfirmReorder} disabled={isReordering || !chapterToReorder}>
              {isReordering ? (
                <>
                  <GripVertical className="mr-2 h-4 w-4 animate-pulse" />
                  调整中
                </>
              ) : (
                "确认调整"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
