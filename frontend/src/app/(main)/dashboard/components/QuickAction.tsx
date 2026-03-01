import React from "react";
import { motion } from "framer-motion";
import { LucideIcon, ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface QuickActionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  className?: string;
  delay?: number;
  gradient?: string;
}

export function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  className,
  delay = 0,
  gradient = "from-primary/80 to-emerald-600/80",
}: QuickActionProps) {
  return (
    <Link href={href} className="block h-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "group relative h-full overflow-hidden rounded-xl p-6 text-white shadow-lg transition-all hover:shadow-xl",
          "bg-gradient-to-br",
          gradient,
          className
        )}
      >
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div>
            <div className="mb-4 inline-flex rounded-lg bg-white/20 p-3 backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-1 text-xl font-bold tracking-tight">{title}</h3>
            <p className="text-sm text-white/80">{description}</p>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
            立即开始 <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>

        {/* 装饰图案 */}
        <Icon className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12" />
      </motion.div>
    </Link>
  );
}
