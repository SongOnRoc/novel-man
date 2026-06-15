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

  const isEditorPage = Boolean(
    pathname?.includes("/edit") || pathname?.endsWith("/drafts/new"),
  );
  const isReadingChapterPage = pathname ? /\/works\/\d+\/chapters\/\d+$/.test(pathname) : false;
  const isImmersivePage = isEditorPage || isReadingChapterPage;
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
    <div className="relative isolate flex h-mobile-screen md:h-screen w-full overflow-hidden">
      {/* 全局渐变背景层：复用登录页方案 — 两个超大对角色块 + 缓慢漂浮动画 */}
      {/* 用 isolate 创建独立 stacking context，避免 -z-10 被父级背景色遮挡 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-page)]"
      >
        <motion.div
          className="absolute -left-[10%] -top-[10%] h-[55vw] w-[55vw] rounded-full bg-primary/25 blur-[100px]"
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-[15%] -right-[10%] h-[55vw] w-[55vw] rounded-full bg-accent/25 blur-[100px]"
          animate={{
            x: [0, -80, 0],
            y: [0, -40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      {/* 移动端遮罩 */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* 侧边栏 — 半透明 + 毛玻璃，让底层渐变透出 */}
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? (isMobile ? "80%" : "240px") : "0px",
          x: isSidebarOpen ? 0 : isMobile ? -300 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col md:relative",
          "bg-[var(--bg-card)]/70 backdrop-blur-xl",
          "border-r border-[var(--border-subtle)]/60",
          isMobile && "shadow-2xl",
          !isSidebarOpen && !isMobile && "border-none",
        )}
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)]/60 px-4">
            <span className="text-base font-semibold text-[var(--text-primary)]">Novel Man</span>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-3">
            <Sidebar showExtraFooter={isMobileEditor} />
          </div>
        </div>
      </motion.aside>

      {/* 主内容区域 — 背景一体化，无独立色块 */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden relative">
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
            <div className="rounded-r-md bg-[var(--primary-50)] px-0.5 py-3 text-[var(--primary-700)] shadow-sm cursor-pointer opacity-40 transition-opacity hover:opacity-100">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        )}

        <main
          className={cn(
            "flex-1 min-h-0 transition-all duration-300",
            isMobileEditor
              ? "p-0 overflow-y-auto"
              : isImmersivePage
                ? "p-0 overflow-hidden"
                : "p-4 md:p-6 overflow-y-auto",
          )}
        >
          <div
            className={cn(
              "mx-auto transition-all duration-300",
              isImmersivePage ? "h-full w-full max-w-none" : "max-w-7xl",
            )}
          >
            <motion.div
              key={pathname}
              initial={isImmersivePage ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={isImmersivePage ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={isImmersivePage ? "h-full" : ""}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
