import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 定义统计卡片的属性类型
interface StatsCardProps {
  title: string; // 卡片标题
  value: string; // 统计值
  description?: string; // 可选描述
  icon: React.ReactNode; // 图标
  className?: string; // 可选CSS类名
}

// 统计卡片组件
export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
}: StatsCardProps): React.ReactElement {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
