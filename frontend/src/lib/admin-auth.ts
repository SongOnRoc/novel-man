export const ADMIN_ACCESS_TOKEN_STORAGE_KEY = "admin-console.access-token";
export const ADMIN_PROFILE_STORAGE_KEY = "admin-console.profile";

export type AdminProfile = {
  email?: string;
  id?: number;
  role?: string;
  username?: string;
};

export type AdminSession = {
  accessToken: string;
  profile?: AdminProfile | null;
};

export function isAdminApiPath(path: string): boolean {
  return (
    path === "/ops" ||
    path.startsWith("/ops/") ||
    path.startsWith("/auth/admin/")
  );
}

export function normalizeAdminAccessToken(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return "";

  return /^bearer\s+/i.test(trimmed) ? trimmed : `Bearer ${trimmed}`;
}

export function getStoredAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const token = window.sessionStorage.getItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY);
  return token && token.trim() ? token : null;
}

export function setStoredAdminAccessToken(token: string): string {
  if (typeof window === "undefined") return normalizeAdminAccessToken(token);

  const normalized = normalizeAdminAccessToken(token);

  if (!normalized) {
    window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY);
    return "";
  }

  window.sessionStorage.setItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY, normalized);
  return normalized;
}

export function clearStoredAdminAccessToken(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_STORAGE_KEY);
}

export function getStoredAdminProfile(): AdminProfile | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(ADMIN_PROFILE_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AdminProfile;
  } catch {
    window.sessionStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
    return null;
  }
}

export function setStoredAdminProfile(
  profile: AdminProfile | null | undefined
): void {
  if (typeof window === "undefined") return;

  if (!profile) {
    window.sessionStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    ADMIN_PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );
}

export function clearStoredAdminProfile(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
}

export function getStoredAdminSession(): AdminSession | null {
  const accessToken = getStoredAdminAccessToken();
  if (!accessToken) return null;

  return {
    accessToken,
    profile: getStoredAdminProfile(),
  };
}

export function setStoredAdminSession(session: AdminSession): AdminSession {
  const normalizedToken = setStoredAdminAccessToken(session.accessToken);
  setStoredAdminProfile(session.profile ?? null);

  return {
    accessToken: normalizedToken,
    profile: session.profile ?? null,
  };
}

export function clearStoredAdminSession(): void {
  clearStoredAdminAccessToken();
  clearStoredAdminProfile();
}
