"use client"; // 标记为客户端组件

import * as React from "react"; // 导入React
import { AppSidebar } from "./AppSidebar"; // 导入侧边栏组件

// 定义主布局组件的属性类型
interface MainLayoutProps {
  children: React.ReactNode; // 子组件
}

// 主布局组件
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <AppSidebar />

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
