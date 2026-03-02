/**
 * @file useFavorites Hook
 * @description A generic hook for managing favorites of any resource type.
 * Provides functions to add, remove, and check favorites with optimistic updates.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import {
  useGetFavorites,
  usePostFavorites,
  useDeleteFavoritesTypeId,
  getGetFavoritesQueryKey,
  type ResourceType,
} from "@/lib/services/favorite.service";
import { toCamelCase } from "@/lib/utils";

/**
 * A generic hook for managing favorites of any resource type.
 * @param resourceType - The type of resource (e.g., "prompt", "snippet")
 * @returns An object containing favorites data and mutation functions
 */
export function useFavorites(resourceType: ResourceType): {
  favoriteIds: number[];
  isLoading: boolean;
  error: unknown;
  isError: boolean;
  isFavorite: (resourceId: number) => boolean;
  addFavorite: (resourceId: number) => Promise<unknown>;
  removeFavorite: (resourceId: number) => Promise<unknown>;
  toggleFavorite: (resourceId: number) => Promise<void>;
  isAdding: boolean;
  isRemoving: boolean;
  isAvailable: boolean;
} {
  const queryClient = useQueryClient();

  // Query for favorite IDs
  // 使用 retry: false 和 throwOnError: false 避免阻塞主功能
  const {
    data: rawData,
    isLoading,
    error,
    isError,
  } = useGetFavorites(
    { type: resourceType },
    {
      query: {
        retry: false, // 不重试，避免长时间等待
        throwOnError: false, // 不抛出错误，允许优雅降级
        staleTime: 5 * 60 * 1000, // 5分钟缓存
      },
    }
  );

  const favoritesQueryKey = getGetFavoritesQueryKey({ type: resourceType });

  // NOTE:
  // customFetch 会把后端的 StandardResponse 自动解包为 data 字段
  // 因此这里的 rawData 不是 { data: ... }，而是 data 本身（FavoriteIDsResponse）
  const favoriteIds = useMemo(() => {
    if (isError || !rawData) return [];
    const data = toCamelCase(rawData) as { resourceIds?: number[] };
    return data.resourceIds || [];
  }, [rawData, isError]);

  // Add favorite mutation (带乐观更新)
  const addFavoriteMutation = usePostFavorites({
    mutation: {
      onMutate: async (variables) => {
        const resourceId = variables.data.resource_id;

        await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
        const previous = queryClient.getQueryData(favoritesQueryKey);

        queryClient.setQueryData(favoritesQueryKey, (old: unknown) => {
          const oldData = toCamelCase(old ?? {}) as {
            resourceType?: string;
            resourceIds?: number[];
          };
          const nextIds = Array.from(
            new Set([...(oldData.resourceIds ?? []), resourceId])
          );
          return {
            resourceType,
            resourceIds: nextIds,
          };
        });

        return { previous };
      },
      onError: (_err, _variables, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(favoritesQueryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      },
    },
  });

  // Remove favorite mutation (带乐观更新)
  const removeFavoriteMutation = useDeleteFavoritesTypeId({
    mutation: {
      onMutate: async (variables) => {
        const resourceId = variables.id;

        await queryClient.cancelQueries({ queryKey: favoritesQueryKey });
        const previous = queryClient.getQueryData(favoritesQueryKey);

        queryClient.setQueryData(favoritesQueryKey, (old: unknown) => {
          const oldData = toCamelCase(old ?? {}) as {
            resourceType?: string;
            resourceIds?: number[];
          };
          const nextIds = (oldData.resourceIds ?? []).filter((id) => id !== resourceId);
          return {
            resourceType,
            resourceIds: nextIds,
          };
        });

        return { previous };
      },
      onError: (_err, _variables, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(favoritesQueryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: favoritesQueryKey });
      },
    },
  });

  // Check if a resource is favorited (local lookup, no API call)
  const isFavorite = useCallback(
    (resourceId: number) => favoriteIds.includes(resourceId),
    [favoriteIds]
  );

  // Add a resource to favorites
  const addFavorite = useCallback(
    (resourceId: number) => {
      return addFavoriteMutation.mutateAsync({
        data: {
          resource_type: resourceType,
          resource_id: resourceId,
        },
      });
    },
    [addFavoriteMutation, resourceType]
  );

  // Remove a resource from favorites
  const removeFavorite = useCallback(
    (resourceId: number) => {
      return removeFavoriteMutation.mutateAsync({
        type: resourceType,
        id: resourceId,
      });
    },
    [removeFavoriteMutation, resourceType]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    async (resourceId: number) => {
      if (isFavorite(resourceId)) {
        await removeFavorite(resourceId);
      } else {
        await addFavorite(resourceId);
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  return {
    // Data
    favoriteIds,
    isLoading,
    error,
    isError, // 暴露错误状态，让调用者知道收藏功能是否可用

    // Functions
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,

    // Mutation states
    isAdding: addFavoriteMutation.isPending,
    isRemoving: removeFavoriteMutation.isPending,
    // 收藏功能是否可用（API 正常时为 true）
    isAvailable: !isError,
  };
}

export default useFavorites;
