import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";

import {
  getCharactersService,
  getCharacterByIdService,
  createCharacterService,
  updateCharacterService,
  deleteCharacterService,
  // TODO: Backend does not support filtering characters by work_id yet.
  // getCharactersByWorkId,
} from "@/lib/services/characters.service";
import type {
  CreateCharacterPayload,
  UpdateCharacterPayload,
  CharacterListParams,
} from "@/lib/services/characters.service";

/**
 * @file Character Hooks
 * @description This file contains TanStack Query hooks for character-related operations.
 * It uses the auto-generated hooks from Orval and adds application-specific
 * logic like query invalidation.
 */
const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  list: (params: CharacterListParams) =>
    [...characterKeys.lists(), params] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: number) => [...characterKeys.details(), id] as const,
};

/**
 * Hook to fetch characters, optionally filtered by workId.
 * @param {number} [workId] - The ID of the work to filter characters by.
 * @returns A query object for the character list.
 * @todo Backend does not currently support filtering characters by `work_id`.
 * This hook currently fetches all characters and should be updated when the backend API is ready.
 */
export function useCharacters(workId?: number) {
  return useQuery({
    queryKey: characterKeys.list({ work_id: workId } as CharacterListParams),
    queryFn: () =>
      // TODO: Replace with `getCharactersService({ work_id: workId })` when backend supports it.
      getCharactersService({}),
    enabled: typeof workId === "number" && workId > 0,
  });
}

/**
 * Hook to fetch a paginated list of all characters.
 * @param {CharacterListParams} params - The query parameters for fetching characters.
 * @returns A query object for the character list.
 */
export const useCharacterList = (params: CharacterListParams) => {
  return useQuery({
    queryKey: characterKeys.list(params),
    queryFn: () => getCharactersService(params),
  });
};

/**
 * Hook to fetch a single character by its ID.
 * @param {number} id - The ID of the character to fetch.
 * @returns A query object for the character details.
 */
export function useCharacter(id: number) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: () => getCharacterByIdService(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new character.
 * Invalidates the character list query on success.
 * @returns A mutation object for creating a character.
 */
export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (characterData: CreateCharacterPayload) =>
      createCharacterService(characterData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing character.
 * Invalidates both the character list and the specific character detail query on success.
 * @returns A mutation object for updating a character.
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCharacterPayload }) =>
      updateCharacterService(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: characterKeys.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to delete a character.
 * Invalidates the character list query on success.
 * @returns A mutation object for deleting a character.
 */
export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCharacterService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

// This is what useLookup expects
export const useCharacterLookup = () => {
  return {
    // TODO: Backend does not support filtering characters by work_id yet.
    // getCharactersByWorkId,
  };
};
