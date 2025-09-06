/**
 * @file Draft Hooks
 * @description This file contains TanStack Query hooks for draft-related operations.
 * It uses functions from the draft service and integrates with TanStack Query for
 * data fetching, caching, and mutations.
 */

import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import {
  getDraftsService,
  getDraftByIdService,
  createDraftService,
  updateDraftService,
  deleteDraftService,
  publishDraftService,
} from "@/lib/services/draft.service";
import type {
  DraftsParams,
  CreateDraftPayload,
  UpdateDraftPayload,
  DraftListResponseForClient,
  DraftForClient,
} from "@/lib/services/draft.service";
import { toCamelCase, toSnakeCase } from "@/lib/utils";
import { SnakeToCamelCase } from "@/types/type-utils";

// Client-facing payload types with camelCase properties
export type CreateDraftPayloadForClient = SnakeToCamelCase<CreateDraftPayload>;
export type UpdateDraftPayloadForClient = SnakeToCamelCase<UpdateDraftPayload>;

/**
 * Custom parameter type for the useDraftList hook.
 * This allows the UI layer to use camelCase (workId) while the underlying
 * service and API layers expect snake_case (work_id).
 */
export type UseDraftListParams = Omit<DraftsParams, "work_id"> & {
  workId?: number;
};

/**
 * Centralized query keys for drafts.
 */
const draftKeys = {
  all: ["drafts"] as const,
  lists: () => [...draftKeys.all, "list"] as const,
  list: (params: DraftsParams) => [...draftKeys.lists(), params] as const,
  details: () => [...draftKeys.all, "detail"] as const,
  detail: (id: number) => [...draftKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of drafts for a specific work.
 * @param params - The query parameters for fetching drafts.
 */
export const useDraftList = (params: UseDraftListParams) => {
  const { workId, ...rest } = params;

  // Transform to the snake_case format expected by the API service
  const serviceParams: DraftsParams = {
    work_id: workId,
    ...rest,
  };

  return useQuery({
    queryKey: draftKeys.list(serviceParams),
    queryFn: () => getDraftsService(serviceParams),
    select: (data) => toCamelCase(data) as DraftListResponseForClient,
  });
};

/**
 * Hook to fetch a single draft by its ID.
 * @param id - The ID of the draft to fetch.
 */
export const useDraftById = (id: number) => {
  return useQuery({
    queryKey: draftKeys.detail(id),
    queryFn: () => getDraftByIdService(id),
    enabled: !!id,
    select: (data) => toCamelCase(data) as DraftForClient,
  });
};

/**
 * Hook to create a new draft.
 * Invalidates the draft list query on success.
 */
export const useCreateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftData: CreateDraftPayloadForClient) => {
      return createDraftService(draftData as unknown as CreateDraftPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing draft.
 * Invalidates both the draft list and the specific draft detail query on success.
 */
export const useUpdateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateDraftPayloadForClient;
    }) => {
      return updateDraftService(
        id,
        data as unknown as UpdateDraftPayload
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: draftKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook to delete a draft.
 * Invalidates the draft list query on success.
 */
export const useDeleteDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDraftService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
    },
  });
};

/**
 * Hook to publish a draft as a new chapter.
 * Invalidates both the draft list and chapter list queries on success.
 */
export const usePublishDraft = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (id: number) => publishDraftService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: draftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["chapters", "list"] });
      router.refresh();
    },
  });
};
