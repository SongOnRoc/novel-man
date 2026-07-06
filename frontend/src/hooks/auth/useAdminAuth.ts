"use client";

import { useCallback, useEffect, useState } from "react";

import { getStoredAdminSession, type AdminSession } from "@/lib/admin-auth";
import {
  adminLoginService,
  adminLogoutService,
  type AdminLoginCredentials,
} from "@/lib/services/admin-auth.service";

export type AdminAuthStatus = "loading" | "authenticated" | "unauthenticated";

export function useAdminAuth(): {
  login: (credentials: AdminLoginCredentials) => Promise<{
    accessToken: string;
    profile: NonNullable<AdminSession["profile"]>;
  }>;
  logout: () => void;
  session: AdminSession | null;
  status: AdminAuthStatus;
} {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [status, setStatus] = useState<AdminAuthStatus>("loading");

  useEffect(() => {
    const stored = getStoredAdminSession();
    setSession(stored);
    setStatus(stored ? "authenticated" : "unauthenticated");
  }, []);

  const login = useCallback(async (credentials: AdminLoginCredentials) => {
    const result = await adminLoginService(credentials);
    const nextSession = getStoredAdminSession();
    setSession(nextSession);
    setStatus(nextSession ? "authenticated" : "unauthenticated");
    return result;
  }, []);

  const logout = useCallback(() => {
    adminLogoutService();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return {
    login,
    logout,
    session,
    status,
  };
}
