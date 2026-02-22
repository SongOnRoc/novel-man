"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, ChevronDown } from "lucide-react";

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

  const isEditorPage = pathname?.includes("/edit");
  const isMobileEditor = isMobile && isEditorPage;

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



  return (
    <div className="flex h-mobile-screen md:h-screen w-full overflow-hidden bg-background">
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
            <Sidebar showExtraFooter={isMobileEditor} />
          </div>
        </div>
      </motion.aside>

      {/* 主内容区域 */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden relative">
        {/* Header Area - 移动端编辑器模式下隐藏 */}
        {!isMobileEditor && (
          <Header 
            isSidebarOpen={isSidebarOpen} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
        )}

        {/* Mobile Editor Sidebar Toggle Handle (Right-Pull) */}
        {isMobileEditor && !isSidebarOpen && (
          <div 
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 flex items-center"
            onClick={() => setIsSidebarOpen(true)}
          >
            <div className="bg-primary/10 backdrop-blur-sm hover:bg-primary/20 text-primary rounded-r-lg py-3 px-0.5 shadow-sm cursor-pointer transition-all opacity-30 hover:opacity-100">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        )}
        
        <main className={cn(
          "flex-1 min-h-0 bg-secondary/30 transition-all duration-300",
          isMobileEditor
            ? "p-0 overflow-y-auto"
            : isEditorPage
              ? "p-0 overflow-hidden"
              : "p-4 md:p-6 overflow-y-auto"
        )}>
          <div className={cn(
            "mx-auto transition-all duration-300",
            isEditorPage ? "h-full w-full max-w-none" : "max-w-7xl"
          )}>
            <motion.div
              key={pathname}
              initial={isEditorPage ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={isEditorPage ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={isEditorPage ? "h-full" : ""}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>


    </div>
  );
}
