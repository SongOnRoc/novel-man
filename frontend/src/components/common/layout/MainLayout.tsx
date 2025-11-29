"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./sider/Sidebar";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 路由变化时，移动端自动关闭侧边栏
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // 边缘触发逻辑 (Edge Trigger)
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      // 仅在屏幕左边缘 20px 内触发
      if (e.touches[0].clientX < 20 && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    return () => window.removeEventListener("touchstart", handleTouchStart);
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 移动端遮罩 */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? (isMobile ? "80%" : "260px") : "0px",
          x: isSidebarOpen ? 0 : isMobile ? -300 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar shadow-xl md:relative md:shadow-none",
          !isSidebarOpen && !isMobile && "border-none"
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <span className="text-lg font-bold text-primary">Novel Man</span>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <Sidebar />
          </div>
        </div>
      </motion.aside>

      {/* 主内容区域 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header 
          isSidebarOpen={isSidebarOpen} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      {/* 移动端边缘触发提示条 (可选) */}
      {isMobile && !isSidebarOpen && (
        <div className="fixed left-0 top-1/2 h-20 w-1 -translate-y-1/2 rounded-r-full bg-primary/20" />
      )}
    </div>
  );
}
