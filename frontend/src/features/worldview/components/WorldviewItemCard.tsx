import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorldviewItem } from "@/lib/services/worldview.service";

interface WorldviewItemCardProps {
  worldItem: WorldviewItem;
  onSelect?: (name: string) => void;
  children?: React.ReactNode;
}

export function WorldviewItemCard({
  worldItem,
  onSelect,
  children,
}: WorldviewItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 阻止事件冒泡到展开/折叠按钮
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    if (worldItem.name) {
      onSelect?.(worldItem.name);
    }
  };

  return (
    <Card className="mb-3 cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{worldItem.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-1 text-xs">
                {/* TODO: Fix category display */}
                {worldItem.category_id}
              </Badge>
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            {children}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm pt-0">
        <p className="text-muted-foreground line-clamp-2">
          {worldItem.description}
        </p>

        {expanded && worldItem.description && (
          <div className="mt-2">
            <span className="font-medium">详细信息：</span>
            <p className="mt-1 text-muted-foreground">{worldItem.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}