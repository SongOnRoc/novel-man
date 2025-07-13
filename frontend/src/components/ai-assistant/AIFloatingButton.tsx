"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { useAIAssistant } from "@/hooks";
import { AIGenerateParams, AIPromptType } from "@/types/ai";
import { Sparkles } from "lucide-react";

/**
 * AI悬浮按钮组件的属性类型
 */
interface AIFloatingButtonProps {
  // 获取编辑器当前选中文本的函数
  getSelectedText?: () => string;
  // 将文本应用到编辑器的函数
  applyTextToEditor?: (text: string) => void;
  // 上下文信息，如当前章节、作品等
  context?: string;
}

/**
 * AI悬浮助手按钮组件
 * 提供快速访问AI助手的悬浮按钮，点击后显示小型AI助手面板
 */
export function AIFloatingButton({
  getSelectedText,
  applyTextToEditor,
  context,
}: AIFloatingButtonProps) {
  // 控制弹出面板显示状态
  const [isOpen, setIsOpen] = useState(false);
  // 使用AI助手hook
  const { isLoading, response, generateResponse, regenerateResponse } =
    useAIAssistant();

  // 当前选中的文本
  const [selectedText, setSelectedText] = useState<string>("");

  // 处理弹出框打开
  const handlePopoverOpen = () => {
    // 如果提供了获取选中文本的函数，则调用它
    if (getSelectedText) {
      const text = getSelectedText();
      setSelectedText(text);
    }

    setIsOpen(true);
  };

  // 提交AI请求
  const handleSubmit = async (params: AIGenerateParams) => {
    await generateResponse(params);
  };

  // 应用AI生成的文本到编辑器
  const handleApplyToEditor = (text: string) => {
    if (applyTextToEditor) {
      applyTextToEditor(text);
      setIsOpen(false); // 关闭弹出框
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          onClick={handlePopoverOpen}
          variant="outline"
          size="icon"
          className="rounded-full shadow-md fixed bottom-6 right-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">AI写作助手</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              关闭
            </Button>
          </div>

          <AIPromptForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            selectedText={selectedText}
            initialPromptType={selectedText ? "rewrite" : "plot-idea"}
            compact={true}
          />

          <AIResponse
            response={response}
            isLoading={isLoading}
            onRegenerate={regenerateResponse}
            onApplyToEditor={handleApplyToEditor}
            compact={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
