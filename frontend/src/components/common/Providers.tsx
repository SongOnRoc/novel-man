"use client";

import React from "react";

import QueryProvider from "@/components/common/layout/QueryProvider";
import { SessionProvider } from "@/components/common/layout/SessionProvider";

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
