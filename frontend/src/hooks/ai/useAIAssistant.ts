import { useState, useCallback } from "react";
import { AIGenerateParams } from "@/types/ai";
import { mockGenerateAIResponse } from "@/lib/mock/ai-mock-data";

const MAX_HISTORY_LENGTH = 5;

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<AIGenerateParams | null>(
    null
  );
  const [history, setHistory] = useState<string[]>([]);

  const generateResponse = useCallback(
    async (params: AIGenerateParams) => {
      setIsLoading(true);
      setError(null);
      setCurrentPrompt(params);

      try {
        const result = await mockGenerateAIResponse(params);
        setResponse(result);
        if (typeof result === 'string' && result) {
          setHistory((prev) => [result, ...prev].slice(0, MAX_HISTORY_LENGTH));
        }
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "生成AI回复时发生错误";
        setError(errorMessage);
        console.error("AI生成错误:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const regenerateResponse = useCallback(async () => {
    if (!currentPrompt) return null;
    return generateResponse(currentPrompt);
  }, [currentPrompt, generateResponse]);

  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
    setCurrentPrompt(null);
  }, []);

  const applyFromHistory = useCallback((text: string) => {
    setResponse(text);
  }, []);

  return {
    isLoading,
    response,
    error,
    history,
    generateResponse,
    regenerateResponse,
    clearResponse,
    applyFromHistory,
    hasPrompt: !!currentPrompt,
  };
}
