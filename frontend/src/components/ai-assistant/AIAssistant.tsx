"use client";

import { useState } from "react";
import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { useAIAssistant } from "@/hooks";
import { AIPromptType } from "@/types/ai";

/**
 * 完整AI助手组件的属性类型
 */
interface AIAssistantProps {
  selectedText?: string;
  onApplyText?: (text: string) => void;
  compact?: boolean;
  className?: string;
}

/**
 * 完整的AI助手组件
 * 包含提示表单和响应显示，可在页面中嵌入使用
 */
export function AIAssistant({
  selectedText,
  onApplyText,
  compact = false,
  className = "",
}: AIAssistantProps) {
  const { isLoading, response, generateResponse, regenerateResponse } =
    useAIAssistant();

  // 处理表单提交
  const handleSubmit = (promptType: AIPromptType, prompt: string) => {
    generateResponse(promptType, prompt, selectedText);
  };

  return (
    <div
      className={`grid gap-8 ${
        compact ? "grid-cols-1" : "md:grid-cols-2"
      } ${className}`}
    >
      {/* 左侧：提示输入表单 */}
      <div>
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold mb-4`}>
          您的需求
        </h2>
        <AIPromptForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          selectedText={selectedText}
          compact={compact}
        />
      </div>

      {/* 右侧：AI响应 */}
      <div>
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold mb-4`}>
          AI响应
        </h2>
        <AIResponse
          response={response}
          isLoading={isLoading}
          onRegenerate={regenerateResponse}
          onApplyToEditor={onApplyText}
          compact={compact}
        />
      </div>
    </div>
  );
}
