import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 定义统计卡片的属性类型
interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: React.ReactNode;
  className?: string;
  highlight?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
  highlight = false,
}: StatsCardProps): React.ReactElement {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
        highlight && "scale-105 shadow-2xl animate-pulse-subtle",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-secondary-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gradient-primary">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl p-3 transition-all duration-300",
            className?.includes("card-primary") && "bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900 dark:to-primary-800",
            className?.includes("card-accent") && "bg-gradient-to-br from-accent-100 to-accent-50 dark:from-accent-900 dark:to-accent-800",
            !className?.includes("card-primary") && !className?.includes("card-accent") && "bg-gradient-to-br from-primary/20 to-primary/5"
          )}>
            <div className={cn(
              "transition-colors duration-300",
              className?.includes("card-primary") && "text-primary-600 dark:text-primary-300",
              className?.includes("card-accent") && "text-accent-600 dark:text-accent-300",
              !className?.includes("card-primary") && !className?.includes("card-accent") && "text-primary"
            )}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
