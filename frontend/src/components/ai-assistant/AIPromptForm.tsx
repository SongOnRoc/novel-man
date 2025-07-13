"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AIPromptType,
  promptTypeOptions,
  AIWritingStyle,
  writingStyleOptions,
  AIGenerateParams,
} from "@/types/ai";

// 定义AIPromptForm组件的属性类型
interface AIPromptFormProps {
  onSubmit: (params: AIGenerateParams) => void;
  isLoading: boolean;
  selectedText?: string; // 从编辑器选中的文本
  initialPromptType?: AIPromptType; // 初始提示类型
  compact?: boolean; // 是否使用紧凑布局
}

/**
 * AI提示表单组件
 * 允许用户选择AI辅助类型并输入需求
 */
export function AIPromptForm({
  onSubmit,
  isLoading,
  selectedText,
  initialPromptType = "plot-idea",
  compact = false,
}: AIPromptFormProps) {
  // 状态管理
  const [promptType, setPromptType] = useState<AIPromptType>(initialPromptType);
  const [prompt, setPrompt] = useState<string>("");
  const [writingStyle, setWritingStyle] = useState<AIWritingStyle>("formal");

  // 根据选中的提示类型生成占位符文本
  const getPlaceholder = () => {
    switch (promptType) {
      case "expand":
        return "请扩写选中的文本，增加更多细节和描述...";
      case "summarize":
        return "请总结选中的文本，保留核心内容...";
      case "rewrite":
        return "请改写选中的文本，使用不同的表达方式...";
      case "plot-idea":
        return "我需要构思一个修仙小说的情节，主角遇到了...";
      case "character-design":
        return "我想创建一个性格复杂的反派角色，他有什么样的背景和动机...";
      case "world-building":
        return "我正在构建一个架空的古代世界，需要设计其社会制度和文化...";
      case "dialogue":
        return "我需要两个角色之间的对话，一个是老师，一个是学生，讨论...";
      case "text-polish":
        return "请帮我优化以下文本，使其更生动、更有文学性...";
      default:
        return "请描述您的需求...";
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || selectedText) {
      onSubmit({
        promptType,
        prompt,
        writingStyle,
        selectedText,
      });
    }
  };

  // 选中文本提示
  const selectedTextHint = selectedText
    ? `您已选择${selectedText.length}个字符的文本进行${
        promptTypeOptions.find((opt) => opt.value === promptType)?.label ||
        "处理"
      }`
    : null;

  return (
    <Card className={compact ? "shadow-none border-0" : ""}>
      <CardContent className={compact ? "p-0" : "pt-6"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 提示类型选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择辅助类型</label>
            <Select
              value={promptType}
              onValueChange={(value) => setPromptType(value as AIPromptType)}
              disabled={isLoading}
            >
              <SelectTrigger className={compact ? "h-8 text-sm" : ""}>
                <SelectValue placeholder="选择提示类型" />
              </SelectTrigger>
              <SelectContent>
                {promptTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 写作风格选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择写作风格</label>
            <Select
              value={writingStyle}
              onValueChange={(value) =>
                setWritingStyle(value as AIWritingStyle)
              }
              disabled={isLoading}
            >
              <SelectTrigger className={compact ? "h-8 text-sm" : ""}>
                <SelectValue placeholder="选择写作风格" />
              </SelectTrigger>
              <SelectContent>
                {writingStyleOptions.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 选中文本提示 */}
          {selectedTextHint && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {selectedTextHint}
            </div>
          )}

          {/* 提示输入框 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">输入您的需求</label>
            <Textarea
              placeholder={getPlaceholder()}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={compact ? 3 : 6}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <Button
            type="submit"
            disabled={isLoading || (!prompt.trim() && !selectedText)}
            className={compact ? "h-8 text-sm" : ""}
          >
            {isLoading ? "生成中..." : "生成内容"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
