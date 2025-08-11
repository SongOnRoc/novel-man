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
} from "@/lib/api/characters";
import { CharacterUpdate, CharacterCreate } from "@/types/character";

const characterKeys = {
  all: ["characters"] as const,
  lists: () => [...characterKeys.all, "list"] as const,
  list: (filters: any) => [...characterKeys.lists(), filters] as const,
  details: () => [...characterKeys.all, "detail"] as const,
  detail: (id: number) => [...characterKeys.details(), id] as const,
};

export function useCharacters(workId?: number) {
  return useQuery({
    queryKey: characterKeys.list({ workId }),
    queryFn: () => (workId ? getCharactersByWorkId(workId) : getCharacters()),
    enabled: !!workId,
  });
}

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: characterKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: characterKeys.detail(data.id),
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
