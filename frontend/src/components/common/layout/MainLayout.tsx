"use client";

import React from "react";

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { useSidebarStore } from "@/hooks/ui/useSidebarStore";
import { cn } from "@/lib/utils";

import { Header } from "./Header";
import { Sidebar } from "./sider";
import { NavLinks } from "./sider/nav-links";


interface MainLayoutProps {
  children: React.ReactNode;
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize?: number;
}

export function MainLayout({
  children,
  defaultLayout = [15, 85], // Sidebar: 15%, Main: 85%
  defaultCollapsed = false,
  navCollapsedSize = 4, // Corresponds to Tailwind CSS width w-16 (4rem)
}: MainLayoutProps) {
  const { isCollapsed, setIsCollapsed } = useSidebarStore();

  // 如果 store 中的 collapsed 状态是默认值 (false)，则使用 defaultCollapsed 来更新 store
  // 这确保了 defaultCollapsed 只在 store 初始化时起作用
  React.useEffect(() => {
    // This effect is no longer needed as the store handles persistence.
    // if (!isCollapsed && defaultCollapsed) {
    //   setIsCollapsed(defaultCollapsed);
    // }
  }, [defaultCollapsed, isCollapsed, setIsCollapsed]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen items-stretch"
    >
      <ResizablePanel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={15}
        maxSize={25}
        onCollapse={() => {
          setIsCollapsed(true);
        }}
        onExpand={() => {
          setIsCollapsed(false);
        }}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out"
        )}
      >
        <Sidebar>
          <Sidebar.Header>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
              </div>
              <div
                className={cn(
                  "flex flex-col items-start",
                  isCollapsed && "hidden"
                )}
              >
                <span className="text-base font-semibold">NovelMan</span>
                <span className="text-xs text-muted-foreground">v 0.0.1</span>
              </div>
            </div>
          </Sidebar.Header>
          <Sidebar.Content>
            <NavLinks isCollapsed={isCollapsed} />
          </Sidebar.Content>
          <Sidebar.Footer>
            <div>{/* Placeholder for UserProfile or other items */}</div>
          </Sidebar.Footer>
        </Sidebar>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={defaultLayout[1]}>
        <div className="flex flex-col h-full">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
