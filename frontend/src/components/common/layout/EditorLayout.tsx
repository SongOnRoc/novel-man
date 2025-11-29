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
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* 主编辑器区域 */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-3xl h-full">
            {children}
          </div>
        </div>
        
        {/* 桌面端：展开/折叠按钮 (悬浮) */}
        <div className="absolute right-4 top-4 z-10 hidden md:block">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="bg-background/80 backdrop-blur shadow-sm hover:bg-background"
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
          width: isRightPanelOpen ? "320px" : "0px",
          opacity: isRightPanelOpen ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden border-l bg-background md:flex md:flex-col overflow-hidden"
      >
        <div className="flex h-12 items-center justify-between border-b px-4 bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI 助手</span>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {sidebar}
          </div>
        </ScrollArea>
      </motion.div>

      {/* 移动端：底部抽屉 */}
      <MobileAIDrawer>
        {sidebar}
      </MobileAIDrawer>
    </div>
  );
}
