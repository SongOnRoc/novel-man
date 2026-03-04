import {
  clearStoredAdminSession,
  setStoredAdminSession,
  type AdminProfile,
} from "@/lib/admin-auth";
import type { AuthLoginRequest } from "@/lib/api/generated/api10.schemas";

export type AdminLoginCredentials = AuthLoginRequest;

export async function adminLoginService(
  data: AdminLoginCredentials
): Promise<{ accessToken: string; profile: AdminProfile }> {
  const response = await fetch("/api/proxy/auth/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    data?: { access_token?: string; accessToken?: string };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(payload.message || "管理后台登录失败");
  }

  const accessToken = payload.data?.accessToken || payload.data?.access_token;
  if (!accessToken) {
    throw new Error("未获取到 Admin Token");
  }

  const meResponse = await fetch("/api/proxy/auth/admin/me", {
    headers: {
      Authorization: accessToken.startsWith("Bearer ")
        ? accessToken
        : `Bearer ${accessToken}`,
    },
  });

  const mePayload = (await meResponse.json().catch(() => ({}))) as {
    data?: AdminProfile;
    message?: string;
  };

  if (!meResponse.ok || !mePayload.data) {
    throw new Error(mePayload.message || "获取管理员信息失败");
  }

  const session = setStoredAdminSession({
    accessToken,
    profile: mePayload.data,
  });

  return {
    accessToken: session.accessToken,
    profile: session.profile || {},
  };
}

export function adminLogoutService(): void {
  clearStoredAdminSession();
}
