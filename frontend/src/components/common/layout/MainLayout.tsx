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
import { ResponsiveSidebar } from "./sider/ResponsiveSidebar";

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
}: MainLayoutProps) {
  const { isCollapsed, setIsCollapsed } = useSidebarStore();
  
  // 根据侧边栏状态动态调整布局
  const [layout, setLayout] = React.useState(defaultLayout);
  
  React.useEffect(() => {
    // 当侧边栏状态改变时，更新布局
    if (isCollapsed) {
      setLayout([5, 95]); // 折叠时：侧边栏 5%，主内容 95%
    } else {
      setLayout([15, 85]); // 展开时：侧边栏 15%，主内容 85%
    }
  }, [isCollapsed]);

  // 确保侧边栏在初始化时正确应用折叠状态
  React.useEffect(() => {
    // This effect ensures the sidebar state is properly synchronized with the UI
    // when the page refreshes or when the component first mounts
    // 确保从 localStorage 恢复的状态正确应用到 UI
    if (isCollapsed !== undefined) {
      setIsCollapsed(isCollapsed);
    }
  }, [isCollapsed, setIsCollapsed]);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-screen w-screen items-stretch"
    >
      <ResponsiveSidebar>
        <Sidebar>
          <Sidebar.Header>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div
                  className={cn(
                    "flex flex-col items-start transition-all duration-300",
                    isCollapsed && "opacity-0 scale-95 pointer-events-none absolute"
                  )}
                >
                  <span className="text-base font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    NovelMan
                  </span>
                  <span className="text-xs text-muted-foreground/80 font-medium">v 0.0.1</span>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                  "p-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-105 active:scale-95",
                  "hidden md:inline-flex shadow-sm hover:shadow-md" // Only show on desktop
                )}
              >
                {isCollapsed ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-all duration-300 hover:scale-110"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition-all duration-300 hover:scale-110"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                )}
              </button>
            </div>
          </Sidebar.Header>
          <Sidebar.Content>
            <NavLinks isCollapsed={isCollapsed} />
          </Sidebar.Content>
          <Sidebar.Footer>
            <div>{/* Placeholder for UserProfile or other items */}</div>
          </Sidebar.Footer>
        </Sidebar>
      </ResponsiveSidebar>
      <ResizableHandle withHandle className="hidden" />
      <ResizablePanel defaultSize={layout[1]} className="relative">
        <div className="flex flex-col h-full overflow-hidden main-content-border">
          <div className="relative px-4 md:px-6 lg:px-8 py-4">
            <Header />
          </div>
          <main
            id="main-content"
            className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-0"
          >
            {children}
          </main>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
