/**
 * @file Work Service
 * @description This service handles all work-related API calls,
 * following the layered data flow architecture.
 */

import type {
  WorksWorkResponse,
  WorksCreateWorkRequest,
  WorksUpdateWorkRequest,
  GetWorksParams,
  WorksListWorksResponse,
  ResponsePagination,
} from "@/lib/api/generated/api10.schemas";
import { SnakeToCamelCase } from "@/types/type-utils";
import {
  getWorks,
  postWorks,
  getWorksId,
  putWorksId,
  deleteWorksId,
} from "@/lib/api/generated/works/works";

// =================================================================
// Re-exporting Core Work Types for Application-wide Use
// This service becomes the single source of truth for work-related types.
// =================================================================
export type Work = WorksWorkResponse;
export type CreateWorkPayload = WorksCreateWorkRequest;
export type UpdateWorkPayload = WorksUpdateWorkRequest;
export type WorksParams = GetWorksParams;
export type WorksList = WorksListWorksResponse;
export type WorkForClient = SnakeToCamelCase<Work>;
export type WorksListForClient = {
  data?: WorkForClient[];
  pagination?: ResponsePagination;
};

/**
 * Fetches a paginated list of works.
 * @param params - The query parameters for fetching works.
 * @returns A promise that resolves with the list of works and pagination info.
 */
export const getWorksService = (params: WorksParams) => {
  return getWorks(params);
};

/**
 * Creates a new work.
 * @param data - The data for the new work.
 * @returns A promise that resolves with the newly created work.
 */
export const createWorkService = (data: CreateWorkPayload) => {
  return postWorks(data);
};

/**
 * Fetches a single work by its ID.
 * @param id - The ID of the work to fetch.
 * @returns A promise that resolves with the work data.
 */
export const getWorkByIdService = (id: number) => {
  return getWorksId(id);
};

/**
 * Updates an existing work.
 * @param id - The ID of the work to update.
 * @param data - The new data for the work.
 * @returns A promise that resolves with the updated work data.
 */
export const updateWorkService = (id: number, data: UpdateWorkPayload) => {
  return putWorksId(id, data);
};

/**
 * Deletes a work by its ID.
 * @param id - The ID of the work to delete.
 * @returns A promise that resolves when the work is deleted.
 */
export const deleteWorkService = (id: number) => {
  return deleteWorksId(id);
};
