"use client";

import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

type QuickActionTone = "primary" | "accent" | "neutral";

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  delay?: number;
  tone?: QuickActionTone;
  /** @deprecated 现在仅有单一形态，参数保留向后兼容 */
  compact?: boolean;
}

const TONE_MAP: Record<
  QuickActionTone,
  {
    border: string;
    bg: string;
    iconBg: string;
    iconText: string;
    arrowBg: string;
    arrowText: string;
    hoverBorder: string;
  }
> = {
  primary: {
    border: "border-[var(--primary-100)]",
    bg: "bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_55%,var(--primary-50)_100%)]",
    iconBg: "bg-primary/10",
    iconText: "text-[var(--primary-600)]",
    arrowBg: "bg-card",
    arrowText: "text-primary",
    hoverBorder: "group-hover:border-[var(--primary-200)]",
  },
  accent: {
    border: "border-[var(--accent-200)]",
    bg: "bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_55%,var(--accent-50)_100%)]",
    iconBg: "bg-[var(--accent-100)]/80",
    iconText: "text-[var(--accent-600)]",
    arrowBg: "bg-card",
    arrowText: "text-[var(--accent-600)]",
    hoverBorder: "group-hover:border-[var(--accent-300)]",
  },
  neutral: {
    border: "border-[var(--border-subtle)]",
    bg: "bg-card",
    iconBg: "bg-muted/60",
    iconText: "text-foreground/80",
    arrowBg: "bg-muted/60",
    arrowText: "text-foreground/70",
    hoverBorder: "group-hover:border-[var(--border-default)]",
  },
};

export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  className,
  delay = 0,
  tone = "primary",
}: QuickActionProps): React.ReactElement {
  const t = TONE_MAP[tone];

  return (
    <Link href={href} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay }}
        whileHover={{ y: -2 }}
        className={cn(
          "group relative flex h-full items-center gap-3.5 overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:shadow-sm sm:gap-4 sm:p-5",
          t.border,
          t.bg,
          t.hoverBorder,
          className
        )}
      >
        {/* 主题色图标块 */}
        <div
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 sm:h-10 sm:w-10",
            t.iconBg,
            t.iconText
          )}
          aria-hidden
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </div>

        {/* 三层信息：title / description（保留辅助 hover 提示） */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-[15px] font-bold tracking-tight text-foreground sm:text-base">
            {title}
          </div>
          <div className="truncate text-[12px] leading-5 text-muted-foreground sm:text-[13px]">
            {description}
          </div>
        </div>

        {/* 操作箭头 */}
        <div
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-current/20",
            t.arrowBg,
            t.arrowText
          )}
          aria-hidden
        >
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </motion.div>
    </Link>
  );
}
