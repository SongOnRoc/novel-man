/**
 * @file Auth Service
 * This service is responsible for all authentication-related API calls.
 * It uses the auto-generated API client functions and provides them
 * to the application's hooks.
 * @author Alex Chen
 */

import {
  postAuthLogin,
  postAuthRegister,
  getAuthMe,
  postAuthLogout,
} from "@/lib/api/generated/auth/auth";
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthUserProfileResponse,
  AuthLoginResponse,
} from "@/lib/api/generated/api10.schemas";

// =================================================================
// Re-exporting Core Auth Types for Application-wide Use
// This service becomes the single source of truth for auth-related types.
// =================================================================
export type LoginCredentials = AuthLoginRequest;
export type RegisterCredentials = AuthRegisterRequest;
export type AuthUser = AuthUserProfileResponse;
export type LoginResponse = AuthLoginResponse;

/**
 * Handles the user login request.
 * @param data - The login credentials.
 * @returns A promise that resolves with the login response.
 */
export const loginService = (data: LoginCredentials) => {
  return postAuthLogin(data) as Promise<LoginResponse>;
};

/**
 * Handles the user registration request.
 * @param data - The registration details.
 * @returns A promise that resolves with the registration response.
 */
export const registerService = (data: RegisterCredentials) => {
  return postAuthRegister(data);
};

/**
 * Fetches the profile of the currently authenticated user.
 * If a token is provided, it will be used for authorization. Otherwise, the default axios interceptor will be used.
 * @param accessToken - Optional access token.
 * @returns A promise that resolves with the user's profile information.
 */
export const getCurrentUserService = () => {
  return getAuthMe() as Promise<AuthUser>;
};

/**
 * Handles the user logout request.
 */
export const logoutService = () => {
  // The actual session invalidation is handled by NextAuth on the client side.
  // This function can be used to call a backend logout endpoint if it exists.
  return postAuthLogout();
};
