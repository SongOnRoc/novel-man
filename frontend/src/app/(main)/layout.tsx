"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/common/layout/MainLayout";

// 主路由组布局
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>正在加载...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <MainLayout>{children}</MainLayout>;
  }

  return null;
}
