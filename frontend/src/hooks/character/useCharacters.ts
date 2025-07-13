import { useState, useCallback, useEffect } from "react";
import {
  Character,
  CharacterRelationship,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character";
import {
  mockCharacters,
  mockRelationships,
  mockDeleteCharacter,
} from "@/lib/mock/character-mock-data";

/**
 * 角色管理Hook (Mock data version)
 * 提供角色列表获取、创建、更新和删除功能
 */
export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note: In this mock version, relationships are not managed by this hook.
  // They are read-only from the mock file. A separate useCharacterRelations hook handles them.

  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Simulate async operation
      await new Promise((res) => setTimeout(res, 100));
      setCharacters(mockCharacters);
      return mockCharacters;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取角色列表时发生错误";
      setError(errorMessage);
      console.error("获取角色列表错误:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCharacter = useCallback(
    async (id: string) => {
      // In a real app, this might fetch from an API. Here, we find from the mock data.
      const character = mockCharacters.find((char) => char.id === id);
      return character || null;
    },
    [] // No dependency on state `characters` as we use the static mock data
  );

  const addCharacter = useCallback(
    async (
      characterData: CreateCharacterRequest,
      // tempRelations are ignored in this mock version
      tempRelations: Omit<CharacterRelationship, "id" | "sourceId">[] = []
    ) => {
      console.log(
        "Mock addCharacter called. In a real app, this would save to a backend. Here, we just log and return a new character object.",
        characterData
      );
      const now = new Date().toISOString();
      const newCharacter: Character = {
        id: `char-${Date.now()}`,
        ...characterData,
        createdAt: now,
        updatedAt: now,
      };
      // To see the new character in the UI, we would need to update the state.
      // For this mock-up, we'll just return the new character.
      // setCharacters(prev => [...prev, newCharacter]); // Uncomment to see UI update
      return newCharacter;
    },
    []
  );

  const updateCharacter = useCallback(async (data: UpdateCharacterRequest) => {
    console.log(
      "Mock updateCharacter called. In a real app, this would save to a backend. Here, we just log and return the updated data.",
      data
    );
    const updatedCharacter: Character = {
      ...mockCharacters.find((c) => c.id === data.id)!,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    // setCharacters(prev => prev.map(c => c.id === data.id ? updatedCharacter : c)); // Uncomment to see UI update
    return updatedCharacter;
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API call
      // For now, we'll call the mock function
      const success = await mockDeleteCharacter(id);
      if (success) {
        setCharacters((prev) => prev.filter((c) => c.id !== id));
      }
      return success;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCharactersByWorkId = useCallback(async (workId: string) => {
    return mockCharacters.filter((char) => char.workId === workId);
  }, []);

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return {
    characters,
    isLoading,
    error,
    fetchCharacters,
    getCharacter,
    getCharactersByWorkId,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  };
}
