/**
 * @file Custom hook for handling user registration mutation.
 * @author Alex Chen
 */

import { useMutation } from "@tanstack/react-query";
import type { UseMutationOptions } from "@tanstack/react-query";

import { registerService } from "@/lib/services/auth.service";

import type {
  RegisterCredentials,
  RegisterResponse,
} from "@/lib/services/auth.service";

type RegisterRequest = RegisterCredentials;
type RegisterError = Error & {
  message?: string;
};

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
