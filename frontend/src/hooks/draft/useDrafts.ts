import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDraft,
  publishDraft,
  updateDraft,
  deleteDraft,
  getDrafts,
} from "@/lib/api/drafts";
import { Draft } from "@/types/core";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PaginatedResponse } from "@/types/base";
import { DraftCreate, DraftUpdate } from "@/types/draft";

export function useDrafts(workId?: number) {
  const { data, isLoading } = useQuery<PaginatedResponse<Draft>>({
    queryKey: workId ? ["works", workId, "drafts"] : ["drafts"],
    queryFn: () => getDrafts({ work_id: workId }),
  });

  return {
    data,
    isLoading,
  };
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: DraftCreate) => createDraft(draft),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("草稿创建成功");
    },
    onError: () => {
      toast.error("草稿创建失败");
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DraftUpdate }) =>
      updateDraft(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("草稿更新成功");
    },
    onError: () => {
      toast.error("草稿更新失败");
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      toast.success("草稿删除成功");
    },
    onError: () => {
      toast.error("草稿删除失败");
    },
  });
}

export function usePublishDraft() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (draftId: number) => publishDraft(draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drafts"] });
      queryClient.invalidateQueries({ queryKey: ["chapters"] });
      toast.success("草稿发布成功");
      router.refresh();
    },
    onError: () => {
      toast.error("草稿发布失败");
    },
  });
}
