import { useState, useEffect, useCallback } from "react";
import { Chapter } from "@/types/work";
import {
  mockChapters,
  mockDeleteChapter,
  mockUpdateChapterStatus,
} from "@/lib/mock/chapters-mock-data";

export const useChapters = (workId?: string) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // 如果提供了 workId，则筛选章节
    const allChapters = mockChapters;
    const filteredChapters = workId
      ? allChapters.filter((c) => c.workId === workId)
      : allChapters;
    setChapters(filteredChapters);
    setIsLoading(false);
  }, [workId]);

  const deleteChapter = useCallback(async (chapterId: string) => {
    try {
      await mockDeleteChapter(chapterId);
      setChapters((prev) => prev.filter((c) => c.id !== chapterId));
    } catch (error) {
      console.error("Failed to delete chapter:", error);
    }
  }, []);

  const updateChapterStatus = useCallback(
    async (chapterId: string, status: "draft" | "published") => {
      try {
        const updatedChapter = await mockUpdateChapterStatus(chapterId, status);
        setChapters((prev) =>
          prev.map((c) => (c.id === chapterId ? updatedChapter : c))
        );
      } catch (error) {
        console.error("Failed to update chapter status:", error);
      }
    },
    []
  );

  return { chapters, isLoading, deleteChapter, updateChapterStatus };
};