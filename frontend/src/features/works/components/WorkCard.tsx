"use client";

import React from "react";
import { motion } from "framer-motion";
import { MoreVertical, Trash2, BookOpen, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkForClient } from "@/lib/services/work.service";

interface WorkCardProps {
  work: WorkForClient;
  onDelete: () => void;
  isDeleting: boolean;
}

export function WorkCard({ work, onDelete, isDeleting }: WorkCardProps) {
  return (
    <motion.div
      layoutId={`work-card-${work.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-lg hover:border-primary/50"
      whileHover={{ y: -4 }}
    >
      <Link href={`/works/${work.id}`} className="flex-1">
        {/* 封面区域 */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted sm:aspect-[2/1]">
          {work.coverImageUrl ? (
            <motion.img
              layoutId={`work-cover-${work.id}`}
              src={work.coverImageUrl}
              alt={work.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/20">
              <BookOpen className="h-12 w-12 text-primary/30" />
            </div>
          )}
          
          {/* 状态标签 */}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center rounded-full bg-background/90 px-2.5 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm shadow-sm">
              {work.status === "ongoing" ? "连载中" : "已完结"}
            </span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-start justify-between">
            <motion.h3 
              layoutId={`work-title-${work.id}`}
              className="line-clamp-1 text-lg font-bold text-foreground group-hover:text-primary"
            >
              {work.title}
            </motion.h3>
          </div>

          <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">
            {work.description || "暂无简介"}
          </p>

          <div className="mt-auto flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{format(new Date(work.updatedAt || new Date()), "MM-dd", { locale: zhCN })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{format(new Date(work.createdAt || new Date()), "yyyy", { locale: zhCN })}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* 操作菜单 (绝对定位，避免触发 Link) */}
      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/50 text-foreground backdrop-blur-sm hover:bg-background/80"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">更多操作</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除作品
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
