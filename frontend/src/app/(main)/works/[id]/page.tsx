"use client";

import {
  ChevronRight,
  PenTool,
  Settings,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WorkOverviewHeader } from "@/features/works/components/WorkOverviewHeader";
import { useWorkHeaderCollapse } from "@/features/works/components/useWorkHeaderCollapse";
import { WorkModuleEmptyState } from "@/features/works/components/WorkWorkspaceLayout";
import { useDraftList } from "@/hooks/draft/useDraftService";
import { useChapterList } from "@/hooks/chapter/useChapterService";
import { useWorkById } from "@/hooks/work/useWorkService";
import { formatWordCount } from "@/lib/utils";

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

  const chapters = chaptersResponse?.data || [];
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
      <div className="flex min-h-screen flex-col gap-3 animate-in fade-in duration-500 lg:block lg:space-y-5">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" asChild className="-ml-2 text-muted-foreground">
            <Link href="/works">返回作品列表</Link>
          </Button>
          <Badge variant="secondary">作品工作台</Badge>
        </div>

        <WorkOverviewHeader
          work={work}
          draftTotal={draftTotal}
          updatedAtLabel={updatedAtLabel}
          statusLabel={getWorkStatusLabel(work.status)}
          isCollapsed={isHeaderCollapsed}
          mobileMoreOpen={isMoreActionsOpen}
          onMobileMoreOpenChange={setMoreActionsOpen}
        />

        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-20 lg:grid lg:grid-rows-none lg:gap-5 lg:pb-0">
          <Card className="min-h-0 border-border/60 bg-card/70 shadow-sm">
            <CardContent className="flex h-full min-h-0 flex-col p-4 md:p-5">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ManagementTabKey)} className="flex min-h-0 flex-1 flex-col">
                <div className="hidden overflow-x-auto pb-3 lg:block">
                  <TabsList className="h-auto min-w-full justify-start gap-1.5 rounded-2xl bg-muted/30 p-1">
                    {MANAGEMENT_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        isActive={activeTab === tab.key}
                        className="z-20 rounded-xl px-4 py-2"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="chapters" className="mt-0 min-h-0 flex-1 overflow-auto">
                <ManagementSection
                  title="章节列表"
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                      </Button>
                      <Button asChild>
                        <Link href={`/works/${work.id}/drafts`}>从草稿发布章节</Link>
                      </Button>
                    </div>
                  }
                >
                  {isLoadingChapters ? (
                    <ListSkeleton rows={3} />
                  ) : chapters.length > 0 ? (
                    <div className="space-y-3">
                      {orderedChapters.map((chapter, index) => (
                        <Link
                          key={chapter.id}
                          href={`/works/${work.id}/chapters/${chapter.id}`}
                          className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/60 px-4 py-4 transition-colors hover:bg-muted/40"
                        >
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">第 {chapter.displayOrder ?? "-"} 章</Badge>
                              <div className="font-medium">{chapter.title || "未命名章节"}</div>
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                              <span>字数：{formatWordCount(chapter.wordCount || 0)}</span>
                              <span>大纲：待联动</span>
                              <span>角色：待提取</span>
                              <span>设定：待提取</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <WorkModuleEmptyState
                      title="暂无章节"
                      description="可以先在作品草稿中继续创作，再发布成章节；后续章节将按顺序编号管理。"
                      action={
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button asChild>
                            <Link href={`/works/${work.id}/drafts/new`}>创建第一章草稿</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                          </Button>
                        </div>
                      }
                    />
                  )}
                </ManagementSection>
              </TabsContent>

                <TabsContent value="drafts" className="mt-0 min-h-0 flex-1 overflow-auto">
                <ManagementSection
                  title="草稿列表"
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button asChild>
                        <Link href={`/works/${work.id}/drafts`}>查看全部作品草稿</Link>
                      </Button>
                      <Button variant="outline" asChild>
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
                          className="flex items-center justify-between rounded-2xl border border-border/50 bg-background/60 px-4 py-4 transition-colors hover:bg-muted/40"
                        >
                          <div className="space-y-2">
                            <div className="font-medium">{draft.title || "未命名草稿"}</div>
                            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <WorkModuleEmptyState
                      title="这部作品暂无草稿"
                      description="当前标签仅显示已绑定本作品的草稿；未绑定作品的灵感草稿请前往全局草稿箱查看。"
                      action={
                        <div className="flex flex-wrap justify-center gap-2">
                          <Button asChild>
                            <Link href={`/works/${work.id}/drafts/new`}>创建作品草稿</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href="/drafts">查看全局草稿箱</Link>
                          </Button>
                        </div>
                      }
                    />
                  )}
                </ManagementSection>
              </TabsContent>

                <TabsContent value="outline" className="mt-0 min-h-0 flex-1 overflow-auto">
                  <ManagementPlaceholder
                    title="作品大纲"
                    href={`/works/${work.id}/outline`}
                  cta="进入大纲模块"
                  icon={PenTool}
                />
              </TabsContent>

                <TabsContent value="characters" className="mt-0 min-h-0 flex-1 overflow-auto">
                  <ManagementPlaceholder
                    title="作品角色"
                    href={`/works/${work.id}/characters`}
                  cta="进入角色模块"
                  icon={Users}
                />
              </TabsContent>

                <TabsContent value="world" className="mt-0 min-h-0 flex-1 overflow-auto">
                  <ManagementPlaceholder
                    title="作品设定"
                    href={`/works/${work.id}/world`}
                  cta="进入设定模块"
                  icon={Settings}
                />
              </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="fixed inset-x-3 bottom-3 z-30 shrink-0 rounded-[1.35rem] border border-border/60 bg-background/95 px-3 py-2 shadow-sm lg:hidden">
            <div className="flex items-center justify-between gap-1">
              {MANAGEMENT_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex h-10 w-[3.15rem] flex-col items-center justify-center gap-1 rounded-xl text-[9px] transition-colors",
                    activeTab === tab.key ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-md",
                      activeTab === tab.key ? "bg-slate-900" : "bg-slate-400",
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
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

function ManagementPlaceholder({
  title,
  href,
  cta,
  icon: Icon,
}: {
  title: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
}): React.ReactElement {
  return (
    <ManagementSection title={title}>
      <Link
        href={href}
        className="flex items-center justify-between rounded-3xl border border-border/60 bg-background/70 p-5 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="font-medium">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          {cta}
          <ChevronRight className="h-4 w-4" />
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


function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3"
        >
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-3 h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function WorkManagementSkeleton() {
  return (
    <div className="min-h-screen space-y-6 pb-20">
      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-6 lg:p-8">
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
          <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)] xl:items-start">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="space-y-6">
              <div className="space-y-3 rounded-3xl border border-border/50 p-5">
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
                    <Skeleton key={index} className="h-24 rounded-2xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-3 rounded-3xl border border-border/50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Skeleton className="h-10 w-28 rounded-xl" />
                  <Skeleton className="h-10 w-28 rounded-xl" />
                  <Skeleton className="h-10 w-36 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-5 w-full max-w-xl" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-10 w-20 rounded-xl" />
            ))}
          </div>
          <ListSkeleton rows={4} />
        </CardContent>
      </Card>
    </div>
  );
}
