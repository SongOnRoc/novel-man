/**
 * @file Chapter Service
 * @description This service handles all chapter-related API calls,
 * following the layered data flow architecture.
 */

import type {
  ChaptersChapterResponse,
  ChaptersCreateChapterRequest,
  ChaptersUpdateChapterRequest,
  GetChaptersParams,
  ChaptersListChaptersResponse,
} from '@/lib/api/generated/api10.schemas';
import {
  getChapters,
  postChapters,
  getChaptersId,
  putChaptersId,
  deleteChaptersId,
} from '@/lib/api/generated/chapters/chapters';

// transform snake_case to camelCase
import { SnakeToCamelCase } from "@/types/type-utils";

// =================================================================
// Re-exporting Core Chapter Types for Application-wide Use
// This service becomes the single source of truth for chapter-related types.
// =================================================================
export type Chapter = ChaptersChapterResponse;
export type CreateChapterPayload = ChaptersCreateChapterRequest;
export type UpdateChapterPayload = ChaptersUpdateChapterRequest;
export type ChapterListParams = GetChaptersParams;
export type ChapterListResponse = ChaptersListChaptersResponse;
// A client-facing Chapter type with camelCase properties for better DX in the frontend.
export type ChapterForClient = SnakeToCamelCase<Chapter>;

/**
 * A client-facing version of the ChapterListResponse, where the `data` array
 * consists of `ChapterForClient` objects.
 */
export type ChapterListResponseForClient = Omit<ChapterListResponse, "data"> & {
  data?: ChapterForClient[];
};

// Client-facing payload types
export type CreateChapterPayloadForClient =
  SnakeToCamelCase<CreateChapterPayload>;
export type UpdateChapterPayloadForClient =
  SnakeToCamelCase<UpdateChapterPayload>;

/**
 * Fetches a paginated list of chapters for a specific work.
 * @param params - The query parameters for fetching chapters, including work_id.
 * @returns A promise that resolves with the list of chapters and pagination info.
 */
export const getChaptersService = (params: ChapterListParams) => {
  return getChapters(params);
};

/**
 * Creates a new chapter.
 * @param data - The data for the new chapter.
 * @returns A promise that resolves with the newly created chapter.
 */
export const createChapterService = (data: CreateChapterPayload) => {
  return postChapters(data);
};

/**
 * Fetches a single chapter by its ID.
 * @param id - The ID of the chapter to fetch.
 * @returns A promise that resolves with the chapter data.
 */
export const getChapterByIdService = (id: number) => {
  return getChaptersId(id);
};

/**
 * Updates an existing chapter.
 * @param id - The ID of the chapter to update.
 * @param data - The new data for the chapter.
 * @returns A promise that resolves with the updated chapter data.
 */
export const updateChapterService = (id: number, data: UpdateChapterPayload) => {
  return putChaptersId(id, data);
};

/**
 * Deletes a chapter by its ID.
 * @param id - The ID of the chapter to delete.
 * @returns A promise that resolves when the chapter is deleted.
 */
export const deleteChapterService = (id: number) => {
  return deleteChaptersId(id);
};
