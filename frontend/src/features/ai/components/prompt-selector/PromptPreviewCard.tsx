"use client";

import { Check, Copy, Sparkles, Star } from "lucide-react";
import { type FC, useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { PromptWithFavorite } from "./useAllPrompts";

// =============================================================================
// Types
// =============================================================================

interface PromptPreviewCardProps {
  /** 提示词数据 */
  prompt: PromptWithFavorite | null;
  /** 是否为内置提示词 */
  isBuiltIn?: boolean;
  /** 完整内容（如果需要显示更多） */
  fullContent?: string;
  /** 收藏切换回调 */
  onToggleFavorite?: (id: number) => void;
  /** 选择回调 */
  onSelect?: (id: number) => void;
  /** 是否显示选择按钮 */
  showSelectButton?: boolean;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// PromptPreviewCard Component
// =============================================================================

/**
 * 提示词预览卡片组件
 * 用于桌面端悬停预览和移动端点击展开
 */
export const PromptPreviewCard: FC<PromptPreviewCardProps> = ({
  prompt,
  isBuiltIn = false,
  fullContent,
  onToggleFavorite,
  onSelect,
  showSelectButton = true,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!prompt) return;
    const textToCopy = prompt.description || prompt.title;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [prompt]);

  const handleFavoriteClick = useCallback(() => {
    if (prompt && !isBuiltIn && onToggleFavorite) {
      onToggleFavorite(prompt.id);
    }
  }, [prompt, isBuiltIn, onToggleFavorite]);

  const handleSelect = useCallback(() => {
    if (prompt && onSelect) {
      onSelect(prompt.id);
    }
  }, [prompt, onSelect]);

  if (!prompt) {
    return (
      <Card className={cn("w-64 opacity-50", className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">悬停提示词查看预览</p>
        </CardContent>
      </Card>
    );
  }

  const displayContent = prompt.description || "";

  return (
    <Card
      className={cn(
        "w-72 shadow-lg border-border/50 backdrop-blur-sm",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
              {prompt.title}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-1">
              {isBuiltIn && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  内置
                </Badge>
              )}
              {prompt.primaryTag && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {prompt.primaryTag}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={handleFavoriteClick}
            disabled={isBuiltIn}
            className={cn(
              "p-1.5 rounded-full transition-colors",
              isBuiltIn
                ? "opacity-30 cursor-not-allowed"
                : prompt.isFavorite
                ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            )}
            aria-label={prompt.isFavorite ? "取消收藏" : "添加收藏"}
          >
            <Star
              className={cn("h-4 w-4", prompt.isFavorite && "fill-current")}
            />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* 内容预览：仅展示 description，无 description 则不展示 */}
        {displayContent && (
          <div className="bg-muted/50 rounded-md p-3 mb-3">
            <p className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-wrap">
              {displayContent}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {showSelectButton && onSelect && (
            <Button
              size="sm"
              onClick={handleSelect}
              className="flex-1 h-8 text-xs"
            >
              使用此提示词
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 px-2"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PromptPreviewCard;