import { useState, useEffect, useCallback } from "react";
import { Draft } from "@/types/work";
import {
  mockDrafts,
  mockDeleteDraft,
  mockConvertDraftToChapter,
  mockCreateDraft,
} from "@/lib/mock/chapters-mock-data";

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const createDraft = useCallback(async (content: string) => {
    setIsSaving(true);
    try {
      const newDraft = await mockCreateDraft(content);
      setDrafts((prev) => [newDraft, ...prev]);
      return newDraft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);
 
   return {
     drafts,
     isLoading,
     isSaving,
     deleteDraft,
     convertDraftToChapter,
     createDraft,
   };
 };