"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileCompactComposer } from "./MobileCompactComposer";
import type { EditorTheme } from "@/types/editor";

interface MobileAIFloatingBarProps {
  /** Currently selected text from editor */
  selectedText?: string;
  /** Callback when input is focused to enter immersive mode */
  onInputFocus: () => void;
  /** Callback when user swipes up */
  onSwipeUp: () => void;
  /** Safe area inset bottom value */
  safeAreaBottom: number;
  /** Editor theme for styling */
  theme?: EditorTheme;
}

/**
 * Mobile AI Floating Bar
 *
 * A compact bottom bar with input and collapse functionality.
 * - Input box with edit button to enter immersive mode
 * - Collapse button to minimize the bar to the right
 * Uses theme class to inherit editor theme colors.
 */
export function MobileAIFloatingBar({
  selectedText,
  onInputFocus,
  onSwipeUp,
  safeAreaBottom,
  theme = "default",
}: MobileAIFloatingBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle drag end to detect swipe up gesture
  const handleDragEnd = (
    _: any,
    info: { velocity: { y: number }; offset: { y: number } }
  ) => {
    // Trigger expansion if swiped up with sufficient velocity or distance
    if (info.velocity.y < -200 || info.offset.y < -50) {
      onSwipeUp();
    }
  };

  // Toggle collapse state
  const toggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  // Collapsed state - just a small button on the right
  if (isCollapsed) {
    return (
      <motion.button
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={toggleCollapse}
        className={cn(
          "fixed bottom-4 right-4 z-40",
          // 使用主题类继承编辑器主题颜色
          `theme-${theme}`,
          "editor-paper",
          //圆形按钮样式
          "h-12 w-12 rounded-full",
          // 阴影和边框
          "shadow-lg border border-foreground/10",
          // 背景和交互
          "backdrop-blur-sm",
          "flex items-center justify-center",
          "active:scale-95 transition-transform"
        )}
        style={{
          marginBottom: `max(${safeAreaBottom}px, env(safe-area-inset-bottom, 8px))`,
        }}
        aria-label="展开 AI 助手"
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </motion.button>
    );
  }

  // Expanded state - full bar with input
  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.2, bottom: 0.1 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "fixed bottom-0 inset-x-0 z-40",
        // 使用主题类继承编辑器主题颜色
        `theme-${theme}`,
        "editor-paper",
        // 添加模糊效果
        "backdrop-blur-sm",
        // 顶部边框
        "border-t border-foreground/10",
        // 阴影效果
        "shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      )}
      style={{
        paddingBottom: `max(${safeAreaBottom}px, env(safe-area-inset-bottom, 8px))`,
      }}
    >
      {/* Drag Handle Indicator */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-10 h-1 rounded-full bg-foreground/15" />
      </div>

      {/* Main Content */}
      <div className="px-3 pb-2 flex items-center gap-2">
        {/* Input Area */}
        <div className="flex-1 min-w-0">
          <MobileCompactComposer
            onFocus={onInputFocus}
            placeholder={
              selectedText
                ? `已选中: ${selectedText.slice(0, 20)}...`
                : "问问AI..."
            }
          />
        </div>

        {/* Collapse Button -右侧圆形设计 */}
        <button
          onClick={toggleCollapse}
          className={cn(
            "flex items-center justify-center shrink-0",
            "h-9 w-9 rounded-full",
            "bg-foreground/5 text-foreground/50",
            "border border-foreground/10",
            "transition-all duration-200",
            "hover:bg-foreground/10 hover:text-foreground/70",
            "active:scale-95"
          )}
          aria-label="折叠 AI 助手"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default MobileAIFloatingBar;
