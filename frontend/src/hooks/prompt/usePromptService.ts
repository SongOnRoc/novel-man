/**
 * @file Prompt Hooks
 * @description This file contains TanStack Query hooks for prompt-related operations.
 * It uses functions from the prompt service and integrates with TanStack Query for
 * data fetching, caching, and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toCamelCase } from "@/lib/utils";
import {
  getPromptsService,
  getPromptByIdService,
  createPromptService,
  updatePromptService,
  deletePromptService,
  importPromptsService,
} from "@/lib/services/prompt.service";
import type {
  CreatePromptPayload,
  UpdatePromptPayload,
  PromptsParams,
  PromptsListForClient,
  PromptForClient,
  ImportResultForClient,
} from "@/lib/services/prompt.service";

/**
 * Centralized query keys for prompts.
 */
const promptKeys = {
  all: ["prompts"] as const,
  lists: () => [...promptKeys.all, "list"] as const,
  list: (params: PromptsParams) => [...promptKeys.lists(), params] as const,
  details: () => [...promptKeys.all, "detail"] as const,
  detail: (id: number) => [...promptKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of prompts.
 * @param params - The query parameters for fetching prompts.
 */
export const usePromptList = (params: PromptsParams) => {
  return useQuery({
    queryKey: promptKeys.list(params),
    queryFn: () => getPromptsService(params),
    select: (data: unknown) => toCamelCase(data) as PromptsListForClient,
  });
};

/**
 * Hook to fetch a single prompt by its ID.
 * @param id - The ID of the prompt to fetch.
 */
export const usePromptById = (id: number) => {
  return useQuery({
    queryKey: promptKeys.detail(id),
    queryFn: () => getPromptByIdService(id),
    select: (data: unknown) => toCamelCase(data) as PromptForClient,
    enabled: !!id,
  });
};

/**
 * Hook to create a new prompt.
 * Invalidates the prompt list query on success.
 */
export const useCreatePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (promptData: CreatePromptPayload) => createPromptService(promptData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing prompt.
 * Invalidates both the prompt list and the specific prompt detail query on success.
 */
export const useUpdatePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePromptPayload }) =>
      updatePromptService(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: promptKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook to delete a prompt.
 * Invalidates the prompt list query on success.
 */
export const useDeletePrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePromptService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
  });
};

/**
 * Hook to import prompts from a file.
 * Invalidates the prompt list query on success.
 */
export const useImportPrompts = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importPromptsService(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
  });
};