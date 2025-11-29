"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileAIDrawer } from "./MobileAIDrawer";

interface EditorLayoutProps {
  children: React.ReactNode; // 编辑器内容
  sidebar: React.ReactNode;  // AI 工具面板内容
}

export function EditorLayout({ children, sidebar }: EditorLayoutProps) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* 主编辑器区域 */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-3xl min-h-full bg-card rounded-xl shadow-sm border p-8 md:p-12">
            {children}
          </div>
        </div>
        
        {/* 桌面端：展开/折叠按钮 (悬浮) */}
        <div className="absolute right-6 top-6 z-10 hidden md:block">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="bg-background/50 backdrop-blur-md shadow-sm hover:bg-primary/10 hover:text-primary transition-all duration-300 border"
            title={isRightPanelOpen ? "收起 AI 助手" : "展开 AI 助手"}
          >
            {isRightPanelOpen ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 右侧 AI 面板 (桌面端) */}
      <motion.div
        initial={false}
        animate={{
          width: isRightPanelOpen ? "360px" : "0px",
          opacity: isRightPanelOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden border-l border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex md:flex-col overflow-hidden shadow-2xl z-20"
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b px-4 bg-muted/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI 写作助手</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/20">
          {sidebar}
        </div>
      </motion.div>

      {/* 移动端：底部抽屉 */}
      <MobileAIDrawer>
        {sidebar}
      </MobileAIDrawer>
    </div>
  );
}
