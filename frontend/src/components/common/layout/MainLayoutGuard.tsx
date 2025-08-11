"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useUserQuery } from "@/hooks/auth/useUserQuery";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";

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

  // Show skeleton while NextAuth is resolving OR while fetching user after auth.
  if (status === "loading" || (status === "authenticated" && isUserLoading)) {
    return (
      <div className="flex h-screen w-full">
        <Skeleton className="h-full w-[256px]" />
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 w-full border-b" />
          <div className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Render main layout once authenticated. Avoid blocking on user object presence.
  if (status === "authenticated") {
    return <MainLayout>{children}</MainLayout>;
  }

  // Render null while redirecting to prevent flashing of content.
  return null;
}