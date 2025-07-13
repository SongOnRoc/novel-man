import { useState, useEffect, useCallback } from "react";
import { Work } from "@/types/work";
import { mockWorks } from "@/lib/mock/works-mock-data";

/**
 * 用于管理作品数据的自定义 Hook
 */
export const useWorks = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟从API加载作品列表
    setIsLoading(true);
    // 在当前阶段，我们直接使用mock数据
    setWorks(mockWorks);
    setIsLoading(false);
  }, []);

  /**
   * 根据作品ID获取作品信息
   * @param workId 作品ID
   * @returns 作品对象或 undefined
   */
  const getWorkById = useCallback(
    (workId: string): Work | undefined => {
      return works.find((work) => work.id === workId);
    },
    [works]
  );

  /**
   * 根据作品ID获取作品名称
   * @param workId 作品ID
   * @returns 作品名称或 "未知作品"
   */
  const getWorkNameById = useCallback(
    (workId: string): string => {
      const work = works.find((w) => w.id === workId);
      return work ? work.name : "";
    },
    [works]
  );

  return { works, isLoading, getWorkById, getWorkNameById };
};
