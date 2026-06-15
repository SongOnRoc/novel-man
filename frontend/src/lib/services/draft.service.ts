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
  ContractsImportResult,
} from "@/lib/api/generated/api10.schemas";
import {
  getDrafts as apiGetDrafts,
  postDrafts as apiCreateDraft,
  getDraftsId as apiGetDraftById,
  putDraftsId as apiUpdateDraft,
  deleteDraftsId as apiDeleteDraft,
  postDraftsIdPublish as apiPublishDraft,
  postDraftsImport,
  postDraftsBatchPublish,
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

/**
 * 批量导入/批量发布的结果结构（后端 contracts.ImportResult）。
 * 注意：`customFetch` 在运行时已解包响应信封，返回的即该结构本体。
 */
export type DraftBatchResult = ContractsImportResult;

/**
 * 将文件批量导入为「作品草稿」（方案 A：导入只生成草稿，不直接生成章节）。
 * 调用由 swag/orval 生成的 `postDraftsImport`，与项目代码生成工作流保持一致。
 * @param workId - 目标作品 ID。
 * @param file - 待导入文件（.txt/.md/.json/.zip）。
 */
export const importDraftsService = (workId: number, file: File) => {
  return postDraftsImport(
    { file },
    { work_id: workId },
  ) as unknown as Promise<DraftBatchResult>;
};

/**
 * 批量发布草稿为章节（部分成功语义，逐篇发布）。
 * 调用生成的 `postDraftsBatchPublish`。
 * @param draftIds - 待发布的草稿 ID 列表。
 */
export const batchPublishDraftsService = (draftIds: number[]) => {
  return postDraftsBatchPublish({
    draft_ids: draftIds,
  }) as unknown as Promise<DraftBatchResult>;
};
