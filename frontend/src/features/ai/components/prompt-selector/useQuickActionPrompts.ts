/**
 * @file useQuickActionPrompts Hook
 * @description 封装快捷操作提示词列表的获取逻辑
 */

import { useQuery } from "@tanstack/react-query";
import {
  getPromptsService,
  type PromptForClient,
} from "@/lib/services/prompt.service";
import { toCamelCase } from "@/lib/utils";

/**
 * 快捷提示词的简化类型
 */
export interface QuickActionPrompt {
  id: number;
  title: string;
  description?: string;
  primaryTag?: string;
  icon?: string;
}

/**
 * Hook 返回类型
 */
export interface UseQuickActionPromptsReturn {
  /** 提示词列表 */
  prompts: QuickActionPrompt[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否加载出错 */
  isError: boolean;
  /** 错误信息 */
  error: Error | null;
  /** 重新获取数据 */
  refetch: () => void;
}

/**
 * 快捷操作提示词 Hook
 * 获取系统提示词列表，用于快捷操作选择器
 *
 * @param limit - 限制返回数量，默认 20
 * @returns 提示词列表及加载状态
 */
export const useQuickActionPrompts = (
  limit: number = 20
): UseQuickActionPromptsReturn => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["quickActionPrompts", { is_system: true, limit }],
    queryFn: () => getPromptsService({ is_system: true, limit }),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新获取
    gcTime: 10 * 60 * 1000, // 10 分钟后从缓存中移除
  });

  // 转换数据格式
  const prompts: QuickActionPrompt[] = (() => {
    if (!data?.data) return [];

    // 转换为驼峰命名
    const camelCaseData = toCamelCase(data.data) as {
      items?:PromptForClient[];
    };
    const items = camelCaseData.items || [];

    return items.map((item) => ({
      id: item.id as number,
      title: item.title || "",
      description: item.content?.substring(0, 50) || "",
      primaryTag: item.primaryTag,
      icon: undefined, // 可以后续从 summary 中提取
    }));
  })();

  return {
    prompts,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
  };
};

export default useQuickActionPrompts;
