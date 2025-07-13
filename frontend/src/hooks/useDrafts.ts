import { useState, useEffect, useCallback } from "react";
import { Draft } from "@/types/work";
import {
  mockDrafts,
  mockDeleteDraft,
  mockConvertDraftToChapter,
} from "@/lib/mock/chapters-mock-data";

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setDrafts(mockDrafts);
    setIsLoading(false);
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      await mockDeleteDraft(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  }, []);

  const convertDraftToChapter = useCallback(async (draftId: string) => {
    try {
      await mockConvertDraftToChapter(draftId);
      // After converting, we also remove it from the drafts list
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Failed to convert draft:", error);
    }
  }, []);

  return { drafts, isLoading, deleteDraft, convertDraftToChapter };
};