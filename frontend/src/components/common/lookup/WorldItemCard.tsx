import { WorldItem, worldItemTypeOptions } from "@/types/worldbuilding";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface WorldItemCardProps {
  worldItem: WorldItem;
}

export function WorldItemCard({ worldItem }: WorldItemCardProps) {
  const [expanded, setExpanded] = useState(false);

  // 获取设定类型标签
  const typeLabel =
    worldItemTypeOptions.find((opt) => opt.value === worldItem.type)?.label ||
    worldItem.type;

  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{worldItem.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-1 text-xs">
                {typeLabel}
              </Badge>
            </CardDescription>
          </div>
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
      </CardHeader>
      <CardContent className="text-sm pt-0">
        <p className="text-muted-foreground line-clamp-2">
          {worldItem.description}
        </p>

        {expanded && worldItem.details && (
          <div className="mt-2">
            <span className="font-medium">详细信息：</span>
            <p className="mt-1 text-muted-foreground">{worldItem.details}</p>
          </div>
        )}

        {expanded && worldItem.tags.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">标签：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {worldItem.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
