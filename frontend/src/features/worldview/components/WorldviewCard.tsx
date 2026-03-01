import { MoreVertical, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorldviewItem } from "@/lib/services/worldview.service";

interface WorldviewCardProps {
  item: WorldviewItem;
  workId: number;
  categoryName?: string;
  onDelete: () => void;
}

export function WorldviewCard({
  item,
  workId,
  categoryName,
  onDelete,
}: WorldviewCardProps) {
  return (
    <Card className="flex h-full flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link href={`/works/${workId}/worldview`}>
              <CardTitle className="hover:underline">{item.name}</CardTitle>
            </Link>
            <CardDescription>{categoryName || "未分类"}</CardDescription>
          </div>
          <WorldviewCardMenu itemId={item.id!} workId={workId} onDelete={onDelete} />
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {item.description || "暂无描述"}
        </p>
      </CardContent>
    </Card>
  );
}

function WorldviewCardMenu({
  itemId,
  workId,
  onDelete,
}: {
  itemId: number;
  workId: number;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/works/${workId}/worldview`}>
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}