import { useState, useCallback } from "react";
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { Character } from "@/types/character";
import { WorldItem } from "@/types/worldbuilding";

export function useLookup() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [originalCharacters, setOriginalCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [originalWorldItems, setOriginalWorldItems] = useState<WorldItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { getCharactersByWorkId } = useCharacters();
  const { getWorldItemsByWorkId } = useWorldbuilding();

  const loadSettings = useCallback(
    async (workId: string) => {
      setIsLoading(true);
      try {
        const [charData, worldData] = await Promise.all([
          getCharactersByWorkId(workId),
          getWorldItemsByWorkId(workId),
        ]);
        setCharacters(charData);
        setOriginalCharacters(charData);
        setWorldItems(worldData);
        setOriginalWorldItems(worldData);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [getCharactersByWorkId, getWorldItemsByWorkId]
  );

  const searchSettings = useCallback(
    (query: string) => {
      setIsLoading(true);
      if (!query) {
        setCharacters(originalCharacters);
        setWorldItems(originalWorldItems);
      } else {
        const lowercasedQuery = query.toLowerCase();
        const filteredChars = originalCharacters.filter((c) =>
          c.name.toLowerCase().includes(lowercasedQuery)
        );
        const filteredWorldItems = originalWorldItems.filter((w) =>
          w.name.toLowerCase().includes(lowercasedQuery)
        );
        setCharacters(filteredChars);
        setWorldItems(filteredWorldItems);
      }
      setIsLoading(false);
    },
    [originalCharacters, originalWorldItems]
  );

  return { characters, worldItems, isLoading, loadSettings, searchSettings };
}
