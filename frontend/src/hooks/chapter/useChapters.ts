import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChapters,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  GetChaptersParams,
} from "@/lib/api/chapters";
import { ChapterCreate, ChapterUpdate } from "@/types/chapter";

const chapterKeys = {
  all: ["chapters"] as const,
  lists: () => [...chapterKeys.all, "list"] as const,
  list: (params: GetChaptersParams) =>
    [...chapterKeys.lists(), params] as const,
  details: () => [...chapterKeys.all, "detail"] as const,
  detail: (id: number) => [...chapterKeys.details(), id] as const,
};

export const useChapters = (params: GetChaptersParams) => {
  return useQuery({
    queryKey: chapterKeys.list(params),
    queryFn: () => getChapters(params),
    enabled: !!params.work_id, // Only run query if work_id is provided
  });
};

export const useChapter = (id: number) => {
  return useQuery({
    queryKey: chapterKeys.detail(id),
    queryFn: () => getChapterById(id),
    enabled: !!id,
  });
};

export const useCreateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChapterCreate) => createChapter(data),
    onSuccess: (data) => {
      // When a new chapter is created, invalidate the chapters list to refetch
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
    },
  });
};

export const useUpdateChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChapterUpdate }) =>
      updateChapter(id, data),
    onSuccess: (data) => {
      // When a chapter is updated, invalidate both the list and the specific chapter detail
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(data.id) });
    },
  });
};

export const useDeleteChapter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteChapter(id),
    onSuccess: () => {
      // When a chapter is deleted, invalidate the chapters list
      queryClient.invalidateQueries({ queryKey: chapterKeys.lists() });
    },
  });
};
