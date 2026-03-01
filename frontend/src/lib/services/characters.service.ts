/**
 * @file Character Service
 * @description This service handles all character-related API calls,
 * following the layered data flow architecture.
 */

import type {
  CharactersCharacterResponse,
  CharactersCreateCharacterRequest,
  CharactersUpdateCharacterRequest,
  GetCharactersParams,
  CharactersListCharactersResponse,
} from "@/lib/api/generated/api10.schemas";
import {
  getCharacters,
  postCharacters,
  getCharactersId,
  putCharactersId,
  deleteCharactersId,
} from "@/lib/api/generated/characters/characters";

// =================================================================
// Re-exporting Core Character Types for Application-wide Use
// This service becomes the single source of truth for character-related types.
// =================================================================
export type Character = CharactersCharacterResponse;
export type CreateCharacterPayload = CharactersCreateCharacterRequest;
export type UpdateCharacterPayload = CharactersUpdateCharacterRequest;
export type CharacterListParams = GetCharactersParams;
export type CharacterList = CharactersListCharactersResponse;

/**
 * Fetches a paginated list of characters.
 * @param params - The query parameters for fetching characters.
 * @returns A promise that resolves with the list of characters.
 */
export const getCharactersService = (params: CharacterListParams) => {
  return getCharacters(params);
};

/**
 * Creates a new character.
 * @param data - The data for the new character.
 * @returns A promise that resolves with the newly created character.
 */
export const createCharacterService = (data: CreateCharacterPayload) => {
  return postCharacters(data);
};

/**
 * Fetches a single character by its ID.
 * @param id - The ID of the character to fetch.
 * @returns A promise that resolves with the character data.
 */
export const getCharacterByIdService = (id: number) => {
  return getCharactersId(id);
};

/**
 * Updates an existing character.
 * @param id - The ID of the character to update.
 * @param data - The new data for the character.
 * @returns A promise that resolves with the updated character data.
 */
export const updateCharacterService = (
  id: number,
  data: UpdateCharacterPayload
) => {
  return putCharactersId(id, data);
};

/**
 * Deletes a character by its ID.
 * @param id - The ID of the character to delete.
 * @returns A promise that resolves when the character is deleted.
 */
export const deleteCharacterService = (id: number) => {
  return deleteCharactersId(id);
};
