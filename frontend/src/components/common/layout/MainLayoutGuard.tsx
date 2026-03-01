"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { MainLayout } from "@/components/common/layout/MainLayout";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { useUserQuery } from "@/hooks/auth/useUserQuery";

/**
 * This component acts as a route guard for all main application routes.
 * It ensures that only authenticated users can access the content.
 * It must be wrapped in a SessionProvider.
 */
export function MainLayoutGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const { isLoading: isUserLoading, isError } = useUserQuery();

  useEffect(() => {
    // Only redirect when NextAuth explicitly says unauthenticated,
    // or when authenticated but user query definitively failed (e.g., 401).
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && !isUserLoading && isError) {
      router.replace("/login");
    }
  }, [status, isUserLoading, isError, router]);

  // Show GlobalLoading while NextAuth is resolving OR while fetching user after auth.
  if (status === "loading" || (status === "authenticated" && isUserLoading)) {
    return <GlobalLoading />;
  }

  // Render main layout once authenticated. Avoid blocking on user object presence.
  if (status === "authenticated") {
    return <MainLayout>{children}</MainLayout>;
  }

  // Render null while redirecting to prevent flashing of content.
  return null;
}