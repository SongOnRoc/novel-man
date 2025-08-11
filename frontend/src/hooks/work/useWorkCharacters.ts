import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { worksApi } from "@/lib/api/works";
import { Character } from "@/types/character";

export function useWorkCharacters(workId: number) {
  const queryClient = useQueryClient();

  // 获取关联角色
  const {
    data: characters,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["works", workId, "characters"],
    queryFn: () => worksApi.getAssociatedCharacters(workId),
  });

  // 关联角色
  const associateCharacters = useMutation({
    mutationFn: (characterIds: number[]) =>
      worksApi.associateCharacters(workId, characterIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["works", workId, "characters"],
      });
    },
  });

  // 解关联角色
  const dissociateCharacter = useMutation({
    mutationFn: (characterId: number) =>
      worksApi.dissociateCharacter(workId, characterId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["works", workId, "characters"],
      });
    },
  });

  return {
    characters: characters || [],
    isLoading,
    error,
    associateCharacters,
    dissociateCharacter,
  };
}
