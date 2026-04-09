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
      <div className="relative flex min-h-screen flex-col gap-3 animate-in fade-in duration-500 lg:gap-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[22rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%)] lg:block" />
        <div className="relative flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            asChild
            className="-ml-2 rounded-full px-3 text-muted-foreground hover:bg-white/70 hover:text-foreground lg:h-10"
          >
            <Link href="/works">返回作品列表</Link>
          </Button>
          <Badge className="rounded-full border border-primary/15 bg-white/80 px-3 py-1 text-xs font-semibold text-primary shadow-[0_12px_24px_-22px_rgba(15,23,42,0.35)] hover:bg-white/80">
            作品工作台
          </Badge>
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 pb-20 lg:gap-6 lg:pb-0">
          <Card className="min-h-0 overflow-hidden border-border/50 bg-white/80 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.38)] backdrop-blur-sm">
            <CardContent className="flex h-full min-h-0 flex-col p-4 md:p-5 lg:p-6">
              <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as ManagementTabKey)}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="hidden items-start justify-between gap-4 border-b border-border/60 pb-5 lg:flex">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                      内容管理区
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                      章节、草稿与创作资产
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      在同一作品上下文内切换管理模块，快速进入章节、草稿与设定维护流程。
                    </p>
                  </div>
                  <div className="hidden rounded-full border border-border/60 bg-white/90 p-1.5 shadow-[0_18px_38px_-26px_rgba(15,23,42,0.28)] xl:block">
                    <TabsList className="h-auto min-w-full justify-start gap-1 rounded-full bg-slate-100 p-1 shadow-none backdrop-blur-0">
                      {MANAGEMENT_TABS.map((tab) => (
                        <TabsTrigger
                          key={tab.key}
                          value={tab.key}
                          isActive={activeTab === tab.key}
                          className={cn(
                            "z-20 min-w-[72px] rounded-full px-5 py-2.5 text-sm font-semibold",
                            activeTab === tab.key
                              ? "text-slate-900"
                              : "text-slate-500 hover:text-slate-800"
                          )}
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                </div>

                <div className="hidden overflow-x-auto pb-4 lg:block xl:hidden">
                  <TabsList className="h-auto min-w-full justify-start gap-1 rounded-2xl bg-slate-100 p-1.5 shadow-none">
                    {MANAGEMENT_TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.key}
                        value={tab.key}
                        isActive={activeTab === tab.key}
                        className={cn(
                          "z-20 rounded-xl px-4 py-2.5 text-sm font-semibold",
                          activeTab === tab.key
                            ? "text-slate-900"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <TabsContent value="chapters" className="mt-0 min-h-0 flex-1 overflow-auto pt-1 lg:pt-6">
                  <ManagementSection
                    title="章节列表"
                    description="按作品顺序组织章节，并可快速进入草稿发布与章节编辑流程。"
                    action={
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild className="rounded-full border-border/70 bg-white/80 hover:bg-slate-50">
                          <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                        </Button>
                        <Button asChild className="rounded-full shadow-[0_18px_32px_-24px_rgba(20,184,166,0.55)]">
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
                            className="group flex items-center justify-between rounded-[1.6rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))] px-5 py-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_24px_44px_-32px_rgba(15,23,42,0.42)]"
                          >
                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">
                                  第 {chapter.displayOrder ?? "-"} 章
                                </Badge>
                                <div className="text-base font-semibold tracking-tight text-foreground">
                                  {chapter.title || "未命名章节"}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                <span>字数：{formatWordCount(chapter.wordCount || 0)}</span>
                                <span>大纲：待联动</span>
                                <span>角色：待提取</span>
                                <span>设定：待提取</span>
                              </div>
                            </div>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white/90 text-muted-foreground transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
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
                            <Button asChild className="rounded-full">
                              <Link href={`/works/${work.id}/drafts/new`}>创建第一章草稿</Link>
                            </Button>
                            <Button variant="outline" asChild className="rounded-full">
                              <Link href={`/works/${work.id}/chapters`}>进入章节管理页</Link>
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent value="drafts" className="mt-0 min-h-0 flex-1 overflow-auto pt-1 lg:pt-6">
                  <ManagementSection
                    title="草稿列表"
                    description="汇总当前作品上下文中的创作草稿，方便继续写作与发布。"
                    action={
                      <div className="flex flex-wrap gap-2">
                        <Button asChild className="rounded-full shadow-[0_18px_32px_-24px_rgba(20,184,166,0.55)]">
                          <Link href={`/works/${work.id}/drafts`}>查看全部作品草稿</Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-full border-border/70 bg-white/80 hover:bg-slate-50">
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
                            className="group flex items-center justify-between rounded-[1.6rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))] px-5 py-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_24px_44px_-32px_rgba(15,23,42,0.42)]"
                          >
                            <div className="space-y-2.5">
                              <div className="text-base font-semibold tracking-tight text-foreground">
                                {draft.title || "未命名草稿"}
                              </div>
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
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white/90 text-muted-foreground transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
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
                            <Button asChild className="rounded-full">
                              <Link href={`/works/${work.id}/drafts/new`}>创建作品草稿</Link>
                            </Button>
                            <Button variant="outline" asChild className="rounded-full">
                              <Link href="/drafts">查看全局草稿箱</Link>
                            </Button>
                          </div>
                        }
                      />
                    )}
                  </ManagementSection>
                </TabsContent>

                <TabsContent value="outline" className="mt-0 min-h-0 flex-1 overflow-auto pt-1 lg:pt-6">
                  <ManagementPlaceholder
                    title="作品大纲"
                    description="沉淀剧情结构、章节推进与关键冲突，帮助后续写作保持节奏一致。"
                    href={`/works/${work.id}/outline`}
                    cta="进入大纲模块"
                    icon={PenTool}
                  />
                </TabsContent>

                <TabsContent value="characters" className="mt-0 min-h-0 flex-1 overflow-auto pt-1 lg:pt-6">
                  <ManagementPlaceholder
                    title="作品角色"
                    description="集中维护人物设定、关系与角色弧线，便于章节创作快速引用。"
                    href={`/works/${work.id}/characters`}
                    cta="进入角色模块"
                    icon={Users}
                  />
                </TabsContent>

                <TabsContent value="world" className="mt-0 min-h-0 flex-1 overflow-auto pt-1 lg:pt-6">
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
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold tracking-tight text-foreground lg:text-[1.35rem]">
            {title}
          </h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
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
        className="group flex items-center justify-between rounded-[1.8rem] border border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.88))] p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_28px_48px_-34px_rgba(15,23,42,0.42)]"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary shadow-[0_12px_24px_-20px_rgba(20,184,166,0.6)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="font-semibold tracking-tight text-foreground">{title}</div>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {cta}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/10 bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
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
          className="rounded-2xl border border-border/50 bg-background/60 px-4 py-3"
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
