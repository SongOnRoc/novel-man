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
    <div className="space-y-4 pb-12 animate-in fade-in duration-500 sm:space-y-5">
      <Card className="overflow-hidden rounded-2xl border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] shadow-none">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 hidden h-40 w-40 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block"
            />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="-ml-2 h-8 rounded-full text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]"
                  >
                    <Link href="/works">
                      <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                      返回作品库
                    </Link>
                  </Button>
                  <Badge className="rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] px-3 py-1 text-[11px] font-semibold text-[var(--primary-700)] hover:bg-[var(--primary-50)]">
                    作品工作台
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-[var(--border-default)]/60 bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    {getWorkStatusLabel(work.status)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-[var(--border-default)]/60 bg-card/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                  >
                    更新 {getUpdatedAtLabel(work.updatedAt)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                    {work.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {work.description ||
                      "暂无简介，您可以从总览、章节、草稿或创作资产模块继续完善这部作品。"}
                  </p>
                </div>
              </div>

              {actions ? <div className="flex flex-wrap gap-2 xl:justify-end">{actions}</div> : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <WorkspaceStatCard label="当前模块" value={moduleTitle} />
            <WorkspaceStatCard label="总字数" value={formatWordCount(work.totalWordCount || 0)} />
            <WorkspaceStatCard label="总章节" value={`${work.totalChapterCount || 0}`} unit="章" />
            <WorkspaceStatCard label="最后更新" value={getUpdatedAtLabel(work.updatedAt)} />
          </div>

          <div className="rounded-xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-1">
                <div className="text-base font-bold tracking-tight text-foreground">
                  {moduleTitle}
                </div>
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
                        "inline-flex min-w-fit items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-[var(--primary-200)]/60 bg-[var(--primary-50)] text-[var(--primary-700)]"
                          : "border-[var(--border-default)]/60 bg-card/70 text-muted-foreground hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/40 hover:text-[var(--primary-700)]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
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
    <section
      className={cn(
        "space-y-5 rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-5 sm:p-6",
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-default)]/70 bg-muted/30 px-6 py-12 text-center">
      <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

function WorkspaceStatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center gap-1.5">
        <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--primary-500)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          {label}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="truncate text-base font-extrabold tracking-tight text-foreground tabular-nums">
          {value}
        </span>
        {unit ? <span className="text-[11px] font-medium text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}
