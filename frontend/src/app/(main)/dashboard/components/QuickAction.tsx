import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { cn } from "@/lib/utils";

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  delay?: number;
  tone?: "default" | "primary";
  compact?: boolean;
}

export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  className,
  delay = 0,
  tone = "default",
  compact = false,
}: QuickActionProps): React.ReactElement {
  if (compact) {
    return (
      <Link href={href} className="block h-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay }}
          className={cn(
            "group flex h-full items-center gap-3 rounded-[1.35rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] px-4 py-4 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_24px_40px_-30px_rgba(15,23,42,0.42)] sm:gap-3.5 sm:px-[18px] sm:py-4",
            className
          )}
        >
          <div className="inline-flex shrink-0 rounded-full border border-primary/10 bg-primary/10 p-2.5 text-primary shadow-[0_14px_24px_-20px_rgba(20,184,166,0.55)]">
            <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">{title}</div>
            <div className="truncate text-[11px] leading-4 text-muted-foreground/90 sm:text-[12px] sm:leading-5">
              {description}
            </div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white/90 text-muted-foreground/70 transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={href} className="block h-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay }}
        whileHover={{ y: -2 }}
        className={cn(
          "group flex h-full flex-col justify-between rounded-[1.55rem] border p-5 shadow-[0_22px_40px_-34px_rgba(15,23,42,0.38)] transition-all duration-200",
          tone === "primary"
            ? "border-primary/18 bg-[linear-gradient(160deg,rgba(240,253,250,0.95),rgba(255,255,255,0.92))] hover:border-primary/28 hover:shadow-[0_28px_46px_-34px_rgba(20,184,166,0.32)]"
            : "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] hover:border-primary/18 hover:shadow-[0_28px_46px_-34px_rgba(15,23,42,0.42)]",
          className
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex shrink-0 rounded-2xl border p-3 shadow-[0_14px_24px_-20px_rgba(20,184,166,0.45)]",
                tone === "primary"
                  ? "border-primary/10 bg-primary/10 text-primary"
                  : "border-primary/10 bg-primary/8 text-primary"
              )}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-primary">
          <span>立即前往</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/10 bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
