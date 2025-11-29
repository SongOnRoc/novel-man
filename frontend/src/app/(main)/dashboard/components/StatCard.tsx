import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  delay?: number;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <Card className={cn("h-full overflow-hidden border-none shadow-lg transition-all hover:shadow-xl", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value > 0 ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </CardContent>
        {/* 装饰背景 */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      </Card>
    </motion.div>
  );
}
