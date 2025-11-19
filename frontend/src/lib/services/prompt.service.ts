/**
 * @file Prompt Service
 * @description This service handles all prompt-related API calls,
 * following the layered data flow architecture.
 */

import type { ElementType } from "react";
import type {
  PromptsPromptResponse,
  PromptsCreatePromptRequest,
  PromptsUpdatePromptRequest,
  GetPromptsParams,
  PromptsPromptListResponse,
  ResponsePagination,
  PromptsImportResult,
} from "@/lib/api/generated/api10.schemas";
import { SnakeToCamelCase } from "@/types/type-utils";
import {
  getPrompts,
  postPrompts,
  getPromptsId,
  putPromptsId,
  deletePromptsId,
  postPromptsImport,
} from "@/lib/api/generated/prompts/prompts";

// =================================================================
// Re-exporting Core Prompt Types for Application-wide Use
// This service becomes the single source of truth for prompt-related types.
// =================================================================
export type Prompt = PromptsPromptResponse;
export type CreatePromptPayload = PromptsCreatePromptRequest;
export type UpdatePromptPayload = PromptsUpdatePromptRequest;
export type PromptsParams = GetPromptsParams;
export type PromptsList = PromptsPromptListResponse;
export type PromptForClient = SnakeToCamelCase<Prompt>;
export type PromptsListForClient = {
  items?: PromptForClient[];
  pagination?: ResponsePagination;
};
export type ImportResult = PromptsImportResult;
export type ImportResultForClient = SnakeToCamelCase<ImportResult>;

/**
 * Fetches a paginated list of prompts.
 * @param params - The query parameters for fetching prompts.
 * @returns A promise that resolves with the list of prompts and pagination info.
 */
export const getPromptsService = (params: PromptsParams) => {
  // The generated getPrompts function expects a body as the first argument.
  // Passing an empty object as a placeholder.
  return getPrompts({}, params);
};

/**
 * Creates a new prompt.
 * @param data - The data for the new prompt.
 * @returns A promise that resolves with the newly created prompt.
 */
export const createPromptService = (data: CreatePromptPayload) => {
  return postPrompts(data);
};

/**
 * Fetches a single prompt by its ID.
 * @param id - The ID of the prompt to fetch.
 * @returns A promise that resolves with the prompt data.
 */
export const getPromptByIdService = (id: number) => {
  return getPromptsId(id, {});
};

/**
 * Updates an existing prompt.
 * @param id - The ID of the prompt to update.
 * @param data - The new data for the prompt.
 * @returns A promise that resolves with the updated prompt data.
 */
export const updatePromptService = (id: number, data: UpdatePromptPayload) => {
  return putPromptsId(id, data);
};

/**
 * Deletes a prompt by its ID.
 * @param id - The ID of the prompt to delete.
 * @returns A promise that resolves when the prompt is deleted.
 */
export const deletePromptService = (id: number) => {
  // The generated deletePromptsId function expects a body as the second argument.
  // Passing an empty object as a placeholder.
  return deletePromptsId(id, {});
};

/**
 * Imports prompts from a file.
 * @param file - The file to import (.txt, .md, .json, .zip).
 * @returns A promise that resolves with the import result.
 */
export const importPromptsService = (file: File) => {
  // The generated client wraps the body in a "data" key in FormData.
  // We updated the backend to accept "data" key.
  return postPromptsImport(file);
};
