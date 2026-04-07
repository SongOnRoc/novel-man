import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import React from "react";

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
}: StatCardProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn("h-full border-border/80 bg-card shadow-sm", className)}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">{value}</h2>
                {trend && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      trend.value > 0 ? "text-emerald-600" : "text-rose-500"
                    )}
                  >
                    {trend.value > 0 ? "+" : ""}
                    {trend.value}% {trend.label}
                  </span>
                )}
              </div>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>

            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
