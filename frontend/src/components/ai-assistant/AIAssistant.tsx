"use client";

import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { useAIAssistant } from "@/hooks";
import { AIGenerateParams } from "@/types/ai";
import { cn } from "@/lib/utils";
import { Loader, Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface AIAssistantProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  compact?: boolean;
  className?: string;
}

export const LoadingIndicator = () => (
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
}: AIAssistantProps) {
  const {
    isLoading,
    response,
    history,
    style,
    setStyle,
    isPersonalized,
    setIsPersonalized,
    generateResponse,
    regenerateResponse,
    clearResponse,
    applyFromHistory,
    hasPrompt,
  } = useAIAssistant();

  const handleSubmit = (params: AIGenerateParams) => {
    generateResponse(params);
  };

  const showResponseArea = hasPrompt || response || isLoading;

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
              onRegenerate={regenerateResponse}
              onApplyToEditor={onApplyToEditor}
              onDiscard={clearResponse}
              hasSelection={!!selectedText}
              compact={compact}
            />
            {history.length > 0 && (
              <HistoryTab
                history={history}
                onSelect={applyFromHistory}
                compact={compact}
              />
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4 justify-center">
              ai工具箱
            </h2>
            <AIPromptForm
              onSubmit={handleSubmit}
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
          onSubmit={handleSubmit}
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
          onRegenerate={regenerateResponse}
          onApplyToEditor={onApplyToEditor}
          onDiscard={clearResponse}
          hasSelection={!!selectedText}
          compact={compact}
        />
        {history.length > 0 && (
          <HistoryTab
            history={history}
            onSelect={applyFromHistory}
            compact={compact}
          />
        )}
      </div>
    </div>
  );
}

interface HistoryTabProps {
  history: string[];
  onSelect: (text: string) => void;
  compact?: boolean;
}

const HistoryTab = ({ history, onSelect, compact }: HistoryTabProps) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-8">
      <h3 className={cn("text-lg font-semibold mb-3", compact && "text-base")}>
        最近生成
      </h3>
      <div className="space-y-2">
        {history.filter(Boolean).map((item, index) => (
          <Card key={index} className="p-3 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <p
                className="text-sm text-muted-foreground cursor-pointer flex-grow"
                onClick={() => onSelect(item)}
              >
                {item.substring(0, 80)}...
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleCopy(item, index)}
              >
                {copiedId === index ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
