"use client";

import { ArrowRight, ListChecks, Shield, Wrench } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

const quickLinks = [
  {
    title: "Ops Jobs",
    description: "查看后台任务、运行进度、失败摘要与取消请求。",
    href: "/admin/ops-jobs",
    icon: ListChecks,
    tone: "from-sky-500/15 via-sky-500/5 to-transparent",
  },
  {
    title: "Works Stats Repair",
    description:
      "发起 `works.recalc_stats` 修复任务，支持 dry-run 与条件过滤。",
    href: "/admin/works-stats-repair",
    icon: Wrench,
    tone: "from-violet-500/15 via-violet-500/5 to-transparent",
  },
];

export default function AdminHomePage(): React.ReactElement {
  return (
    <div className="space-y-8">
      <section className="space-y-6 rounded-3xl border bg-card p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <Shield className="h-3.5 w-3.5" />
            Admin Console
          </Badge>
          <PageHeader className="space-y-3 p-0">
            <PageHeaderHeading>管理后台</PageHeaderHeading>
            <PageHeaderDescription className="max-w-2xl text-base leading-7">
              只保留后台任务与统计修复入口。
            </PageHeaderDescription>
          </PageHeader>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="gap-2 rounded-full px-6">
              <Link href="/admin/ops-jobs">
                进入 Ops Jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="gap-2 rounded-full px-6"
            >
              <Link href="/admin/works-stats-repair">
                发起统计修复
                <Wrench className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.href} className="group relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.tone}`}
              />
              <CardHeader className="relative z-10 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/80 shadow-sm">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="relative z-10 flex items-center justify-between gap-4 pt-0">
                <Button asChild className="rounded-full">
                  <Link href={item.href}>
                    打开
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
