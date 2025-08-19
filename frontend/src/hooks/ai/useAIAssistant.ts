import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import {
  polishTextService,
  getCompletionService,
  generateOutlineService,
  createCharacterService,
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
