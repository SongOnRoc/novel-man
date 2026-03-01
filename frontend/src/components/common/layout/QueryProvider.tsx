"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * QueryProvider
 * - 统一 React Query 客户端配置，确保缓存、错误、重试与刷新行为一致
 * - 设计取舍：
 *   - staleTime 5min：减少不必要请求，编辑类场景优先局部响应
 *   - refetchOnWindowFocus false：避免切换窗口触发突兀刷新
 *   - queries.retry 1：对可恢复类网络抖动容忍一次重试
 *   - mutations.retry 0：变更操作不自动重试，交由 UI 显式处理
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 懒初始化 QueryClient，避免在 React 严格模式下重复创建实例
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
