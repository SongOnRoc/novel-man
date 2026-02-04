/**
 * @file useFavorites Hook
 * @description A generic hook for managing favorites of any resource type.
 * Provides functions to add, remove, and check favorites with optimistic updates.
 */

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
export function useFavorites(resourceType: ResourceType) {
  const queryClient = useQueryClient();

    // Query for favorite IDs
    //使用 retry: false 和 throwOnError: false 避免阻塞主功能
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

  // Transform the response to camelCase
  // 如果API失败，返回空数组，允许主功能继续工作
  const favoriteIds = useMemo(() => {
    if (isError || !rawData?.data) return [];
    const data = toCamelCase(rawData.data) as { resourceIds?: number[] };
    return data.resourceIds || [];
  }, [rawData, isError]);

  // Add favorite mutation
  const addFavoriteMutation = usePostFavorites({
    mutation: {
      onSuccess: () => {
        // Invalidate the favorites query to refresh the list
        queryClient.invalidateQueries({
          queryKey: getGetFavoritesQueryKey({ type: resourceType }),
        });
      },
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useDeleteFavoritesTypeId({
    mutation: {
      onSuccess: () => {
        // Invalidate the favorites query to refresh the list
        queryClient.invalidateQueries({
          queryKey: getGetFavoritesQueryKey({ type: resourceType }),
        });
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
