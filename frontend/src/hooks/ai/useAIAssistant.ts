import { useState, useCallback } from "react";
import { AIGenerateParams, AIPromptType } from "@/types/ai";
import { mockGenerateAIResponse } from "@/lib/mock/ai-mock-data";

/**
 * AI写作助手Hook
 * 提供AI内容生成、响应管理和错误处理功能
 */
export function useAIAssistant() {
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // AI响应内容
  const [response, setResponse] = useState<string>("");
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 当前提示类型和内容（用于重新生成）
  const [currentPrompt, setCurrentPrompt] = useState<AIGenerateParams | null>(
    null
  );

  /**
   * 生成AI响应
   */
  const generateResponse = useCallback(async (params: AIGenerateParams) => {
    // 设置加载状态和清除错误
    setIsLoading(true);
    setError(null);

    // 保存当前提示信息，用于后续重新生成
    setCurrentPrompt(params);

    try {
      // 在实际应用中，这里应该调用后端API
      // 在MVP版本中，使用模拟数据
      const result = await mockGenerateAIResponse(params);

      // 设置响应结果
      setResponse(result);
      return result;
    } catch (err) {
      // 错误处理
      const errorMessage =
        err instanceof Error ? err.message : "生成AI回复时发生错误";
      setError(errorMessage);
      console.error("AI生成错误:", err);
      return null;
    } finally {
      // 无论成功或失败，都结束加载状态
      setIsLoading(false);
    }
  }, []);

  /**
   * 重新生成响应，使用之前的提示参数
   */
  const regenerateResponse = useCallback(async () => {
    if (!currentPrompt) return null;

    return generateResponse(currentPrompt);
  }, [currentPrompt, generateResponse]);

  /**
   * 清除响应和错误状态
   */
  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
  }, []);

  return {
    isLoading,
    response,
    error,
    generateResponse,
    regenerateResponse,
    clearResponse,
    hasPrompt: !!currentPrompt,
  };
}
