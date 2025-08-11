/**
 * @file Custom hook for fetching the current user's profile.
 * @author Alex Chen
 */

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getCurrentUserService } from "@/lib/services/auth.service";

// We define a query key to uniquely identify this query.
const userQueryKey = ["currentUser"];

export const useUserQuery = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: userQueryKey,
    queryFn: getCurrentUserService,
    // This is the key to solving the race condition.
    // The query will only be enabled (i.e., will only run)
    // when the NextAuth session status is 'authenticated'.
    enabled: status === "authenticated",
    // Optional: Configure caching behavior
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    refetchOnWindowFocus: false,
  });
};
