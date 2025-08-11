"use client";

import { signIn, signOut, useSession } from "next-auth/react";

/**
 * 统一认证 Hook
 * - 设计目的：UI 不直接触达认证引擎或后端接口，统一通过 Hook 触发 NextAuth 认证链；
 *   由 NextAuth 服务端路由在 authorize 内对接后端登录与 /auth/me，统一生成会话与 Token。
 * - 好处：分层清晰、SSR/回调/安全策略一致、测试友好、可替换性强。
 */
export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResult {
  error?: string | null;
  ok?: boolean;
  status?: number;
  url?: string | null;
}

export function useAuth() {
  const { data: session, status } = useSession();

  const login = async (values: LoginInput): Promise<LoginResult | undefined> => {
    return await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/dashboard",
    });
  };

  const logout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return { login, logout, session, status };
}