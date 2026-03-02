import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, MoreVertical, PenTool } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkForClient } from "@/lib/services/work.service";
import { cn, formatWordCount } from "@/lib/utils";
import { Image } from "@/components/ui/image";

interface RecentWorkCardProps {
  work: WorkForClient;
  index: number;
}

export function RecentWorkCard({ work, index }: RecentWorkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      {/* 封面/图标 */}
      <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-muted shadow-sm">
        <Image
          src={work.coverImageUrl || ""}
          alt={work.title || "Work Cover"}
          fallbackText={work.title || "Work"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <Link href={`/works/${work.id}`} className="block">
          <h4 className="truncate text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
            {work.title}
          </h4>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {work.updatedAt
              ? formatDistanceToNow(new Date(work.updatedAt), {
                  addSuffix: true,
                  locale: zhCN,
                })
              : "刚刚"}
          </span>

          {/* 单作品统计数据（用于定位统计异常） */}
          <span className="flex items-center gap-1">
            <PenTool className="h-3 w-3" />
            {formatWordCount(work.totalWordCount || 0)} 字
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {work.totalChapterCount || 0} 章
          </span>

          {work.status && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                work.status === "serial"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-yellow-500/10 text-yellow-600"
              )}
            >
              {work.status === "serial" ? "连载中" : "已完结"}
            </span>
          )}
        </div>
      </div>

      {/* 操作 */}
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/works/${work.id}`}>查看详情</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/works/${work.id}/chapters`}>章节列表</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
