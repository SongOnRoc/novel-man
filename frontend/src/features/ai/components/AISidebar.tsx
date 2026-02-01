"use client";

import { type FC, useState, useCallback } from "react";
import { PanelRightCloseIcon, PanelRightOpenIcon, Sparkles } from "lucide-react";

import { AIAssistantShell } from "@/components/assistant-ui/ai-assistant-shell";
import {
  AISettingsDialog,
  useAISettings,
} from "@/components/assistant-ui/ai-settings-dialog";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface AISidebarProps {
  /** 是否展开侧边栏 */
  open?: boolean;
  /** 展开状态变化回调 */
  onOpenChange?: (open: boolean) => void;
  /** 编辑器中选中的文本 */
  selectedText?: string;
  /** 将AI 生成内容应用到编辑器的回调 */
  onApplyToEditor?: (text: string) => void;
  /** 当前作品ID */
  workId?: number;
  /** 当前章节 ID */
  chapterId?: number;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * AI 侧边栏组件
 * 
 * 用于章节/草稿编辑页面，提供可收起的 AI 助手侧边栏。
 * 编辑器区域会自适应调整宽度。
 */
export const AISidebar: FC<AISidebarProps> = ({
  open = false,
  onOpenChange,
  selectedText,
  onApplyToEditor,
  workId,
  chapterId,
  className,
}) => {
  const [internalOpen, setInternalOpen] = useState(open);
  const isOpen = onOpenChange ? open : internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const {
    settings,
    isDialogOpen,
    setIsDialogOpen,
    handleSave,
  } = useAISettings();

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  // 打开设置
  const handleSettingsClick = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

  // 处理应用到编辑器
  const handleApply = useCallback((text: string) => {
    onApplyToEditor?.(text);}, [onApplyToEditor]);

  return (
    <>
      {/* 切换按钮（始终显示） */}
      <TooltipIconButton
        tooltip={isOpen ? "收起 AI 助手" : "展开 AI 助手"}
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="fixed top-20 right-4 z-40"
      >
        {isOpen ? (
          <PanelRightCloseIcon className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
      </TooltipIconButton>

      {/* 侧边栏 */}
      <div
        className={cn(
          "ai-sidebar fixed top-16 right-0 bottom-0 z-30",
          "bg-background border-l border-border shadow-lg",
          "transition-all duration-300 ease-in-out",
          isOpen ? "w-96translate-x-0" : "w-0 translate-x-full",
          className
        )}>
        {isOpen && (
          <AIAssistantShell
            config={{
              model: settings.model,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,}}
            showThreadList={false}
            compact={true}
            onSettingsClick={handleSettingsClick}
            className="h-full"
          />
        )}</div>

      {/* 设置对话框 */}
      <AISettingsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        settings={settings}
        onSave={handleSave}
      />
    </>
  );
};

// =============================================================================
// Toggle Button Component（可单独使用）
// =============================================================================

interface AISidebarToggleProps {
  open: boolean;
  onToggle: () => void;
  className?: string;
}

export const AISidebarToggle: FC<AISidebarToggleProps> = ({
  open,
  onToggle,
  className,
}) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn("gap-2", className)}
    ><Sparkles className="h-4 w-4" />
      {open ? "收起 AI" : "AI 助手"}
    </Button>
  );
};
