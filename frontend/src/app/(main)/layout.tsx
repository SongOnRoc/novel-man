"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { MainLayoutGuard } from "@/components/common/layout/MainLayoutGuard";

/**
 * This layout wraps all main application routes.
 * Context providers are attached at the root layout. Avoid duplicating here.
 */
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();

  // `/admin/*` uses an entirely separate shell (no coupling with common/layout).
  if (pathname.startsWith("/admin")) {
    return <AdminShell>{children}</AdminShell>;
  }

  // Non-admin routes keep using the existing main shell.
  return <MainLayoutGuard>{children}</MainLayoutGuard>;
}
