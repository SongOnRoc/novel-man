/**
 * @file Custom hook for handling user login mutation.
 * @author Alex Chen
 */

import { useMutation } from "@tanstack/react-query";
import { loginService } from "@/lib/services/auth.service";
import type { components, paths } from "@/types/generated/api";
import type { UseMutationOptions } from "@tanstack/react-query";

type LoginRequest = components["schemas"]["auth.LoginRequest"];
type LoginResponse =
  paths["/auth/login"]["post"]["responses"]["200"]["content"]["application/json"];
type LoginError =
  paths["/auth/login"]["post"]["responses"]["401"]["content"]["application/json"];

type UseLoginMutationOptions = UseMutationOptions<
  LoginResponse,
  LoginError,
  LoginRequest
>;

export const useLoginMutation = (options?: UseLoginMutationOptions) => {
  return useMutation({
    mutationFn: (data: LoginRequest) => loginService(data),
    ...options, // Spread the options here, allowing onSuccess, onError, etc., to be overridden
  });
};
