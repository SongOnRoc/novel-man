"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/common/layout/MainLayout";

// 主路由组布局
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>正在加载...</div>
      </div>
    );
  }

  if (user) {
    return <MainLayout>{children}</MainLayout>;
  }

  return null;
}
