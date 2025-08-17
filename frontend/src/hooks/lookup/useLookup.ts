import { useState, useCallback } from 'react';
import { useWorkCharacters, useWorkWorldview } from '@/hooks/work/useWorkService';
import { Character } from '@/lib/services/characters.service';
import { WorldviewItem } from '@/lib/services/worldview.service';

export function useLookup(workId: string) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [originalCharacters, setOriginalCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldviewItem[]>([]);
  const [originalWorldItems, setOriginalWorldItems] = useState<WorldviewItem[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);

  const { characters: charData, isLoading: isCharLoading } = useWorkCharacters(
    parseInt(workId, 10)
  );
  const { items: worldData, isLoading: isWorldLoading } = useWorkWorldview(
    parseInt(workId, 10)
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      setCharacters(charData);
      setOriginalCharacters(charData);
      setWorldItems(worldData);
      setOriginalWorldItems(worldData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [charData, worldData]);

  const searchSettings = useCallback(
    (query: string) => {
      setIsLoading(true);
      if (!query) {
        setCharacters(originalCharacters);
        setWorldItems(originalWorldItems);
      } else {
        const lowercasedQuery = query.toLowerCase();
        const filteredChars = originalCharacters.filter(
          (c) => c.name && c.name.toLowerCase().includes(lowercasedQuery)
        );
        const filteredWorldItems = originalWorldItems.filter(
          (w) => w.name && w.name.toLowerCase().includes(lowercasedQuery)
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
