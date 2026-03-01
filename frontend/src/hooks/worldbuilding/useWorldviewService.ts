/**
 * @file Worldview Hooks
 * @description This file contains TanStack Query hooks for worldview-related operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getCategoriesService,
  createCategoryService,
  updateCategoryService,
  deleteCategoryService,
  getItemsService,
  createItemService,
  getItemByIdService,
  updateItemService,
  deleteItemService,
} from "@/lib/services/worldview.service";
import type {
  CreateWorldviewCategoryPayload,
  UpdateWorldviewCategoryPayload,
  WorldCategoriesParams,
  CreateWorldviewItemPayload,
  UpdateWorldviewItemPayload,
  WorldItemsParams,
} from "@/lib/services/worldview.service";

const worldviewKeys = {
  all: ["worldview"] as const,
  categories: () => [...worldviewKeys.all, "categories"] as const,
  category: (params: WorldCategoriesParams) =>
    [...worldviewKeys.categories(), params] as const,
  items: () => [...worldviewKeys.all, "items"] as const,
  item: (params: WorldItemsParams) =>
    [...worldviewKeys.items(), params] as const,
  itemDetail: (id: number) => [...worldviewKeys.items(), "detail", id] as const,
};

/**
 * Hook to fetch a paginated list of worldview categories.
 * @param params - The query parameters for fetching categories.
 */
export const useWorldviewCategories = (params: WorldCategoriesParams) => {
  return useQuery({
    queryKey: worldviewKeys.category(params),
    queryFn: () => getCategoriesService(params),
  });
};

/**
 * Hook to create a new worldview category.
 * Invalidates the category list query on success.
 */
export const useCreateWorldviewCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorldviewCategoryPayload) =>
      createCategoryService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.categories() });
    },
  });
};

/**
 * Hook to update an existing worldview category.
 * Invalidates the category list query on success.
 */
export const useUpdateWorldviewCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateWorldviewCategoryPayload;
    }) => updateCategoryService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.categories() });
    },
  });
};

/**
 * Hook to delete a worldview category.
 * Invalidates the category list query on success.
 */
export const useDeleteWorldviewCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCategoryService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.categories() });
    },
  });
};

/**
 * Hook to fetch a paginated list of worldview items.
 * @param params - The query parameters for fetching items.
 */
export const useWorldviewItems = (params: WorldItemsParams) => {
  return useQuery({
    queryKey: worldviewKeys.item(params),
    queryFn: () => getItemsService(params),
  });
};

/**
 * Hook to fetch a single worldview item by its ID.
 * @param id - The ID of the item to fetch.
 */
export const useWorldviewItem = (id: number) => {
  return useQuery({
    queryKey: worldviewKeys.itemDetail(id),
    queryFn: () => getItemByIdService(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new worldview item.
 * Invalidates the item list query on success.
 */
export const useCreateWorldviewItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorldviewItemPayload) => createItemService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.items() });
    },
  });
};

/**
 * Hook to update an existing worldview item.
 * Invalidates both the item list and the specific item detail query on success.
 */
export const useUpdateWorldviewItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateWorldviewItemPayload;
    }) => updateItemService(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.items() });
      queryClient.invalidateQueries({
        queryKey: worldviewKeys.itemDetail(variables.id),
      });
    },
  });
};

/**
 * Hook to delete a worldview item.
 * Invalidates the item list query on success.
 */
export const useDeleteWorldviewItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteItemService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: worldviewKeys.items() });
    },
  });
};
