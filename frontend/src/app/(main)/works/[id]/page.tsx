"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  AlignLeft,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  PenTool,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useWorkHeaderCollapse } from "@/features/works/components/useWorkHeaderCollapse";
import { WorkOverviewHeader } from "@/features/works/components/WorkOverviewHeader";
import { WorkModuleEmptyState } from "@/features/works/components/WorkWorkspaceLayout";
import { useChapterList } from "@/hooks/chapter/useChapterService";
import { useDraftList, useImportDrafts } from "@/hooks/draft/useDraftService";
import { useWorkById } from "@/hooks/work/useWorkService";
import { cn, formatWordCount } from "@/lib/utils";
import { ImportDialog } from "@/components/common/ImportDialog";
import { toast } from "sonner";

const MANAGEMENT_TABS = [
  { key: "chapters", label: "章节", icon: BookOpen },
  { key: "drafts", label: "草稿", icon: FileText },
  { key: "outline", label: "大纲", icon: PenTool },
  { key: "characters", label: "角色", icon: Users },
  { key: "world", label: "设定", icon: Settings },
] as const;

type ManagementTabKey = (typeof MANAGEMENT_TABS)[number]["key"];

export default function WorkDetailsPage(): React.ReactElement | null {
  const params = useParams();
  const router = useRouter();
  const workId = Number(params.id);
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const { setBreadcrumb } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState<ManagementTabKey>("chapters");
  const [isMoreActionsOpen, setMoreActionsOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const isHeaderCollapsed = useWorkHeaderCollapse();

  const { data: work, isLoading } = useWorkById(workId);
  const { data: chaptersResponse, isLoading: isLoadingChapters } =
    useChapterList({
      workId,
      page: 1,
      limit: 5,
    });
  const { data: draftsResponse, isLoading: isLoadingDrafts } = useDraftList({
    workId,
    page: 1,
    limit: 5,
  });
  const { mutateAsync: importDraftsAsync, isPending: isImporting } =
    useImportDrafts();

  const chapters = useMemo(
    () => chaptersResponse?.data ?? [],
    [chaptersResponse?.data],
  );
  const drafts = draftsResponse?.data || [];
  const draftTotal = draftsResponse?.pagination?.total || drafts.length;

  const orderedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const orderA = a.displayOrder ?? 0;
      const orderB = b.displayOrder ?? 0;
      if (orderA !== orderB) return orderA - orderB;

      const idA = a.id ?? 0;
      const idB = b.id ?? 0;
      return idA - idB;
    });
  }, [chapters]);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "作品管理");
    }
  }, [work, workId, setBreadcrumb]);

  const updatedAtLabel = useMemo(() => {
    if (!work?.updatedAt) return "暂无更新时间";
    const updatedAt = new Date(work.updatedAt);
    if (Number.isNaN(updatedAt.getTime())) return "暂无更新时间";
    return formatDistanceToNow(updatedAt, {
      addSuffix: true,
      locale: zhCN,
    });
  }, [work?.updatedAt]);

  const handleImport = async (file: File) => {
    return importDraftsAsync({ workId, file });
  };

  const handleImportSuccess = (_result: unknown) => {
    setIsImportDialogOpen(false);
    toast.success("内容已导入为草稿");
    router.push(`/works/${workId}/drafts`);
  };

  if (!isValidWorkId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">
          请从作品列表重新进入作品管理页。
        </p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return null;
  }

  if (!work) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品未找到</h2>
        <p className="text-muted-foreground">
          该作品可能已被删除或无访问权限。
        </p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col gap-5 animate-in fade-in duration-500 sm:gap-6">
        <WorkOverviewHeader
          work={work}
          draftTotal={draftTotal}
          updatedAtLabel={updatedAtLabel}
          statusLabel={getWorkStatusLabel(work.status)}
          isCollapsed={isHeaderCollapsed}
          mobileMoreOpen={isMoreActionsOpen}
          onMobileMoreOpenChange={setMoreActionsOpen}
          onImportClick={() => setIsImportDialogOpen(true)}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-4 pb-24 sm:gap-5 lg:pb-0">
          <Card className="min-h-0 overflow-hidden rounded-2xl border-[var(--border-default)]/60 bg-card/80 shadow-none backdrop-blur-sm">
            <CardContent className="flex h-full min-h-0 flex-col p-4 sm:p-5">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as ManagementTabKey)
                }
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Tabs 直接显示，不再有冗余壳标题 */}
                <div className="hidden border-b border-[var(--border-default)]/60 pb-3 lg:flex lg:items-center lg:justify-between lg:gap-4">
                  <TabsList className="h-auto justify-start gap-1 overflow-x-auto rounded-full bg-muted/60 p-1 shadow-none">
                    {MANAGEMENT_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        isActive={activeTab === tab.key}
                        className={cn(
                          "z-20 min-w-[64px] rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                          activeTab === tab.key
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {(activeTab === "chapters" || activeTab === "drafts") && (
                    <Link
                      href={`/works/${work.id}/${activeTab}`}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      查看全部
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                <TabsContent
                  value="chapters"
                  className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5"
                >
                  <ManagementSection>
                    {isLoadingChapters ? null : chapters.length > 0 ? (
                      <div className="space-y-3">
                        {orderedChapters.map((chapter) => (
                          <Link
                            key={chapter.id}
                            href={`/works/${work.id}/chapters/${chapter.id}`}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-default)]/60 bg-card px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
                          >
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary-700)]">
                                  第 {chapter.displayOrder ?? "-"} 章
                                </span>
                                <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                                  {chapter.title || "未命名章节"}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-[var(--primary-700)]">
                                  <AlignLeft className="h-3 w-3" />
                                  {formatWordCount(chapter.wordCount || 0)} 字
                                </span>
                                <DimensionChip label="大纲" status="待联动" />
                                <DimensionChip label="角色" status="待提取" />
                                <DimensionChip label="设定" status="待提取" />
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--primary-600)]" />
                          </Link>
                        ))}
                        <MobileViewAllLink
                          href={`/works/${work.id}/chapters`}
                          count={work.totalChapterCount || chapters.length}
                          unit="章"
                        />
                      </div>
                    ) : (
                      <WorkModuleEmptyState
                        title="暂无章节"
                        description="章节由草稿发布而来。先新建草稿开始写作，写完后即可发布为章节。"
                        action={
                          <Button
                            asChild
                            className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                          >
                            <Link href={`/works/${work.id}/drafts/new`}>
                              新建草稿
                            </Link>
                          </Button>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent
                  value="drafts"
                  className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5"
                >
                  <ManagementSection>
                    {isLoadingDrafts ? null : drafts.length > 0 ? (
                      <div className="space-y-3">
                        {drafts.map((draft) => (
                          <Link
                            key={draft.id}
                            href={`/works/${work.id}/drafts/${draft.id}/edit`}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border-default)]/60 bg-card px-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-200)] hover:bg-[var(--accent-50)]/40 hover:shadow-sm"
                          >
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                                {draft.title || "未命名草稿"}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {draft.updatedAt
                                    ? formatDistanceToNow(
                                        new Date(draft.updatedAt),
                                        {
                                          addSuffix: true,
                                          locale: zhCN,
                                        },
                                      )
                                    : "等待继续创作"}
                                </span>
                                <span className="inline-flex items-center rounded-md bg-[var(--accent-50)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--accent-700)]">
                                  未发布
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[var(--accent-700)]" />
                          </Link>
                        ))}
                        <MobileViewAllLink
                          href={`/works/${work.id}/drafts`}
                          count={draftTotal}
                          unit="篇"
                        />
                      </div>
                    ) : (
                      <WorkModuleEmptyState
                        title="这部作品暂无草稿"
                        description="先创建一篇草稿开始写作，写完后即可发布为章节。"
                        action={
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button
                              asChild
                              className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                            >
                              <Link href={`/works/${work.id}/drafts/new`}>
                                新建
                              </Link>
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent
                  value="outline"
                  className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5"
                >
                  <ManagementPlaceholder
                    title="作品大纲"
                    description="沉淀剧情结构、章节推进与关键冲突，帮助后续写作保持节奏一致。"
                    href={`/works/${work.id}/outline`}
                    cta="进入大纲"
                    icon={PenTool}
                  />
                </TabsContent>

                <TabsContent
                  value="characters"
                  className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5"
                >
                  <ManagementPlaceholder
                    title="作品角色"
                    description="集中维护人物设定、关系与角色弧线，便于章节创作快速引用。"
                    href={`/works/${work.id}/characters`}
                    cta="进入角色"
                    icon={Users}
                  />
                </TabsContent>

                <TabsContent
                  value="world"
                  className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5"
                >
                  <ManagementPlaceholder
                    title="作品设定"
                    description="管理世界观、规则与素材沉淀，让创作信息保持统一可追踪。"
                    href={`/works/${work.id}/world`}
                    cta="进入设定"
                    icon={Settings}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border-default)]/60 bg-card/95 backdrop-blur-md pb-safe lg:hidden">
            <div className="mx-auto flex max-w-lg items-stretch">
              {MANAGEMENT_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                      isActive
                        ? "text-[var(--primary-600)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-[1.35rem] w-[1.35rem]" strokeWidth={2} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      <ImportDialog
        trigger={null}
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleImport}
        onSuccess={handleImportSuccess}
        title="导入为草稿"
        description="支持导入 .txt, .md, .json, .zip 格式的文件。内容将批量导入为作品草稿，随后可在草稿列表批量发布为章节。"
        allowedTypes={[".txt", ".md", ".json", ".zip"]}
        isUploading={isImporting}
      />
    </>
  );
}

function ManagementSection({
  title,
  description,
  action,
  children,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  const hasHeader = Boolean(title || description || action);
  return (
    <div className="space-y-4 lg:space-y-5">
      {hasHeader ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {title || description ? (
            <div className="space-y-1">
              {title ? (
                <h3 className="text-base font-bold tracking-tight text-foreground lg:text-lg">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="text-[13px] leading-5 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
          ) : (
            <div />
          )}
          {action ? (
            <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function ManagementPlaceholder({
  title,
  description,
  href,
  cta,
  icon: Icon,
}: {
  title: string;
  description?: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl border border-[var(--border-default)]/60 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-[var(--primary-600)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1.5">
          <div className="text-base font-bold tracking-tight text-foreground">
            {title}
          </div>
          {description ? (
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {cta}
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary-100)] bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  );
}

function getWorkStatusLabel(status?: string | null): string {
  switch (status) {
    case "draft":
      return "草稿中";
    case "serializing":
      return "连载中";
    case "completed":
      return "已完结";
    case "paused":
      return "暂停中";
    default:
      return status || "未设置状态";
  }
}

function MobileViewAllLink({
  href,
  count,
  unit,
}: {
  href: string;
  count: number;
  unit: string;
}): React.ReactElement {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-1 rounded-xl border border-[var(--border-default)]/60 bg-card/60 px-4 py-3 text-sm font-medium text-primary transition-colors hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 lg:hidden"
    >
      查看全部 {count} {unit}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function DimensionChip({
  label,
  status,
}: {
  label: string;
  status: string;
}): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-1.5 py-0.5 text-[11px]">
      <span className="font-medium text-foreground/70">{label}</span>
      <span className="text-muted-foreground/70">{status}</span>
    </span>
  );
}
