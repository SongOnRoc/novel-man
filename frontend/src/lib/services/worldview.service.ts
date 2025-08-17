/**
 * @file Worldview Service
 * @description This service handles all worldview-related API calls.
 */

import {
  getWorldviewCategories,
  postWorldviewCategories,
  putWorldviewCategoriesId,
  deleteWorldviewCategoriesId,
  getWorldviewItems,
  postWorldviewItems,
  getWorldviewItemsId,
  putWorldviewItemsId,
  deleteWorldviewItemsId,
} from '@/lib/api/generated/worldview/worldview';
import type {
  WorldviewCategoryResponse,
  WorldviewCreateCategoryRequest,
  WorldviewUpdateCategoryRequest,
  GetWorldviewCategoriesParams,
  WorldviewItemResponse,
  WorldviewCreateItemRequest,
  WorldviewUpdateItemRequest,
  GetWorldviewItemsParams,
  WorldviewListCategoriesResponse,
  WorldviewListItemsResponse,
} from '@/lib/api/generated/api10.schemas';

// =================================================================
// Re-exporting Core Worldview Types for Application-wide Use
// =================================================================
export type WorldviewCategory = WorldviewCategoryResponse;
export type CreateWorldviewCategoryPayload = WorldviewCreateCategoryRequest;
export type UpdateWorldviewCategoryPayload = WorldviewUpdateCategoryRequest;
export type WorldCategoriesParams = GetWorldviewCategoriesParams;
export type WorldviewCategoryList = WorldviewListCategoriesResponse;

export type WorldviewItem = WorldviewItemResponse;
export type CreateWorldviewItemPayload = WorldviewCreateItemRequest;
export type UpdateWorldviewItemPayload = WorldviewUpdateItemRequest;
export type WorldItemsParams = GetWorldviewItemsParams;
export type WorldviewItemList = WorldviewListItemsResponse;

/**
 * Fetches a paginated list of worldview categories.
 * @param params - The query parameters for fetching categories.
 * @returns A promise that resolves with the list of categories.
 */
export const getCategoriesService = (params: WorldCategoriesParams) => {
  return getWorldviewCategories(params);
};

/**
 * Creates a new worldview category.
 * @param data - The data for the new category.
 * @returns A promise that resolves with the newly created category.
 */
export const createCategoryService = (data: CreateWorldviewCategoryPayload) => {
  return postWorldviewCategories(data);
};

/**
 * Updates an existing worldview category.
 * @param id - The ID of the category to update.
 * @param data - The new data for the category.
 * @returns A promise that resolves with the updated category data.
 */
export const updateCategoryService = (
  id: number,
  data: UpdateWorldviewCategoryPayload
) => {
  return putWorldviewCategoriesId(id, data);
};

/**
 * Deletes a worldview category by its ID.
 * @param id - The ID of the category to delete.
 * @returns A promise that resolves when the category is deleted.
 */
export const deleteCategoryService = (id: number) => {
  return deleteWorldviewCategoriesId(id);
};

/**
 * Fetches a paginated list of worldview items.
 * @param params - The query parameters for fetching items.
 * @returns A promise that resolves with the list of items.
 */
export const getItemsService = (params: WorldItemsParams) => {
  return getWorldviewItems(params);
};

/**
 * Creates a new worldview item.
 * @param data - The data for the new item.
 * @returns A promise that resolves with the newly created item.
 */
export const createItemService = (data: CreateWorldviewItemPayload) => {
  return postWorldviewItems(data);
};

/**
 * Fetches a single worldview item by its ID.
 * @param id - The ID of the item to fetch.
 * @returns A promise that resolves with the item data.
 */
export const getItemByIdService = (id: number) => {
  return getWorldviewItemsId(id);
};

/**
 * Updates an existing worldview item.
 * @param id - The ID of the item to update.
 * @param data - The new data for the item.
 * @returns A promise that resolves with the updated item data.
 */
export const updateItemService = (
  id: number,
  data: UpdateWorldviewItemPayload
) => {
  return putWorldviewItemsId(id, data);
};

/**
 * Deletes a worldview item by its ID.
 * @param id - The ID of the item to delete.
 * @returns A promise that resolves when the item is deleted.
 */
export const deleteItemService = (id: number) => {
  return deleteWorldviewItemsId(id);
};
