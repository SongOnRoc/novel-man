/**
 * @file Relationship Hooks
 * @description This file contains TanStack Query hooks for relationship-related operations.
 * It uses the auto-generated hooks from Orval and adds application-specific
 * logic like query invalidation.
 */

import { useQueryClient } from '@tanstack/react-query';

import {
  useGetRelationships,
  usePostRelationships,
  useDeleteRelationshipsId,
} from '@/lib/api/generated/relationships/relationships';
import type {
  RelationshipListParams,
  CreateRelationshipPayload,
} from '@/lib/services/relationship.service';

/**
 * Centralized query keys for relationships.
 */
const relationshipKeys = {
  all: ['relationships'] as const,
  lists: () => [...relationshipKeys.all, 'list'] as const,
  list: (params: RelationshipListParams) =>
    [...relationshipKeys.lists(), params] as const,
};

/**
 * Hook to fetch a list of relationships.
 * @param params - The query parameters for fetching relationships.
 */
export const useRelationshipList = (
  params: RelationshipListParams,
  options?: any
) => {
  return useGetRelationships(params, {
    query: {
      queryKey: relationshipKeys.list(params),
      ...options,
    },
  });
};

/**
 * Hook to create a new relationship.
 * Invalidates the relationship list query on success.
 */
export const useCreateRelationship = () => {
  const queryClient = useQueryClient();
  return usePostRelationships({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });
      },
    },
  });
};

/**
 * Hook to delete a relationship.
 * Invalidates the relationship list query on success.
 */
export const useDeleteRelationship = () => {
  const queryClient = useQueryClient();
  return useDeleteRelationshipsId({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: relationshipKeys.lists() });
      },
    },
  });
};
