"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  ChevronRight,
  PenTool,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { useWorkHeaderCollapse } from "@/features/works/components/useWorkHeaderCollapse";
import { WorkOverviewHeader } from "@/features/works/components/WorkOverviewHeader";
import { WorkModuleEmptyState } from "@/features/works/components/WorkWorkspaceLayout";
import { useChapterList } from "@/hooks/chapter/useChapterService";
import { useDraftList } from "@/hooks/draft/useDraftService";
import { useWorkById } from "@/hooks/work/useWorkService";
import { cn, formatWordCount } from "@/lib/utils";

const MANAGEMENT_TABS = [
  { key: "chapters", label: "章节" },
  { key: "drafts", label: "草稿" },
  { key: "outline", label: "大纲" },
  { key: "characters", label: "角色" },
  { key: "world", label: "设定" },
] as const;

type ManagementTabKey = (typeof MANAGEMENT_TABS)[number]["key"];

export default function WorkDetailsPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const workId = Number(params.id);
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const { setBreadcrumb } = useBreadcrumb();
  const [activeTab, setActiveTab] = useState<ManagementTabKey>("chapters");
  const [isMoreActionsOpen, setMoreActionsOpen] = useState(false);
  const isHeaderCollapsed = useWorkHeaderCollapse();

  const { data: work, isLoading } = useWorkById(workId);
  const { data: chaptersResponse, isLoading: isLoadingChapters } = useChapterList({
    workId,
    page: 1,
    limit: 5,
  });
  const { data: draftsResponse, isLoading: isLoadingDrafts } = useDraftList({
    workId,
    page: 1,
    limit: 5,
  });

  const chapters = useMemo(() => chaptersResponse?.data ?? [], [chaptersResponse?.data]);
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

  if (!isValidWorkId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">请从作品列表重新进入作品管理页。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <WorkManagementSkeleton />;
  }

  if (!work) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品未找到</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-col gap-4 animate-in fade-in duration-500 sm:gap-5">
        <WorkOverviewHeader
          work={work}
          draftTotal={draftTotal}
          updatedAtLabel={updatedAtLabel}
          statusLabel={getWorkStatusLabel(work.status)}
          isCollapsed={isHeaderCollapsed}
          mobileMoreOpen={isMoreActionsOpen}
          onMobileMoreOpenChange={setMoreActionsOpen}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-4 pb-20 sm:gap-5 lg:pb-0">
          <Card className="min-h-0 overflow-hidden rounded-2xl border-[var(--border-default)]/60 bg-card/80 shadow-none backdrop-blur-sm">
            <CardContent className="flex h-full min-h-0 flex-col p-4 sm:p-5">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ManagementTabKey)}
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Tabs 直接显示，不再有冗余壳标题 */}
                <div className="hidden overflow-x-auto border-b border-[var(--border-default)]/60 pb-3 lg:block">
                  <TabsList className="h-auto justify-start gap-1 rounded-full bg-muted/60 p-1 shadow-none">
                    {MANAGEMENT_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        isActive={activeTab === tab.key}
                        className={cn(
                          "z-20 min-w-[64px] rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                          activeTab === tab.key
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="chapters" className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5">
                  <ManagementSection
                    action={
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild className="h-10 rounded-full border-[var(--border-default)]/60 px-5">
                          <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                        </Button>
                        <Button asChild className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                          <Link href={`/works/${work.id}/drafts`}>从草稿发布章节</Link>
                        </Button>
                      </div>
                    }
                  >
                    {isLoadingChapters ? (
                      <ListSkeleton rows={3} />
                    ) : chapters.length > 0 ? (
                      <div className="space-y-3">
                        {orderedChapters.map((chapter) => (
                          <Link
                            key={chapter.id}
                            href={`/works/${work.id}/chapters/${chapter.id}`}
                            className="group flex items-center justify-between rounded-xl border border-[var(--border-default)]/60 bg-card px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-[var(--primary-700)] hover:bg-primary/10">
                                  第 {chapter.displayOrder ?? "-"} 章
                                </Badge>
                                <div className="text-base font-semibold tracking-tight text-foreground">
                                  {chapter.title || "未命名章节"}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                                <span>字数：{formatWordCount(chapter.wordCount || 0)}</span>
                                <span>大纲：待联动</span>
                                <span>角色：待提取</span>
                                <span>设定：待提取</span>
                              </div>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)]/60 bg-card text-muted-foreground transition-all duration-300 group-hover:border-[var(--primary-200)] group-hover:bg-primary/5 group-hover:text-[var(--primary-600)]">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <WorkModuleEmptyState
                        title="暂无章节"
                        description="可以先在作品草稿中继续创作，再发布成章节；后续章节将按顺序编号管理。"
                        action={
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button asChild className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                              <Link href={`/works/${work.id}/drafts/new`}>创建第一章草稿</Link>
                            </Button>
                            <Button variant="outline" asChild className="h-10 rounded-full border-[var(--border-default)]/60 px-5">
                              <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent value="drafts" className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5">
                  <ManagementSection
                    action={
                      <div className="flex flex-wrap gap-2">
                        <Button asChild className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                          <Link href={`/works/${work.id}/drafts`}>查看全部作品草稿</Link>
                        </Button>
                        <Button variant="outline" asChild className="h-10 rounded-full border-[var(--border-default)]/60 px-5">
                          <Link href="/drafts">打开全局草稿箱</Link>
                        </Button>
                      </div>
                    }
                  >
                    {isLoadingDrafts ? (
                      <ListSkeleton rows={3} />
                    ) : drafts.length > 0 ? (
                      <div className="space-y-3">
                        {drafts.map((draft) => (
                          <Link
                            key={draft.id}
                            href={`/works/${work.id}/drafts/${draft.id}/edit`}
                            className="group flex items-center justify-between rounded-xl border border-[var(--border-default)]/60 bg-card px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="text-base font-semibold tracking-tight text-foreground">
                                {draft.title || "未命名草稿"}
                              </div>
                              <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                                <span>
                                  {draft.updatedAt
                                    ? `最近更新：${formatDistanceToNow(new Date(draft.updatedAt), {
                                        addSuffix: true,
                                        locale: zhCN,
                                      })}`
                                    : "等待继续创作"}
                                </span>
                                <span>状态：未发布</span>
                              </div>
                            </div>
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)]/60 bg-card text-muted-foreground transition-all duration-300 group-hover:border-[var(--primary-200)] group-hover:bg-primary/5 group-hover:text-[var(--primary-600)]">
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <WorkModuleEmptyState
                        title="这部作品暂无草稿"
                        description="当前标签仅显示已绑定本作品的草稿；未绑定作品的灵感草稿请前往全局草稿箱查看。"
                        action={
                          <div className="flex flex-wrap justify-center gap-2">
                            <Button asChild className="h-10 rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
                              <Link href={`/works/${work.id}/drafts/new`}>创建作品草稿</Link>
                            </Button>
                            <Button variant="outline" asChild className="h-10 rounded-full border-[var(--border-default)]/60 px-5">
                              <Link href="/drafts">查看全局草稿箱</Link>
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent value="outline" className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5">
                  <ManagementPlaceholder
                    title="作品大纲"
                    description="沉淀剧情结构、章节推进与关键冲突，帮助后续写作保持节奏一致。"
                    href={`/works/${work.id}/outline`}
                    cta="进入大纲模块"
                    icon={PenTool}
                  />
                </TabsContent>

                <TabsContent value="characters" className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5">
                  <ManagementPlaceholder
                    title="作品角色"
                    description="集中维护人物设定、关系与角色弧线，便于章节创作快速引用。"
                    href={`/works/${work.id}/characters`}
                    cta="进入角色模块"
                    icon={Users}
                  />
                </TabsContent>

                <TabsContent value="world" className="mt-0 min-h-0 flex-1 overflow-auto pt-4 lg:pt-5">
                  <ManagementPlaceholder
                    title="作品设定"
                    description="管理世界观、规则与素材沉淀，让创作信息保持统一可追踪。"
                    href={`/works/${work.id}/world`}
                    cta="进入设定模块"
                    icon={Settings}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="fixed inset-x-3 bottom-3 z-30 shrink-0 rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm px-3 py-2 lg:hidden">
            <div className="flex items-center justify-between gap-1">
              {MANAGEMENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex h-10 w-[3.15rem] flex-col items-center justify-center gap-1 rounded-lg text-[9px] transition-colors",
                    activeTab === tab.key ? "text-[var(--primary-700)]" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      activeTab === tab.key ? "bg-[var(--primary-500)]" : "bg-muted-foreground/50",
                    )}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
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
                <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>
              ) : null}
            </div>
          ) : (
            <div />
          )}
          {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
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
    <ManagementSection title={title} description={description}>
      <Link
        href={href}
        className="group flex items-center justify-between rounded-xl border border-[var(--border-default)]/60 bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-[var(--primary-600)]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="space-y-1.5">
            <div className="text-base font-bold tracking-tight text-foreground">{title}</div>
            {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {cta}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary-100)] bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </ManagementSection>
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


function ListSkeleton({ rows = 3 }: { rows?: number }): React.ReactElement {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-[var(--border-default)]/60 bg-card/60 px-4 py-3"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function WorkManagementSkeleton(): React.ReactElement {
  return (
    <div className="space-y-5 pb-12">
      <Card className="rounded-2xl border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm shadow-none">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-5 w-full max-w-2xl" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="h-6 w-32 rounded-full" />
              </div>
            </div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
            <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            <div className="space-y-4">
              <div className="space-y-3 rounded-xl border border-[var(--border-default)]/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-5 w-full max-w-2xl" />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-xl border border-[var(--border-default)]/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-28 rounded-lg" />
                  <Skeleton className="h-10 w-28 rounded-lg" />
                  <Skeleton className="h-10 w-36 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm shadow-none">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-20 rounded-lg" />
            ))}
          </div>
          <ListSkeleton rows={4} />
        </CardContent>
      </Card>
    </div>
  );
}
