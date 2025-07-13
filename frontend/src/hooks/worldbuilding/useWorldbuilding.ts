import { useState, useCallback, useEffect } from "react";
import {
  WorldItem,
  CreateWorldItemRequest,
  UpdateWorldItemRequest,
} from "@/types/worldbuilding";
import {
  mockGetAllWorldItems,
  mockGetWorldItemById,
  mockCreateWorldItem,
  mockUpdateWorldItem,
  mockDeleteWorldItem,
  mockGetWorldItemsByWorkId,
} from "@/lib/mock/worldbuilding-mock-data";

/**
 * 世界观设定Hook
 * 提供世界观设定的获取、创建、更新和删除功能
 */
export function useWorldbuilding() {
  // 世界观设定列表
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取所有世界观设定
   */
  const fetchWorldItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mockGetAllWorldItems();
      setWorldItems(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取世界观设定列表时发生错误";
      setError(errorMessage);
      console.error("获取世界观设定列表错误:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取单个世界观设定
   */
  const getWorldItem = useCallback(async (id: string) => {
    try {
      return await mockGetWorldItemById(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取世界观设定信息时发生错误";
      console.error("获取世界观设定信息错误:", err);
      return null;
    }
  }, []);

  /**
   * 创建世界观设定
   */
  const createWorldItem = useCallback(async (data: CreateWorldItemRequest) => {
    try {
      const newWorldItem = await mockCreateWorldItem(data);
      setWorldItems((prev) => [...prev, newWorldItem]);
      return newWorldItem;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "创建世界观设定时发生错误";
      console.error("创建世界观设定错误:", err);
      return null;
    }
  }, []);

  /**
   * 更新世界观设定
   */
  const updateWorldItem = useCallback(async (data: UpdateWorldItemRequest) => {
    try {
      const updatedWorldItem = await mockUpdateWorldItem(data);
      setWorldItems((prev) =>
        prev.map((item) =>
          item.id === updatedWorldItem.id ? updatedWorldItem : item
        )
      );
      return updatedWorldItem;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "更新世界观设定时发生错误";
      console.error("更新世界观设定错误:", err);
      return null;
    }
  }, []);

  /**
   * 删除世界观设定
   */
  const deleteWorldItem = useCallback(async (id: string) => {
    try {
      const success = await mockDeleteWorldItem(id);
      if (success) {
        setWorldItems((prev) => prev.filter((item) => item.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "删除世界观设定时发生错误";
      console.error("删除世界观设定错误:", err);
      return false;
    }
  }, []);

  // 添加按作品ID获取世界观设定的函数
  const getWorldItemsByWorkId = useCallback(async (workId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mockGetWorldItemsByWorkId(workId);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "获取世界观设定列表时发生错误";
      setError(errorMessage);
      console.error("获取世界观设定列表错误:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载世界观设定列表
  useEffect(() => {
    fetchWorldItems();
  }, [fetchWorldItems]);

  return {
    worldItems,
    isLoading,
    error,
    fetchWorldItems,
    getWorldItem,
    getWorldItemsByWorkId,
    createWorldItem,
    updateWorldItem,
    deleteWorldItem,
  };
}
