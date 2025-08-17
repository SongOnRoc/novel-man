/**
 * @file Relationship Service
 * @description This service handles all relationship-related API calls.
 */

import {
  getRelationships,
  postRelationships,
  deleteRelationshipsId,
} from "@/lib/api/generated/relationships/relationships";
import type {
  RelationshipsRelationshipResponse,
  RelationshipsRelationshipRequest,
  GetRelationshipsParams,
  RelationshipsListRelationshipsResponse,
} from "@/lib/api/generated/api10.schemas";

// =================================================================
// Re-exporting Core Relationship Types for Application-wide Use
// =================================================================
export type Relationship = RelationshipsRelationshipResponse;
export type CreateRelationshipPayload = RelationshipsRelationshipRequest;
export type RelationshipListParams = GetRelationshipsParams;
export type RelationshipListResponse = RelationshipsListRelationshipsResponse;

/**
 * Fetches a list of relationships.
 * @param params - The query parameters for fetching relationships.
 * @returns A promise that resolves with the list of relationships.
 */
export const getRelationshipsService = (params: RelationshipListParams) => {
  return getRelationships(params);
};

/**
 * Creates a new relationship.
 * @param data - The data for the new relationship.
 * @returns A promise that resolves with the newly created relationship.
 */
export const createRelationshipService = (data: CreateRelationshipPayload) => {
  return postRelationships(data);
};

/**
 * Deletes a relationship by its ID.
 * @param id - The ID of the relationship to delete.
 * @returns A promise that resolves when the relationship is deleted.
 */
export const deleteRelationshipService = (id: number) => {
  return deleteRelationshipsId(id);
};
