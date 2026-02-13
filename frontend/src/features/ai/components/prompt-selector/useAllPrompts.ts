/**
 * @file useAllPrompts Hook
 * @description 获取所有提示词列表（包括系统提示词和用户导入的），并集成收藏状态
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getPromptsService,
  type PromptForClient,
} from "@/lib/services/prompt.service";
import { toCamelCase } from "@/lib/utils";
import { useFavorites } from "@/hooks/favorites/useFavorites";

/**
 * 提示词基础类型
 */
export interface PromptBase {
  id: number;
  title: string;
  description?: string;
  primaryTag?: string;
  icon?: string;
}

/**
 * 带收藏状态的提示词类型
 */
export interface PromptWithFavorite extends PromptBase {
  /** 是否已收藏 */
  isFavorite: boolean;
}

/**
 * Hook返回类型
 */
export interface UseAllPromptsReturn {
  /** 提示词列表（带收藏状态） */
  prompts: PromptWithFavorite[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否加载出错 */
  isError: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 重新获取数据 */
  refetch: () => void;
  /** 切换收藏状态 */
  toggleFavorite: (promptId: number) => Promise<void>;
  /** 检查是否已收藏 */
  isFavorite: (promptId: number) => boolean;
  /** 是否正在添加收藏 */
  isAddingFavorite: boolean;
  /** 是否正在移除收藏 */
  isRemovingFavorite: boolean;
  /** 收藏功能是否可用 */
  isFavoriteAvailable: boolean;
}

/**
 * 获取所有提示词 Hook
 * 用于"更多"菜单显示所有可用提示词，并集成收藏功能
 *
 * @param limit - 限制返回数量，默认 50
 * @returns 提示词列表及加载状态，包含收藏相关功能
 */
export const useAllPrompts = (limit: number = 50): UseAllPromptsReturn => {
  // 获取提示词列表
  const {
    data,
    isLoading: isLoadingPrompts,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["allPrompts", { limit }],
    queryFn: () => getPromptsService({ limit }),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新获取
    gcTime: 10 * 60 * 1000, // 10 分钟后从缓存中移除
  });

  // 获取收藏状态 - 收藏功能是独立的，即使失败也不影响提示词列表显示
  const {
    isFavorite,
    toggleFavorite,
    isAdding: isAddingFavorite,
    isRemoving: isRemovingFavorite,
    isAvailable: isFavoriteAvailable,
  } = useFavorites("prompt");

  // 转换数据格式并集成收藏状态
  const prompts: PromptWithFavorite[] = useMemo(() => {
    if (!data) return [];

    // 转换为驼峰命名
    const camelCaseData = toCamelCase(data) as {
      items?: PromptForClient[];
    };
    const items = camelCaseData.items || [];

    return items.map((item) => ({
      id: item.id as number,
      title: item.title || "",
      // 仅展示后端 description，避免在选择器中泄露 content
      description: item.description,
      primaryTag: item.primaryTag,
      icon: undefined,
      isFavorite: isFavorite(item.id as number),
    }));
  }, [data, isFavorite]);
  return {
    prompts,
    // 只等待提示词加载，收藏状态可以后台加载或失败也没关系
    isLoading: isLoadingPrompts,
    isError,
    error: error as Error | null,
    refetch,
    toggleFavorite,
    isFavorite,
    isAddingFavorite,
    isRemovingFavorite,
    // 暴露收藏功能可用性，让UI可以决定是否显示收藏按钮
    isFavoriteAvailable,
  };
};

export default useAllPrompts;
