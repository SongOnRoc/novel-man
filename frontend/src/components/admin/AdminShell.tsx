"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clearStoredAdminSession,
  getStoredAdminSession,
} from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasAdminSession, setHasAdminSession] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const session = getStoredAdminSession();
    setHasAdminSession(Boolean(session?.accessToken));
    setIsHydrated(true);
  }, []);

  useEffect((): (() => void) => {
    const check = (): void => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [pathname, isMobile]);

  useEffect(() => {
    if (!isHydrated) return;
    if (hasAdminSession) return;
    if (pathname === "/admin/login") return;

    window.location.replace("/admin/login");
  }, [hasAdminSession, isHydrated, pathname]);

  const handleLogout = (): void => {
    clearStoredAdminSession();
    setHasAdminSession(false);
    toast.success("已退出管理后台");
    window.location.replace("/admin/login");
  };

  return (
    <div className="flex h-mobile-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_32%),hsl(var(--background))] md:h-screen">
      {isMobile && sidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full transition-all md:relative",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <AdminSidebar />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-foreground">
                  管理后台
                </div>
                <Badge
                  variant={hasAdminSession ? "secondary" : "outline"}
                  className="rounded-full px-3 py-1"
                >
                  {hasAdminSession ? "Admin 会话已连接" : "Admin 会话未建立"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isMobile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSidebarOpen((v) => !v)}
                >
                  菜单
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={handleLogout}>
                退出管理后台
              </Button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 xl:p-8">
          <div className="mx-auto w-full max-w-7xl">
            {isHydrated && hasAdminSession ? children : null}
          </div>
        </main>
      </div>
    </div>
  );
}
