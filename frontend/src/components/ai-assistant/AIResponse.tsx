"use client";

import { useState } from "react";
import { useDrafts } from "@/hooks/useDrafts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Clipboard,
  Save,
  RefreshCw,
  ArrowUpFromLine,
  Trash2,
  Replace,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingIndicator } from "./AIAssistant";

interface AIResponseProps {
  response: string;
  isLoading: boolean;
  onRegenerate?: () => void;
  onApplyToEditor?: (text: string) => void;
  onDiscard?: () => void;
  hasSelection?: boolean;
  compact?: boolean;
}

export function AIResponse({
  response,
  isLoading,
  onRegenerate,
  onApplyToEditor,
  onDiscard,
  hasSelection = false,
  compact = false,
}: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const { createDraft, isSaving } = useDrafts();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const saveToDraft = async () => {
    if (!response) return;
    try {
      await createDraft(response);
      // In a real app, you'd use a toast notification
      alert("已成功保存到草稿箱！");
    } catch (error) {
      console.error("保存草稿失败:", error);
      alert("保存草稿失败，请稍后再试。");
    }
  };

  const ApplyIcon = hasSelection ? Replace : ArrowUpFromLine;
  const applyText = hasSelection ? "替换" : "插入";

  return (
    <Card
      className={cn(
        "flex flex-col h-full",
        isLoading && "opacity-70",
        compact ? "shadow-none border-0" : ""
      )}
    >
      <CardContent className={cn("flex-grow pt-6", compact && "p-0")}>
        {response ? (
          <Textarea
            value={response}
            readOnly
            className="w-full h-full resize-none font-serif text-base leading-relaxed"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center text-muted-foreground h-full",
              compact ? "min-h-[150px]" : "min-h-[250px]"
            )}
          >
            {isLoading ? <LoadingIndicator /> : "生成的内容将显示在这里"}
          </div>
        )}
      </CardContent>

      {response && (
        <CardFooter
          className={cn(
            "flex justify-between items-center pt-4",
            compact && "px-0 py-2"
          )}
        >
          <div className="flex items-center space-x-2">
            {onApplyToEditor && (
              <Button
                onClick={() => onApplyToEditor(response)}
                disabled={isLoading}
                size={compact ? "sm" : "default"}
              >
                <ApplyIcon className="h-4 w-4 mr-2" />
                {applyText}
              </Button>
            )}
            <Button
              variant="outline"
              size={compact ? "sm" : "icon"}
              onClick={saveToDraft}
              disabled={isLoading || isSaving}
            >
              <Save className="h-4 w-4" />
              <span className="sr-only">保存到草稿</span>
            </Button>
            <Button
              variant="outline"
              size={compact ? "sm" : "icon"}
              onClick={copyToClipboard}
              disabled={isLoading}
            >
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">{copied ? "已复制" : "复制"}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {onDiscard && (
              <Button
                variant="ghost"
                size={compact ? "sm" : "default"}
                onClick={onDiscard}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                放弃
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={onRegenerate}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
