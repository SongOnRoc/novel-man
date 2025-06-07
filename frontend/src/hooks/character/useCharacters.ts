import { useState, useCallback, useEffect } from "react";
import {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character";
import {
  mockGetAllCharacters,
  mockGetCharacterById,
  mockCreateCharacter,
  mockUpdateCharacter,
  mockDeleteCharacter,
  mockGetCharactersByWorkId,
} from "@/lib/character-mock-data";

/**
 * 角色管理Hook
 * 提供角色列表获取、创建、更新和删除功能
 */
export function useCharacters() {
  // 角色列表
  const [characters, setCharacters] = useState<Character[]>([]);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取所有角色
   */
  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mockGetAllCharacters();
      setCharacters(result);
      return result;
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

  /**
   * 获取单个角色
   */
  const getCharacter = useCallback(async (id: string) => {
    try {
      return await mockGetCharacterById(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取角色信息时发生错误";
      console.error("获取角色信息错误:", err);
      return null;
    }
  }, []);

  /**
   * 创建角色
   */
  const createCharacter = useCallback(async (data: CreateCharacterRequest) => {
    try {
      const newCharacter = await mockCreateCharacter(data);
      setCharacters((prev) => [...prev, newCharacter]);
      return newCharacter;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "创建角色时发生错误";
      console.error("创建角色错误:", err);
      return null;
    }
  }, []);

  /**
   * 更新角色
   */
  const updateCharacter = useCallback(async (data: UpdateCharacterRequest) => {
    try {
      const updatedCharacter = await mockUpdateCharacter(data);
      setCharacters((prev) =>
        prev.map((char) =>
          char.id === updatedCharacter.id ? updatedCharacter : char
        )
      );
      return updatedCharacter;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "更新角色时发生错误";
      console.error("更新角色错误:", err);
      return null;
    }
  }, []);

  /**
   * 删除角色
   */
  const deleteCharacter = useCallback(async (id: string) => {
    try {
      const success = await mockDeleteCharacter(id);
      if (success) {
        setCharacters((prev) => prev.filter((char) => char.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "删除角色时发生错误";
      console.error("删除角色错误:", err);
      return false;
    }
  }, []);

  /**
   * 根据作品ID获取角色
   */
  const getCharactersByWorkId = useCallback(async (workId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mockGetCharactersByWorkId(workId);
      return result;
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

  // 初始加载角色列表
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
    createCharacter,
    updateCharacter,
    deleteCharacter,
  };
}
