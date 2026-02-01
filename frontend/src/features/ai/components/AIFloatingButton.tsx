"use client";

import { Sparkles } from "lucide-react";
import { useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { AIAssistantShell } from "@/components/assistant-ui/ai-assistant-shell";
import {
  AISettingsDialog,
  useAISettings,
} from "@/components/assistant-ui/ai-settings-dialog";

interface AIFloatingButtonProps {
  /** 编辑器中选中的文本 */
  selectedText?: string;
  /** 将AI 生成内容应用到编辑器的回调 */
  onApplyToEditor?: (text: string) => void;
  /** 当前作品ID（用于上下文） */
  workId?: number;
  /** 当前章节 ID（用于上下文） */
  chapterId?: number;
}

/**
 * AI悬浮按钮组件
 * 
 * 点击后展开底部抽屉，显示精简版的 AI 助手界面（无线程列表）。
 * 支持选中文本上下文传递和"应用到编辑器"功能。
 */
export function AIFloatingButton({
  selectedText,
  onApplyToEditor,
  workId,
  chapterId,
}: AIFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    settings,
    isDialogOpen,
    setIsDialogOpen,
    handleSave,
  } = useAISettings();

  // 处理应用到编辑器
  const handleApply = useCallback((text: string) => {
    onApplyToEditor?.(text);
    setIsOpen(false);
  }, [onApplyToEditor]);

  // 打开设置
  const handleSettingsClick = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

  return (
    <><Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="default"
            className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
            aria-label="打开 AI 助手"
          >
            <Sparkles className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>AI 写作助手</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <AIAssistantShell
              config={{
                model: settings.model,
                temperature: settings.temperature,
                maxTokens: settings.maxTokens,
              }}
              showThreadList={false}
              compact={true}
              onSettingsClick={handleSettingsClick}
              className="h-full"
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* 设置对话框 */}
      <AISettingsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        settings={settings}
        onSave={handleSave}
      />
    </>
  );
}
