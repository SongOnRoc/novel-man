import { useState, useCallback } from "react";
import { useCharacterLookup } from "@/hooks/character/useCharacters";
import { useWorldviewLookup } from "@/hooks/worldbuilding/useWorldview";
import { Character, WorldviewItem } from "@/types/core";

export function useLookup() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [originalCharacters, setOriginalCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldviewItem[]>([]);
  const [originalWorldItems, setOriginalWorldItems] = useState<WorldviewItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);

  const { getCharactersByWorkId } = useCharacterLookup();
  const { getWorldItemsByWorkId } = useWorldviewLookup();

  const loadSettings = useCallback(
    async (workId: string) => {
      setIsLoading(true);
      try {
        const [charData, worldData] = await Promise.all([
          getCharactersByWorkId(parseInt(workId, 10)),
          getWorldItemsByWorkId(parseInt(workId, 10)),
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
    [getCharactersByWorkId, getWorldItemsByWorkId],
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
          c.name.toLowerCase().includes(lowercasedQuery),
        );
        const filteredWorldItems = originalWorldItems.filter((w) =>
          w.name.toLowerCase().includes(lowercasedQuery),
        );
        setCharacters(filteredChars);
        setWorldItems(filteredWorldItems);
      }
      setIsLoading(false);
    },
    [originalCharacters, originalWorldItems],
  );

  return { characters, worldItems, isLoading, loadSettings, searchSettings };
}
