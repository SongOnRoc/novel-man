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
            "group flex items-center gap-3 rounded-[1.125rem] border border-border/50 bg-white px-3.5 py-3.5 transition-all hover:bg-primary/[0.025] hover:shadow-[0_8px_22px_rgba(15,23,42,0.04)] sm:gap-3.5 sm:px-4 sm:py-4",
            className
          )}
        >
          <div className="inline-flex shrink-0 rounded-full bg-primary/8 p-2 text-primary sm:p-2">
            <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">{title}</div>
            <div className="truncate text-[11px] leading-4 text-muted-foreground/90 sm:text-[12px] sm:leading-5">
              {description}
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
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
          "group flex h-full flex-col justify-between rounded-2xl border p-5 transition-all",
          tone === "primary"
            ? "border-primary/20 bg-primary/5 hover:border-primary/30 hover:bg-primary/10"
            : "border-border bg-card hover:border-primary/20 hover:bg-muted/40",
          className
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "inline-flex shrink-0 rounded-2xl p-3",
                tone === "primary" ? "bg-primary/10 text-primary" : "bg-muted text-primary"
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

        <div className="mt-5 inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-primary">
          <span>立即前往</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </motion.div>
    </Link>
  );
}

