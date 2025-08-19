"use client";

import { Loader } from "lucide-react";
import React, { useState } from "react";

import {
  usePolishTextMutation,
  useGetCompletionMutation,
  useGenerateOutlineMutation,
  useCreateCharacterMutation,
} from "@/hooks/ai/useAIAssistant";
import { cn } from "@/lib/utils";
import {
  AIContext,
  CompletionResponse,
  CreateCharacterResponse,
  GenerateOutlineResponse,
  PolishResponse,
} from "@/lib/services/ai.service";

import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";

interface AIAssistantProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  compact?: boolean;
  className?: string;
  // 新增：传递上下文
  workId?: number;
  characterIds?: number[];
}

export const LoadingIndicator = (): React.ReactElement => (
  <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-muted-foreground">
    <Loader className="h-8 w-8 animate-spin mb-4" />
    <p className="text-lg">AI 正在思考中...</p>
    <p className="text-sm">这可能需要一点时间，请稍候</p>
  </div>
);

export function AIAssistant({
  selectedText,
  onApplyToEditor,
  compact = false,
  className = "",
  workId,
  characterIds,
}: AIAssistantProps): React.ReactElement {
  const [style, setStyle] = useState("default");
  const [isPersonalized, setIsPersonalized] = useState(false);

  const polishMutation = usePolishTextMutation();
  const getCompletionMutation = useGetCompletionMutation();
  const generateOutlineMutation = useGenerateOutlineMutation();
  const createCharacterMutation = useCreateCharacterMutation();

  const isLoading =
    polishMutation.isPending ||
    getCompletionMutation.isPending ||
    generateOutlineMutation.isPending ||
    createCharacterMutation.isPending;

  const getResponseContent = () => {
    if (polishMutation.data) return polishMutation.data.polished_text;
    if (getCompletionMutation.data)
      return getCompletionMutation.data.completion;
    if (generateOutlineMutation.data)
      return generateOutlineMutation.data.outline;
    if (createCharacterMutation.data) {
      const { name, background_story, personality_desc } =
        createCharacterMutation.data;
      return `### ${name}\n\n**背景:**\n${background_story}\n\n**性格:**\n${personality_desc}`;
    }
    return undefined;
  };

  const response = getResponseContent();

  const handleSubmit = (
    promptType: string,
    prompt: string,
    currentSelectedText?: string
  ) => {
    const context: AIContext = {
      work_id: workId,
      character_ids: isPersonalized ? characterIds : undefined,
      style_preference: style !== "default" ? style : undefined,
    };

    const textForRequest = currentSelectedText || selectedText || "";

    switch (promptType) {
      case "polish":
        polishMutation.mutate({ text: textForRequest, context });
        break;
      case "completion":
        getCompletionMutation.mutate({ text: textForRequest, context });
        break;
      case "generate-outline":
        generateOutlineMutation.mutate({ text: prompt, context });
        break;
      case "create-character":
        createCharacterMutation.mutate({ description: prompt, context });
        break;
      default:
        // 默认行为可以是润色或根据 prompt 自定义
        if (textForRequest) {
          getCompletionMutation.mutate({ text: textForRequest, context });
        }
        break;
    }
  };

  const clearResponse = () => {
    polishMutation.reset();
    getCompletionMutation.reset();
    generateOutlineMutation.reset();
    createCharacterMutation.reset();
  };

  const showResponseArea = response || isLoading;

  // Compact view for floating button (Drawer)
  if (compact) {
    return (
      <div className={cn("w-full", className)}>
        {showResponseArea ? (
          <>
            <h2 className="text-lg font-semibold mb-4">AI 响应</h2>
            <AIResponse
              response={response}
              isLoading={isLoading}
              onRegenerate={() => handleSubmit("polish", "", selectedText)}
              onApplyToEditor={onApplyToEditor}
              onDiscard={clearResponse}
              hasSelection={!!selectedText}
              compact={compact}
            />
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4 justify-center">
              ai工具箱
            </h2>
            <AIPromptForm
              onSubmit={(promptType, prompt) =>
                handleSubmit(promptType, prompt, selectedText)
              }
              isLoading={isLoading}
              selectedText={selectedText}
              compact={compact}
              style={style}
              onStyleChange={setStyle}
              isPersonalized={isPersonalized}
              onPersonalizedChange={setIsPersonalized}
            />
          </>
        )}
      </div>
    );
  }

  // Standalone page view
  return (
    <div className={cn("grid lg:grid-cols-2 gap-8", className)}>
      <div>
        <h2 className="text-xl font-semibold mb-4">ai工具箱</h2>
        <AIPromptForm
          onSubmit={(promptType, prompt) =>
            handleSubmit(promptType, prompt, selectedText)
          }
          isLoading={isLoading}
          selectedText={selectedText}
          compact={compact}
          style={style}
          onStyleChange={setStyle}
          isPersonalized={isPersonalized}
          onPersonalizedChange={setIsPersonalized}
        />
      </div>
      <div>
        <h2 className="text-xl font-semibold mb-4">AI 响应</h2>
        <AIResponse
          response={response}
          isLoading={isLoading}
          onRegenerate={() => handleSubmit("polish", "", selectedText)}
          onApplyToEditor={onApplyToEditor}
          onDiscard={clearResponse}
          hasSelection={!!selectedText}
          compact={compact}
        />
      </div>
    </div>
  );
}
