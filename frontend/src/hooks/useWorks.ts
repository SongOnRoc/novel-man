import { useState, useEffect, useCallback } from "react";
import { Work } from "@/types/work";
import { mockWorks, mockDeleteWork, mockUpdateWork } from "@/lib/mock/works-mock-data";
import { mockChapters } from "@/lib/mock/chapters-mock-data";

/**
 * 用于管理作品数据的自定义 Hook
 */
export const useWorks = () => {
  const [works, setWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟从API加载作品列表
    setIsLoading(true);
    // 在当前阶段，我们直接使用mock数据，并动态计算最新章节
    const worksWithStats = mockWorks.map((work) => {
      const chaptersForWork = mockChapters.filter((c) => c.workId === work.id);
      const chapterCount = chaptersForWork.length;
      const wordCount = chaptersForWork.reduce(
        (sum, chapter) => sum + chapter.wordCount,
        0
      );

      const sortedChapters = [...chaptersForWork].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      const latestChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;

      return {
        ...work,
        chapterCount,
        wordCount,
        latestChapterId: latestChapter?.id,
        lastUpdatedChapter: latestChapter
          ? {
              title: latestChapter.title,
              updatedAt: latestChapter.updatedAt,
            }
          : undefined,
      };
    });

    setWorks(worksWithStats);
    setIsLoading(false);
  }, []);

  /**
   * 删除作品
   * @param workId 作品ID
   */
  const deleteWork = useCallback(async (workId: string) => {
    try {
      await mockDeleteWork(workId);
      setWorks((prevWorks) => prevWorks.filter((work) => work.id !== workId));
    } catch (error) {
      console.error("Failed to delete work:", error);
      // 在这里可以添加一些错误处理逻辑，例如显示一个通知
    }
  }, []);

  /**
   * 更新作品
   * @param workId 作品ID
   * @param updatedData 更新的数据
   */
  const updateWork = useCallback(async (workId: string, updatedData: Partial<Work>) => {
    try {
      const updatedWork = await mockUpdateWork(workId, updatedData);
      setWorks((prevWorks) =>
        prevWorks.map((work) => (work.id === workId ? updatedWork : work))
      );
    } catch (error) {
      console.error("Failed to update work:", error);
      // 在这里可以添加一些错误处理逻辑，例如显示一个通知
    }
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
      return work ? work.title : "";
    },
    [works]
  );

  return { works, isLoading, deleteWork, updateWork, getWorkById, getWorkNameById };
};
