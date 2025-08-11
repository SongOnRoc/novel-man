import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { worksApi } from "@/lib/api/works";
import { WorkWorldview } from "@/types/core";

export function useWorkWorldview(workId: number) {
  const queryClient = useQueryClient();
  const queryKey = ["works", workId, "worldview-items"];

  // 获取作品关联的世界观条目
  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery<WorkWorldview[]>({
    queryKey,
    queryFn: () => worksApi.getAssociatedWorldviewItems(workId),
  });

  // 关联世界观条目到作品
  const associateItems = useMutation({
    mutationFn: (itemIds: number[]) =>
      worksApi.associateWorldviewItems(workId, itemIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 解除世界观条目关联
  const dissociateItem = useMutation({
    mutationFn: (itemId: number) =>
      worksApi.dissociateWorldviewItem(workId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    items,
    isLoading,
    error,
    associateItems: associateItems.mutateAsync,
    dissociateItem: dissociateItem.mutateAsync,
  };
}
