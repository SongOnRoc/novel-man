"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserQuery } from "@/hooks/auth/useUserQuery";
import { MainLayout } from "@/components/common/layout/MainLayout";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * This layout component acts as a route guard for all main application routes.
 * It ensures that only authenticated users can access the content.
 */
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: user, isLoading, isError } = useUserQuery();
  const router = useRouter();

  useEffect(() => {
    // If the query is done and there's an error (e.g., 401 Unauthorized) or no user,
    // redirect to the login page.
    if (!isLoading && (isError || !user)) {
      router.push("/login");
    }
  }, [isLoading, isError, user, router]);

  // While the user data is loading, display a full-page skeleton loader.
  if (isLoading) {
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

  // If the user is authenticated, render the main layout with the page content.
  if (user) {
    return <MainLayout>{children}</MainLayout>;
  }

  // Render null while redirecting to prevent flashing of content.
  return null;
}
