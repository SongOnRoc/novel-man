import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getCharacters,
  getCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getCharactersByWorkId,
} from "@/lib/services/characters.service";
import type {
  CharacterCreate,
  CharacterUpdate,
  CharacterListParams,
} from "@/lib/services/characters.service";

const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  list: (params: CharacterListParams) => [...characterKeys.lists(), params] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: number) => [...characterKeys.details(), id] as const,
};

export function useCharacters(workId?: number) {
  return useQuery({
    queryKey: characterKeys.list({ workId } as CharacterListParams),
    queryFn: () => (workId ? getCharactersByWorkId(workId) : getCharacters()),
    enabled: !!workId,
  });
}

export const useCharacterList = (params: CharacterListParams) => {
  return useQuery({
    queryKey: characterKeys.list(params),
    queryFn: () => getCharacters(params),
  });
};

export function useCharacter(id: number) {
  return useQuery({
    queryKey: characterKeys.detail(id),
    queryFn: () => getCharacter(id),
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (characterData: CharacterCreate) =>
      createCharacter(characterData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CharacterUpdate }) =>
      updateCharacter(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: characterKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
    },
  });
}

// This is what useLookup expects
export const useCharacterLookup = () => {
  return {
    getCharactersByWorkId,
  };
};
