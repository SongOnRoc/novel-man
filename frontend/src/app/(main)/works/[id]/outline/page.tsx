"use client";

import {
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  Layout,
  List,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkById } from "@/hooks/work/useWorkService";
import { cn } from "@/lib/utils";

// Mock Data
const stages = [
  {
    id: "idea",
    title: "灵感/构思",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900",
    items: [
      { id: "1", title: "关于魔法系统的初步设想", content: "基于五行元素的变体...", date: "2023-10-01" },
      { id: "2", title: "主角身世背景", content: "被遗弃的孤儿，实际上是...", date: "2023-10-02" },
    ],
  },
  {
    id: "outline",
    title: "大纲/剧情",
    color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-900",
    items: [
      { id: "3", title: "第一卷：初出茅庐", content: "主要讲述主角离开新手村...", date: "2023-10-05" },
      { id: "4", title: "核心冲突设定", content: "传统魔法与机械文明的冲突...", date: "2023-10-06" },
      { id: "5", title: "反派角色小传", content: "为了复仇而...", date: "2023-10-07" },
    ],
  },
  {
    id: "draft",
    title: "草稿/撰写",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900",
    items: [
      { id: "6", title: "第一章：觉醒", content: "已完成初稿，待润色...", date: "2023-10-10" },
      { id: "7", title: "第二章：相遇", content: "正在撰写中...", date: "2023-10-12" },
    ],
  },
  {
    id: "review",
    title: "审阅/修订",
    color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-900",
    items: [
      { id: "8", title: "序章", content: "需要重新调整节奏...", date: "2023-09-30" },
    ],
  },
];

export default function OutlinePage(): React.ReactElement {
  const params = useParams();
  const workId = Number(params.id);
  const { setBreadcrumb } = useBreadcrumb();
  const [view, setView] = useState("board");

  const { data: work } = useWorkById(workId);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "大纲规划");
    }
  }, [work, workId, setBreadcrumb]);

  return (
    <div className="h-[calc(100vh-64px)] -m-8 flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Layout className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold">大纲规划</h1>
        </div>
        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v)}>
            <ToggleGroupItem value="board" aria-label="看板视图">
              <Layout className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="列表视图">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <div className="h-6 w-px bg-border" />
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新建卡片
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="flex-1 bg-muted/10">
        <div className="flex h-full min-w-max gap-6 p-6">
          {stages.map((stage, stageIndex) => (
            <div key={stage.id} className="flex h-full w-80 flex-col gap-4">
              {/* Column Header */}
              <div className="flex items-center justify-between rounded-lg border bg-background p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full border-2", stage.color.split(" ")[0].replace("/10", ""))} />
                  <span className="font-medium">{stage.title}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {stage.items.length}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3">
                {stage.items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 + stageIndex * 0.1 }}
                    className="group cursor-pointer rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h3 className="font-medium leading-tight">{item.title}</h3>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground line-clamp-3">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {item.date}
                    </div>
                  </motion.div>
                ))}
                
                {/* Add Button */}
                <Button variant="ghost" className="w-full border border-dashed text-muted-foreground hover:text-primary">
                  <Plus className="mr-2 h-3 w-3" />
                  添加卡片
                </Button>
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
