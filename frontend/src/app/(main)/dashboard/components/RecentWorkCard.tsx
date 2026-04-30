"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock, PenTool } from "lucide-react";
import Link from "next/link";
import React from "react";

import { WorkForClient } from "@/lib/services/work.service";
import { cn, formatWordCount } from "@/lib/utils";

interface RecentWorkCardProps {
  work: WorkForClient;
  index: number;
}

export function RecentWorkCard({ work, index }: RecentWorkCardProps): React.ReactElement {
  const updatedLabel = work.updatedAt
    ? formatDistanceToNow(new Date(work.updatedAt), {
        addSuffix: true,
        locale: zhCN,
      })
    : "刚刚";

  const isSerial = work.status === "serial";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <Link
        href={`/works/${work.id}`}
        className={cn(
          "group relative block overflow-hidden rounded-xl border border-[var(--border-default)]/60 bg-card p-3.5 pl-4 transition-all duration-300",
          "hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:bg-[var(--primary-50)]/30 hover:shadow-sm"
        )}
      >
        {/* 左侧主题色锚点条 */}
        <span
          aria-hidden
          className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r-full bg-[var(--primary-200)] transition-all duration-300 group-hover:top-2.5 group-hover:bottom-2.5 group-hover:bg-[var(--primary-500)]"
        />

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-[14px] font-bold tracking-tight text-foreground transition-colors group-hover:text-[var(--primary-700)]">
              {work.title}
            </h4>

            {work.status && (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
                  isSerial
                    ? "border-[var(--primary-100)] bg-primary/10 text-[var(--primary-700)]"
                    : "border-[var(--border-subtle)] bg-muted/40 text-muted-foreground"
                )}
              >
                {isSerial ? (
                  <span aria-hidden className="h-1 w-1 rounded-full bg-[var(--primary-500)]" />
                ) : null}
                {isSerial ? "连载中" : "已完结"}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-3 w-3 shrink-0" />
              {updatedLabel}
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
              <PenTool className="h-3 w-3 shrink-0" />
              {formatWordCount(work.totalWordCount || 0)} 字
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap tabular-nums">
              <BookOpen className="h-3 w-3 shrink-0" />
              {work.totalChapterCount || 0} 章
            </span>
          </div>
        </div>

        {/* hover 时浮现的箭头 */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      </Link>
    </motion.div>
  );
}
