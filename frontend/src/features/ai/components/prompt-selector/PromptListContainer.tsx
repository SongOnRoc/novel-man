"use client";

import { type FC, useMemo } from "react";

import { cn } from "@/lib/utils";

import { PromptItem } from "./PromptItem";
import type { PromptWithFavorite } from "./useAllPrompts";

// =============================================================================
// Types
// =============================================================================

/**
 * 提示词分组类型
 */
export type PromptGroupType = "builtin" | "favorite" | "system";

/**
 * 分组配置
 */
interface PromptGroup {
  type: PromptGroupType;
  title: string;
  prompts: PromptWithFavorite[];
}

interface PromptListContainerProps {
  /** 所有提示词 */
  prompts: PromptWithFavorite[];
  /** 当前选中的提示词ID */
  selectedPromptId: number | null;
  /** 搜索关键词 */
  searchKeyword?: string;
  /** 内置提示词ID列表 */
  builtInPromptIds?: number[];
  /** 选择回调 */
  onSelect: (id: number | null) => void;
  /** 收藏切换回调 */
  onToggleFavorite?: (id: number) => void;
  /** 悬停回调 */
  onHover?: (prompt: PromptWithFavorite | null) => void;
  /** 预览回调 */
  onPreview?: (prompt: PromptWithFavorite) => void;
  /** 是否禁用收藏操作 */
  isFavoriteDisabled?: boolean;
  /** 是否隐藏收藏按钮（收藏功能不可用时） */
  hideFavorite?: boolean;
  /** 清空搜索回调 */
  onClearSearch?: () => void;
  /** 最大高度 */
  maxHeight?: string;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// Group Titles
// =============================================================================

const GROUP_TITLES: Record<PromptGroupType, string> = {
  builtin: "内置提示词",
  favorite: "收藏提示词",
  system: "系统提示词",
};

// =============================================================================
// PromptListContainer Component
// =============================================================================

/**
 * 提示词列表容器组件
 * 支持分组显示（内置→收藏→系统）和搜索过滤
 */
export const PromptListContainer: FC<PromptListContainerProps> = ({
  prompts,
  selectedPromptId,
  searchKeyword = "",
  builtInPromptIds = [],
  onSelect,
  onToggleFavorite,
  onHover,
  onPreview,
  isFavoriteDisabled = false,
  hideFavorite = false,
  onClearSearch,
  maxHeight = "20rem",
  className,
}) => {
  // 过滤和分组提示词
  const { groups, isEmpty } = useMemo(() => {
    //搜索过滤
    const filtered = searchKeyword.trim()
      ? prompts.filter(
          (p) =>
            p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            (p.description
              ?.toLowerCase()
              .includes(searchKeyword.toLowerCase()) ??
              false)
        )
      : prompts;

    if (filtered.length === 0) {
      return { groups: [], isEmpty: true };
    }

    // 分组：内置 → 收藏 → 系统
    const builtinSet = new Set(builtInPromptIds);
    const builtin: PromptWithFavorite[] = [];
    const favorite: PromptWithFavorite[] = [];
    const system: PromptWithFavorite[] = [];

    for (const prompt of filtered) {
      if (builtinSet.has(prompt.id)) {
        builtin.push(prompt);
      } else if (prompt.isFavorite) {
        favorite.push(prompt);
      } else {
        system.push(prompt);
      }
    }

    const result: PromptGroup[] = [];
    if (builtin.length > 0) {
      result.push({
        type: "builtin",
        title: GROUP_TITLES.builtin,
        prompts: builtin,
      });
    }
    if (favorite.length > 0) {
      result.push({
        type: "favorite",
        title: GROUP_TITLES.favorite,
        prompts: favorite,
      });
    }
    if (system.length > 0) {
      result.push({
        type: "system",
        title: GROUP_TITLES.system,
        prompts: system,
      });
    }

    return { groups: result, isEmpty: false };
  }, [prompts, searchKeyword, builtInPromptIds]);

  const handleSelect = (id: number): void => {
    onSelect(selectedPromptId === id ? null : id);
  };

  if (isEmpty) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center py-8 text-muted-foreground",
          className
        )}
      >
        <p className="text-sm">
          {searchKeyword ? "未找到匹配的提示词" : "暂无提示词"}
        </p>
        {searchKeyword && (
          <button
            type="button"
            className="text-xs mt-2 text-primary hover:underline"
            onClick={onClearSearch}
          >
            清空搜索并查看全部
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("pr-1 overflow-y-auto overscroll-contain", className)}
      style={{ maxHeight }}
    >
      <div className="flex flex-col gap-1">
        {groups.map((group, groupIndex) => (
          <div key={group.type}>
            {/* 分组标题 */}
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                {group.title}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                ({group.prompts.length})
              </span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* 分组内容 */}
            <div className="flex flex-col gap-0.5 px-1">
              {group.prompts.map((prompt) => (
                <PromptItem
                  key={prompt.id}
                  prompt={prompt}
                  isSelected={selectedPromptId === prompt.id}
                  isBuiltIn={group.type === "builtin"}
                  searchKeyword={searchKeyword}
                  onSelect={handleSelect}
                  onToggleFavorite={onToggleFavorite}
                  onHover={onHover}
                  onPreview={onPreview}
                  isFavoriteDisabled={isFavoriteDisabled}
                  hideFavorite={hideFavorite}
                />
              ))}
            </div>

            {/* 分组分隔线 */}
            {groupIndex < groups.length - 1 && <div className="h-2" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromptListContainer;
