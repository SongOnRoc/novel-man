import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import {
  polishTextService,
  getCompletionService,
  generateOutlineService,
  createCharacterService,
  generateStreamService,
  type GenerateRequest,
} from "@/lib/services/ai.service";
import type {
  PolishRequest,
  PolishResponse,
  CompletionRequest,
  CompletionResponse,
  GenerateOutlineRequest,
  GenerateOutlineResponse,
  CreateCharacterRequest,
  CreateCharacterResponse,
} from "@/lib/services/ai.service";

/**
 * Hook for streaming AI generation.
 */
export const useGenerateStream = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<(() => void) | null>(null);

  const generate = useCallback((data: GenerateRequest) => {
    setIsLoading(true);
    setStreamingContent("");
    setError(null);

    // Abort previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current();
    }

    abortControllerRef.current = generateStreamService(
      data,
      (text) => {
        setStreamingContent((prev) => prev + text);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    );
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    generate,
    stop,
    isLoading,
    streamingContent,
    error,
  };
};

/**
 * Hook for polishing text using AI.
 * @param options - Optional mutation options from TanStack Query.
 */
export const usePolishTextMutation = (
  options?: UseMutationOptions<PolishResponse, unknown, PolishRequest>
) => {
  return useMutation({
    mutationFn: polishTextService,
    ...options,
  });
};

/**
 * Hook for getting text completion from AI.
 * @param options - Optional mutation options from TanStack Query.
 */
export const useGetCompletionMutation = (
  options?: UseMutationOptions<CompletionResponse, unknown, CompletionRequest>
) => {
  return useMutation({
    mutationFn: getCompletionService,
    ...options,
  });
};

/**
 * Hook for generating an outline from AI.
 * @param options - Optional mutation options from TanStack Query.
 */
export const useGenerateOutlineMutation = (
  options?: UseMutationOptions<
    GenerateOutlineResponse,
    unknown,
    GenerateOutlineRequest
  >
) => {
  return useMutation({
    mutationFn: generateOutlineService,
    ...options,
  });
};

/**
 * Hook for creating a character using AI.
 * @param options - Optional mutation options from TanStack Query.
 */
export const useCreateCharacterMutation = (
  options?: UseMutationOptions<
    CreateCharacterResponse,
    unknown,
    CreateCharacterRequest
  >
) => {
  return useMutation({
    mutationFn: createCharacterService,
    ...options,
  });
};
