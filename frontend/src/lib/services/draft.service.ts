/**
 * @file Draft Service
 * @description This service handles all draft-related API calls,
 * following the layered data flow architecture.
 */

import type {
  DraftsDraftResponse,
  DraftsCreateDraftRequest,
  DraftsUpdateDraftRequest,
  GetDraftsParams,
  DraftsListDraftsResponse,
} from "@/lib/api/generated/api10.schemas";
import {
  getDrafts as apiGetDrafts,
  postDrafts as apiCreateDraft,
  getDraftsId as apiGetDraftById,
  putDraftsId as apiUpdateDraft,
  deleteDraftsId as apiDeleteDraft,
  postDraftsIdPublish as apiPublishDraft,
} from "@/lib/api/generated/drafts/drafts";

// transform snake_case to camelCase
import { SnakeToCamelCase } from "@/types/type-utils";

// =================================================================
// Re-exporting Core Draft Types for Application-wide Use
// This service becomes the single source of truth for draft-related types.
// =================================================================
export type Draft = DraftsDraftResponse;
export type CreateDraftPayload = DraftsCreateDraftRequest;
export type UpdateDraftPayload = DraftsUpdateDraftRequest;
export type DraftsParams = GetDraftsParams;
export type DraftListResponse = DraftsListDraftsResponse;
// A client-facing Draft type with camelCase properties for better DX in the frontend.
export type DraftForClient = SnakeToCamelCase<Draft>;

/**
 * A client-facing version of the DraftListResponse, where the `data` array
 * consists of `DraftForClient` objects.
 */
export type DraftListResponseForClient = Omit<DraftListResponse, "data"> & {
  data?: DraftForClient[];
};

// Client-facing payload types
export type CreateDraftPayloadForClient = SnakeToCamelCase<CreateDraftPayload>;
export type UpdateDraftPayloadForClient = SnakeToCamelCase<UpdateDraftPayload>;

/**
 * Fetches a paginated list of drafts for a specific work.
 * @param params - The query parameters for fetching drafts, including work_id.
 * @returns A promise that resolves with the list of drafts and pagination info.
 */
export const getDraftsService = (params: DraftsParams) => {
  return apiGetDrafts(params);
};

/**
 * Creates a new draft.
 * @param data - The data for the new draft.
 * @returns A promise that resolves with the newly created draft.
 */
export const createDraftService = (data: CreateDraftPayload) => {
  return apiCreateDraft(data);
};

/**
 * Fetches a single draft by its ID.
 * @param id - The ID of the draft to fetch.
 * @returns A promise that resolves with the draft data.
 */
export const getDraftByIdService = (id: number) => {
  return apiGetDraftById(id);
};

/**
 * Updates an existing draft.
 * @param id - The ID of the draft to update.
 * @param data - The new data for the draft.
 * @returns A promise that resolves with the updated draft data.
 */
export const updateDraftService = (id: number, data: UpdateDraftPayload) => {
  return apiUpdateDraft(id, data);
};

/**
 * Deletes a draft by its ID.
 * @param id - The ID of the draft to delete.
 * @returns A promise that resolves when the draft is deleted.
 */
export const deleteDraftService = (id: number) => {
  return apiDeleteDraft(id);
};

/**
 * Publishes a draft as a new chapter.
 * @param id - The ID of the draft to publish.
 * @returns A promise that resolves with the newly created chapter.
 */
export const publishDraftService = (id: number) => {
  return apiPublishDraft(id);
};
