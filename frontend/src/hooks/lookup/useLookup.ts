import { useState, useCallback } from "react";
import { Character } from "@/types/character";
import { WorldItem } from "@/types/worldbuilding";
import { mockGetCharactersByWorkId } from "@/lib/character-mock-data";
import { mockGetWorldItemsByWorkId } from "@/lib/worldbuilding-mock-data";

/**
 * 设定速查Hook
 * 提供快速查询角色和世界观设定的功能
 */
export function useLookup() {
  // 状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 加载作品的所有设定
   */
  const loadSettings = useCallback(async (workId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // 并行加载角色和世界观设定
      const [charactersResult, worldItemsResult] = await Promise.all([
        mockGetCharactersByWorkId(workId),
        mockGetWorldItemsByWorkId(workId),
      ]);

      setCharacters(charactersResult);
      setWorldItems(worldItemsResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "加载设定数据时发生错误";
      setError(errorMessage);
      console.error("加载设定数据错误:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 搜索设定
   */
  const searchSettings = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  /**
   * 过滤后的角色列表
   */
  const filteredCharacters = searchTerm
    ? characters.filter(
        (char) =>
          char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          char.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          char.background?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : characters;

  /**
   * 过滤后的世界观设定列表
   */
  const filteredWorldItems = searchTerm
    ? worldItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    : worldItems;

  return {
    characters: filteredCharacters,
    worldItems: filteredWorldItems,
    isLoading,
    error,
    searchTerm,
    loadSettings,
    searchSettings,
  };
}
