"use client";

import {
  ArrowLeft,
  BookOpen,
  FileText,
  Globe,
  PenTool,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkForClient } from "@/lib/services/work.service";
import { cn, formatWordCount } from "@/lib/utils";

export const WORKSPACE_MODULES = [
  {
    key: "overview",
    label: "总览",
    description: "查看作品统计、最近章节与草稿入口。",
    icon: Sparkles,
  },
  {
    key: "chapters",
    label: "章节",
    description: "管理章节列表、导入章节并继续写作。",
    icon: BookOpen,
  },
  {
    key: "drafts",
    label: "草稿",
    description: "围绕当前作品管理创作中的草稿。",
    icon: FileText,
  },
  {
    key: "outline",
    label: "大纲",
    description: "整理剧情阶段、看板与创作规划。",
    icon: PenTool,
  },
  {
    key: "characters",
    label: "角色",
    description: "维护角色资料与人物设定。",
    icon: Users,
  },
  {
    key: "world",
    label: "设定",
    description: "补充世界观、规则与资料条目。",
    icon: Globe,
  },
] as const;

export type WorkspaceModuleKey = (typeof WORKSPACE_MODULES)[number]["key"];

function getWorkspaceHref(workId: number, key: WorkspaceModuleKey): string {
  if (key === "overview") {
    return `/works/${workId}`;
  }

  return `/works/${workId}/${key}`;
}

function getWorkStatusLabel(status?: string | null): string {
  if (!status) return "未设置状态";

  const statusMap: Record<string, string> = {
    draft: "草稿",
    serializing: "连载中",
    ongoing: "连载中",
    completed: "已完结",
    archived: "已归档",
    paused: "已暂停",
  };

  return statusMap[status] || status;
}

function getUpdatedAtLabel(updatedAt?: string | null): string {
  if (!updatedAt) return "暂无更新时间";

  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "暂无更新时间";

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: zhCN,
  });
}

export function WorkWorkspaceLayout({
  work,
  currentModule,
  moduleTitle,
  moduleDescription,
  actions,
  children,
}: {
  work: WorkForClient;
  currentModule: WorkspaceModuleKey;
  moduleTitle: string;
  moduleDescription: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="min-h-screen space-y-6 pb-20 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
        <CardContent className="space-y-6 p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
                  <Link href="/works">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回作品库
                  </Link>
                </Button>
                <Badge variant="secondary">作品工作台</Badge>
                <Badge variant="outline">{getWorkStatusLabel(work.status)}</Badge>
                <Badge variant="outline">最近更新：{getUpdatedAtLabel(work.updatedAt)}</Badge>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{work.title}</h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  {work.description || "暂无简介，您可以从总览、章节、草稿或创作资产模块继续完善这部作品。"}
                </p>
              </div>
            </div>

            {actions ? <div className="flex flex-wrap gap-3 xl:justify-end">{actions}</div> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <WorkspaceStatCard label="当前模块" value={moduleTitle} />
            <WorkspaceStatCard label="总字数" value={formatWordCount(work.totalWordCount || 0)} />
            <WorkspaceStatCard label="总章节" value={`${work.totalChapterCount || 0}`} />
            <WorkspaceStatCard label="最后更新" value={getUpdatedAtLabel(work.updatedAt)} />
          </div>

          <div className="rounded-3xl border border-border/60 bg-muted/15 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold">{moduleTitle}</div>
                <p className="text-sm leading-6 text-muted-foreground">{moduleDescription}</p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <nav className="flex w-max min-w-full gap-2">
                {WORKSPACE_MODULES.map((module) => {
                  const Icon = module.icon;
                  const isActive = module.key === currentModule;

                  return (
                    <Link
                      key={module.key}
                      href={getWorkspaceHref(work.id!, module.key)}
                      className={cn(
                        "inline-flex min-w-fit items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition-colors",
                        isActive
                          ? "border-primary/30 bg-primary/10 text-primary shadow-sm"
                          : "border-border/50 bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{module.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}

export function WorkModuleSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={cn("space-y-6 rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm md:p-6", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function WorkModuleEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/60 px-6 py-12 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

function WorkspaceStatCard({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
