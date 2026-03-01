/**
 * @file Favorite Service
 * @description This service handles all favorite-related API calls,
 * following the layered data flow architecture.
 */

import type {
  FavoritesAddFavoriteRequest,
  FavoritesFavoriteIDsResponse,
  FavoritesIsFavoriteResponse,
  GetFavoritesParams,
} from "@/lib/api/generated/api10.schemas";
import { SnakeToCamelCase } from "@/types/type-utils";
import {
  getFavorites,
  postFavorites,
  deleteFavoritesTypeId,
  getFavoritesTypeId,
  useGetFavorites,
  usePostFavorites,
  useDeleteFavoritesTypeId,
  getGetFavoritesQueryKey,
} from "@/lib/api/generated/favorites/favorites";

// =================================================================
// Re-exporting Generated Hooks for Application-wide Use
// =================================================================
export {
  useGetFavorites,
  usePostFavorites,
  useDeleteFavoritesTypeId,
  getGetFavoritesQueryKey,
};

// =================================================================
// Re-exporting Core Favorite Types for Application-wide Use
// =================================================================
export type AddFavoritePayload = FavoritesAddFavoriteRequest;
export type FavoriteIDsResponse = FavoritesFavoriteIDsResponse;
export type IsFavoriteResponse = FavoritesIsFavoriteResponse;
export type FavoritesParams = GetFavoritesParams;
export type FavoriteIDsForClient = SnakeToCamelCase<FavoriteIDsResponse>;
export type IsFavoriteForClient = SnakeToCamelCase<IsFavoriteResponse>;

/**
 * Resource types that can be favorited
 */
export type ResourceType = "prompt" | "snippet" | "sentence";

/**
 * Fetches the list of favorite resource IDs for a given resource type.
 * @param resourceType - The type of resource (e.g., "prompt", "snippet")
 * @returns A promise that resolves with the list of favorite resource IDs
 */
export const getFavoritesService = (resourceType: ResourceType) => {
  return getFavorites({ type: resourceType });
};

/**
 * Adds a resource to the user's favorites.
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource to favorite
 * @returns A promise that resolves when the favorite is added
 */
export const addFavoriteService = (payload: AddFavoritePayload) => {
  return postFavorites(payload);
};

/**
 * Removes a resource from the user's favorites.
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource to unfavorite
 * @returns A promise that resolves when the favorite is removed
 */
export const removeFavoriteService = (
  resourceType: ResourceType,
  resourceId: number
) => {
  return deleteFavoritesTypeId(resourceType, resourceId);
};

/**
 * Checks if a specific resource is in the user's favorites.
 * @param resourceType - The type of resource
 * @param resourceId - The ID of the resource to check
 * @returns A promise that resolves with whether the resource is favorited
 */
export const checkFavoriteService = (
  resourceType: ResourceType,
  resourceId: number
) => {
  return getFavoritesTypeId(resourceType, resourceId);
};