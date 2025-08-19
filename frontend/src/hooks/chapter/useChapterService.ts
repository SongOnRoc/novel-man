/**
 * @file Chapter Hooks
 * @description This file contains TanStack Query hooks for chapter-related operations.
 * It uses the auto-generated hooks from Orval and adds application-specific
 * logic like query invalidation.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getChaptersService,
  getChapterByIdService,
  createChapterService,
  updateChapterService,
  deleteChapterService,
} from "@/lib/services/chapter.service";
import type {
  Chapter,
  ChapterListParams,
  CreateChapterPayload,
  UpdateChapterPayload,
  ChapterListResponseForClient,
  ChapterForClient,
} from "@/lib/services/chapter.service";
import { toSnakeCase } from "@/lib/utils";
import { SnakeToCamelCase } from "@/types/type-utils";

// Client-facing payload types with camelCase properties
export type CreateChapterPayloadForClient = SnakeToCamelCase<CreateChapterPayload>;
export type UpdateChapterPayloadForClient = SnakeToCamelCase<UpdateChapterPayload>;

/**
 * Custom parameter type for the useChapterList hook.
 * This allows the UI layer to use camelCase (workId) while the underlying
 * service and API layers expect snake_case (work_id).
 */
export type UseChapterListParams = Omit<ChapterListParams, "work_id"> & {
  workId: number;
};

/**
 * Centralized query keys for chapters.
 */
const chapterKeys = {
  all: ["chapters"] as const,
  lists: () => [...chapterKeys.all, "list"] as const,
  list: (params: ChapterListParams) =>
    [...chapterKeys.lists(), params] as const,
  details: () => [...chapterKeys.all, "detail"] as const,
  detail: (id: number) => [...chapterKeys.details(), id] as const,
};

/**
 * Hook to fetch a paginated list of chapters for a specific work.
 * @param params - The query parameters for fetching chapters.
 */
export const useChapterList = (params: UseChapterListParams) => {
  const { workId, ...rest } = params;

  // Transform to the snake_case format expected by the API service
  const serviceParams: ChapterListParams = {
    work_id: workId,
    ...rest,
  };

  return useQuery<ChapterListResponseForClient>({
    // We use the client-facing params for the queryKey to ensure consistency
    // in how the key is generated and used throughout the app.
    queryKey: chapterKeys.list(serviceParams),
    queryFn: () =>
      getChaptersService(serviceParams) as unknown as ChapterListResponseForClient,
    // The query is enabled only if workId is provided.
    enabled: !!workId,
  });
};

/**
 * Hook to fetch a single chapter by its ID.
 * @param id - The ID of the chapter to fetch.
 */
export const useChapterById = (id: number) => {
  return useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: () => getChapterByIdService(id),
    enabled: !!id,
    select: (data) => data as ChapterForClient,
  });
};

/**
 * Hook to create a new chapter.
 * Invalidates the chapter list query on success.
 */
export const useCreateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chapterData: CreateChapterPayloadForClient) => {
      return createChapterService(chapterData as unknown as CreateChapterPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing chapter.
 * Invalidates both the chapter list and the specific chapter detail query on success.
 */
export const useUpdateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateChapterPayloadForClient;
    }) => {
      return updateChapterService(
        id,
        data as unknown as UpdateChapterPayload
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: chapterKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook to delete a chapter.
 * Invalidates the chapter list query on success.
 */
export const useDeleteChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteChapterService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
    },
  });
};
