import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import {
  getSettingsService,
  updateSettingsService,
  UserSettings,
} from "@/lib/services/settings.service";

export function useSettings() {
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: getSettingsService,
  });

  const updateMutation = useMutation<void, Error, UserSettings>({
    mutationFn: updateSettingsService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
