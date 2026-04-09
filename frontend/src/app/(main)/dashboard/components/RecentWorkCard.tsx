import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { motion } from "framer-motion";
import { BookOpen, Clock, PenTool } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="rounded-[1.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] p-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_24px_40px_-30px_rgba(15,23,42,0.42)]"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/works/${work.id}`} className="block min-w-0 flex-1">
            <h4 className="truncate text-[14px] font-semibold tracking-tight text-foreground transition-colors hover:text-primary">
              {work.title}
            </h4>
          </Link>

          {work.status && (
            <span
              className={cn(
                "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-[0_10px_18px_-16px_rgba(15,23,42,0.3)]",
                work.status === "serial"
                  ? "border-primary/12 bg-primary/10 text-primary"
                  : "border-orange-200 bg-orange-50 text-orange-700"
              )}
            >
              {work.status === "serial" ? "连载中" : "已完结"}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Clock className="h-3 w-3 shrink-0" />
            {updatedLabel}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <PenTool className="h-3 w-3 shrink-0" />
            {formatWordCount(work.totalWordCount || 0)} 字
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <BookOpen className="h-3 w-3 shrink-0" />
            {work.totalChapterCount || 0} 章
          </span>
        </div>
      </div>
    </motion.div>
  );
}


