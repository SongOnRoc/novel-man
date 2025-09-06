/**
 * @file Work Hooks
 * @description This file contains TanStack Query hooks for work-related operations.
 * It uses functions from the work service and integrates with TanStack Query for
 * data fetching, caching, and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { toCamelCase } from "@/lib/utils";
import {
  useRelationshipList,
  useCreateRelationship,
  useDeleteRelationship,
} from "@/hooks/relationship/useRelationshipService";
import {
  Relationship,
  RelationshipListResponse,
} from "@/lib/services/relationship.service";
import {
  getWorksService,
  getWorkByIdService,
  createWorkService,
  updateWorkService,
  deleteWorkService,
} from "@/lib/services/work.service";
import type {
  CreateWorkPayload,
  UpdateWorkPayload,
  WorksParams,
  WorksListForClient,
  WorkForClient,
} from "@/lib/services/work.service";

/**
 * Centralized query keys for works.
 */
const workKeys = {
  all: ["works"] as const,
  lists: () => [...workKeys.all, "list"] as const,
  list: (params: WorksParams) => [...workKeys.lists(), params] as const,
  details: () => [...workKeys.all, "detail"] as const,
  detail: (id: number) => [...workKeys.details(), id] as const,
  characters: (workId: number) =>
    [...workKeys.detail(workId), "characters"] as const,
  worldviewItems: (workId: number) =>
    [...workKeys.detail(workId), "worldview-items"] as const,
};

/**
 * Hook to fetch a paginated list of works.
 * @param params - The query parameters for fetching works.
 */
export const useWorkList = (params: WorksParams) => {
  return useQuery({
    queryKey: workKeys.list(params),
    queryFn: () => getWorksService(params) as unknown as WorksListForClient,
  });
};

/**
 * Hook to fetch a single work by its ID.
 * @param id - The ID of the work to fetch.
 */
export const useWorkById = (id: number) => {
  return useQuery({
    queryKey: workKeys.detail(id),
    queryFn: () => getWorkByIdService(id),
    select: (data: unknown) => toCamelCase(data) as WorkForClient,
    enabled: !!id,
  });
};

/**
 * Hook to create a new work.
 * Invalidates the work list query on success.
 */
export const useCreateWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workData: CreateWorkPayload) => createWorkService(workData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
    },
  });
};

/**
 * Hook to update an existing work.
 * Invalidates both the work list and the specific work detail query on success.
 */
export const useUpdateWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWorkPayload }) =>
      updateWorkService(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: workKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook to delete a work.
 * Invalidates the work list query on success.
 */
export const useDeleteWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWorkService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
    },
  });
};

/**
 * Hook to manage characters associated with a work.
 * @param workId - The ID of the work.
 */
export const useWorkCharacters = (workId: number) => {
  const { data, isLoading, error } = useRelationshipList(
    {
      sourceEntityId: workId,
      sourceEntityType: "work",
    },
    { enabled: !!workId }
  );

  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();

  const associate = (characterId: number) => {
    return createRelationship.mutateAsync({
      data: {
        source_entity_id: workId,
        source_entity_type: "work",
        target_entity_id: characterId,
        target_entity_type: "character",
        relationship_type: "associates",
      },
    });
  };

  const dissociate = (relationshipId: number) => {
    return deleteRelationship.mutateAsync({ id: relationshipId });
  };

  return {
    characters: (data?.data as RelationshipListResponse)?.data || [],
    isLoading,
    error,
    associate,
    dissociate,
  };
};

/**
 * Hook to manage worldview items associated with a work.
 * @param workId - The ID of the work.
 */
export const useWorkWorldview = (workId: number) => {
  const { data, isLoading, error } = useRelationshipList(
    {
      sourceEntityId: workId,
      sourceEntityType: "work",
    },
    { enabled: !!workId }
  );

  const createRelationship = useCreateRelationship();
  const deleteRelationship = useDeleteRelationship();

  const associate = (itemId: number) => {
    return createRelationship.mutateAsync({
      data: {
        source_entity_id: workId,
        source_entity_type: "work",
        target_entity_id: itemId,
        target_entity_type: "worldview_item",
        relationship_type: "associates",
      },
    });
  };

  const dissociate = (relationshipId: number) => {
    return deleteRelationship.mutateAsync({ id: relationshipId });
  };

  return {
    items: (data?.data as RelationshipListResponse)?.data || [],
    isLoading,
    error,
    associate,
    dissociate,
  };
};
