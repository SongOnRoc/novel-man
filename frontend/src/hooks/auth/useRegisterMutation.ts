/**
 * @file Custom hook for handling user registration mutation.
 * @author Alex Chen
 */

import { useMutation } from "@tanstack/react-query";
import { registerService } from "@/lib/services/auth.service";
import type { components, paths } from "@/types/generated/api";
import type { UseMutationOptions } from "@tanstack/react-query";

type RegisterRequest = components["schemas"]["auth.RegisterRequest"];
type RegisterResponse =
  paths["/auth/register"]["post"]["responses"]["201"]["content"]["application/json"];
type RegisterError =
  paths["/auth/register"]["post"]["responses"]["409"]["content"]["application/json"];

type UseRegisterMutationOptions = UseMutationOptions<
  RegisterResponse,
  RegisterError,
  RegisterRequest
>;

export const useRegisterMutation = (options?: UseRegisterMutationOptions) => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerService(data),
    ...options,
  });
};
