/**
 * @file Draft Hooks
 * @description This file contains TanStack Query hooks for draft-related operations.
 * It uses functions from the draft service and integrates with TanStack Query for
 * data fetching, caching, and mutations.
 */

import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import {
  getDraftsService,
  getDraftByIdService,
  createDraftService,
  updateDraftService,
  deleteDraftService,
  publishDraftService,
} from '@/lib/services/draft.service';
import type {
  DraftsParams,
  CreateDraftPayload,
  UpdateDraftPayload,
} from '@/lib/services/draft.service';
import { useRouter } from 'next/navigation';

/**
 * Centralized query keys for drafts.
 */
const draftKeys = {
  all: ['drafts'] as const,
  lists: () => [...draftKeys.all, 'list'] as const,
  list: (params: DraftsParams) => [...draftKeys.lists(), params] as const,
  details: () => [...draftKeys.all, 'detail'] as const,
  detail: (id: number) => [...draftKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of drafts for a specific work.
 * @param params - The query parameters for fetching drafts.
 */
export const useDraftList = (params: DraftsParams) => {
  return useQuery({
    queryKey: draftKeys.list(params),
    queryFn: () => getDraftsService(params),
    enabled: !!params.work_id,
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
  });
};

/**
 * Hook to create a new draft.
 * Invalidates the draft list query on success.
 */
export const useCreateDraft = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftData: CreateDraftPayload) => createDraftService(draftData),
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
    mutationFn: ({ id, data }: { id: number; data: UpdateDraftPayload }) =>
      updateDraftService(id, data),
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
      queryClient.invalidateQueries({ queryKey: ['chapters', 'list'] });
      router.refresh();
    },
  });
};
