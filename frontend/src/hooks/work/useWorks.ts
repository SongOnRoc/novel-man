import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorks,
  createWork,
  getWorkById,
  updateWork,
  deleteWork,
} from "@/lib/api/works";
import { CreateWorkData, UpdateWorkData } from "@/types/work";

const workKeys = {
  all: ["works"] as const,
  lists: () => [...workKeys.all, "list"] as const,
  list: (filters: string) => [...workKeys.lists(), { filters }] as const,
  details: () => [...workKeys.all, "detail"] as const,
  detail: (id: number) => [...workKeys.details(), id] as const,
};

export const useWorks = (
  params: { page?: number; limit?: number; status?: string } = {},
) => {
  const filters = JSON.stringify(params);
  return useQuery({
    queryKey: workKeys.list(filters),
    queryFn: () => getWorks(params),
  });
};

export const useWork = (id: number) => {
  return useQuery({
    queryKey: workKeys.detail(id),
    queryFn: () => getWorkById(id),
    enabled: !!id,
  });
};

export const useCreateWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkData) => createWork(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
    },
  });
};

export const useUpdateWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWorkData }) =>
      updateWork(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
      queryClient.setQueryData(workKeys.detail(data.id), data);
    },
  });
};

export const useDeleteWork = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWork(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workKeys.lists() });
    },
  });
};
