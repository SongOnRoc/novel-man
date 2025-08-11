"use client";

import React from "react";
import { SessionProvider } from "@/components/common/layout/SessionProvider";
import QueryProvider from "@/components/common/layout/QueryProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * A central component to wrap all client-side context providers.
 * Root-only mount. Avoid duplicating providers in route groups.
 * Contains NextAuth SessionProvider and TanStack QueryProvider.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
