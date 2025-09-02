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
        "relative overflow-hidden transition-all duration-300",
        highlight && "scale-105 shadow-2xl",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-3">
            <div className="text-primary">{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
