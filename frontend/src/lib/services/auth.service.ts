/**
 * @file Auth Service
 * This service is responsible for all authentication-related API calls.
 * It uses the auto-generated API client functions and provides them
 * to the application's hooks.
 *
 * 重要说明：
 * - UI 层的“登录动作”必须通过 NextAuth 触发（例如 useAuth().login → signIn('credentials')）。
 * - 本模块中的 `loginService` 仅用于 NextAuth 服务端路由的 `authorize` 步骤，用来对接后端登录与会话建立，
 *   并将 accessToken 与 user 合并进 NextAuth 的 JWT/Session 回调。
 * - UI 端请勿直接调用 `loginService`，以避免会话与令牌生命周期分裂、SSR/回调不一致等问题。
 * - 登录后的业务数据查询使用本模块提供的其它服务方法（如 getCurrentUserService），并由 Hook/TanStack Query 统一调度。
 * @author Alex Chen
 */

import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthUserProfileResponse,
  AuthLoginResponse,
  AuthRegisterResponse,
} from "@/lib/api/generated/api10.schemas";
import {
  postAuthLogin,
  postAuthRegister,
  getAuthMe,
  postAuthLogout,
} from "@/lib/api/generated/auth/auth";
import { SnakeToCamelCase } from "@/types/type-utils";

// =================================================================
// Re-exporting Core Auth Types for Application-wide Use
// This service becomes the single source of truth for auth-related types.
// =================================================================
export type LoginCredentials = AuthLoginRequest;
export type RegisterCredentials = AuthRegisterRequest;
export type AuthUser = AuthUserProfileResponse;
export type LoginResponse = AuthLoginResponse;
export type RegisterResponse = AuthRegisterResponse;

// A client-facing LoginResponse type with camelCase properties.
export type LoginResponseForClient = SnakeToCamelCase<LoginResponse>;

/**
 * 登录服务（仅供 NextAuth authorize 使用，不面向 UI 直接调用）
 * - 在 NextAuth CredentialsProvider.authorize 中调用该函数以向后端发起登录
 * - 成功后由 NextAuth 服务端继续使用 accessToken 拉取 /auth/me，并合并至 JWT/Session
 * - UI 层应通过 useAuth().login → signIn('credentials') 触发认证链，而非直接触达该服务
 * @param data - 登录凭据
 * @returns 后端登录响应（通常包含 access_token 与 token_type）
 */
export const loginService = (data: LoginCredentials) => {
  // The underlying `postAuthLogin` returns a camelCased response due to the axios interceptor.
  // The caller (`authorize` function) is responsible for using the correct camelCased type.
  return postAuthLogin(data) as Promise<LoginResponseForClient>;
};

/**
 * Handles the user registration request.
 * @param data - The registration details.
 * @returns A promise that resolves with the registration response.
 */
export const registerService = (data: RegisterCredentials) => {
  return postAuthRegister(data) as Promise<RegisterResponse>;
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
