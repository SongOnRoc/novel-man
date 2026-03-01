import { useQuery } from "@tanstack/react-query";
import { getAvailableModelsService, ModelsModel } from "@/lib/services/ai.service";

export interface AIModel {
  value: string;
  label: string;
}

export const useAIModels = (apiKey?: string, baseUrl?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-models", apiKey, baseUrl],
    queryFn: () => getAvailableModelsService(), // Call without params to use cookie
    enabled: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const models: AIModel[] =
    data?.map((model: ModelsModel) => ({
      value: model.id || "",
      label: model.label || model.name || model.id || "",
    })) || [];

  return { models, isLoading, error };
};
