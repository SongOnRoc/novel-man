"use client";

import { Check, Eye, Sparkles, Star } from "lucide-react";
import { type FC, useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import type { PromptWithFavorite } from "./useAllPrompts";

// =============================================================================
// Types
// =============================================================================

interface PromptItemProps {
  /** 提示词数据 */
  prompt: PromptWithFavorite;
  /** 是否选中 */
  isSelected: boolean;
  /** 是否为内置提示词（不可收藏） */
  isBuiltIn?: boolean;
  /** 搜索关键词（用于高亮） */
  searchKeyword?: string;
  /** 点击选择回调 */
  onSelect: (id: number) => void;
  /** 收藏切换回调 */
  onToggleFavorite?: (id: number) => void;
  /**悬停回调（桌面端预览用） */
  onHover?: (prompt: PromptWithFavorite | null) => void;
  /** 预览按钮点击回调 */
  onPreview?: (prompt: PromptWithFavorite) => void;
  /** 是否禁用收藏（正在操作中） */
  isFavoriteDisabled?: boolean;
  /** 是否隐藏收藏按钮（收藏功能不可用时） */
  hideFavorite?: boolean;
  /** 自定义类名 */
  className?: string;
}
// =============================================================================
// Helper: Highlight matching text
// =============================================================================

const HighlightText: FC<{ text: string; keyword: string }> = ({
  text,
  keyword,
}) => {
  if (!keyword || !keyword.trim()) {
    return <>{text}</>;
  }

  const regex = new RegExp(
    `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-primary/20 text-primary px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
};

// =============================================================================
// PromptItem Component
// =============================================================================

/**
 * 单个提示词项组件
 * 支持选中高亮、收藏切换、搜索关键词高亮
 */
export const PromptItem: FC<PromptItemProps> = ({
  prompt,
  isSelected,
  isBuiltIn = false,
  searchKeyword = "",
  onSelect,
  onToggleFavorite,
  onHover,
  onPreview,
  isFavoriteDisabled = false,
  hideFavorite = false,
  className,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleClick = useCallback(() => {
    onSelect(prompt.id);
  }, [onSelect, prompt.id]);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isBuiltIn && onToggleFavorite) {
        onToggleFavorite(prompt.id);
      }
    },
    [isBuiltIn, onToggleFavorite, prompt.id]
  );

  const handlePreviewClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onPreview?.(prompt);
    },
    [onPreview, prompt]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    onHover?.(prompt);
  }, [onHover, prompt]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    onHover?.(null);
  }, [onHover]);

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "group flex items-center gap-2 w-full rounded-lg text-left transition-all duration-200 cursor-pointer",
        "px-3 py-2.5",
        isSelected
          ? "bg-primary/10 text-primary ring-1 ring-primary/20"
          : "hover:bg-muted/80",
        className
      )}
    >
      {/* 选中/默认图标 */}
      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {isSelected ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Sparkles className="h-4 w-4 text-muted-foreground group-hover:text-primary/60 transition-colors" />
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-sm font-medium truncate",
              isSelected ? "text-primary" : "text-foreground"
            )}
          >
            <HighlightText text={prompt.title} keyword={searchKeyword} />
          </span>
          {/* 内置标签 */}
          {isBuiltIn && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              内置
            </span>
          )}
        </div>
        {prompt.description && (
          <span className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            <HighlightText text={prompt.description} keyword={searchKeyword} />
          </span>
        )}
      </div>

      {/* 操作区 */}
      <div className="flex items-center gap-1 flex-shrink-0 w-[56px] justify-end">
        {!isBuiltIn && (
          <button
            type="button"
            onClick={handlePreviewClick}
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center p-1.5 rounded-full transition-colors text-muted-foreground hover:text-primary hover:bg-muted",
              isHovering ? "opacity-100" : "opacity-90"
            )}
            aria-label="预览提示词"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}

        {!hideFavorite && !isBuiltIn && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={isFavoriteDisabled}
            className={cn(
              "inline-flex h-7 min-w-7 items-center justify-center p-1.5 rounded-full transition-all duration-200",
              prompt.isFavorite
                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                : "text-muted-foreground opacity-80 hover:opacity-100 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            )}
            aria-label={prompt.isFavorite ? "取消收藏" : "添加收藏"}
          >
            <Star
              className={cn("h-4 w-4", prompt.isFavorite && "fill-current")}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default PromptItem;
