import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import React from "react";

import { LookupSource } from "@/components/common/SettingsLookup";
import { getCharactersService } from "@/lib/services/characters.service";
import {
  Character,
  CharacterList,
} from "@/lib/services/characters.service";

import { CharacterCard } from "./components/CharacterCard";

/**
 * Custom hook to fetch and filter character data for the lookup component.
 * @param {object} params - The parameters for the hook.
 * @param {string} params.workId - The ID of the work to which the characters belong.
 * @param {string} params.searchTerm - The term to filter characters by name.
 * @returns {{ data: Character[], isLoading: boolean }} - The filtered character data and loading state.
 */
const useCharacterData = ({
  workId,
  searchTerm,
}: {
  workId: string;
  searchTerm: string;
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["characters", workId],
    // TODO: Backend does not support filtering characters by work_id yet.
    // Replace with `getCharactersService({ work_id: Number(workId) })` when available.
    queryFn: () => getCharactersService({}),
    enabled: !!workId,
  });

  const items = (data?.data as CharacterList)?.data || [];
  const filteredData =
    items.filter((character: Character) =>
      character.name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return { data: filteredData, isLoading };
};

export const characterLookupSource: LookupSource<Character> = {
  name: "角色",
  icon: <Users className="h-4 w-4" />,
  useData: useCharacterData,
  renderItem: ({ item, onSelect }) => (
    <CharacterCard character={item} onSelect={onSelect} />
  ),
};
