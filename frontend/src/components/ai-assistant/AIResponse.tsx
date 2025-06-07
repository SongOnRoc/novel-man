"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Save, RefreshCw, ArrowUpFromLine } from "lucide-react";

// 定义AIResponse组件的属性类型
interface AIResponseProps {
  response: string;
  isLoading: boolean;
  onRegenerate?: () => void;
  onApplyToEditor?: (text: string) => void; // 应用到编辑器的回调
  compact?: boolean; // 是否使用紧凑布局
}

/**
 * AI响应组件
 * 展示AI生成的内容并提供互动功能
 */
export function AIResponse({
  response,
  isLoading,
  onRegenerate,
  onApplyToEditor,
  compact = false,
}: AIResponseProps) {
  // 状态管理
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // 复制文本到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  // 保存到草稿
  const saveToDraft = () => {
    // 模拟保存到草稿的功能
    // 实际应用中应该调用API保存到后端
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // 这里只是模拟，实际实现需要与后端API交互
    console.log("保存到草稿:", response);

    // 显示成功消息（在实际应用中可以使用Toast通知）
    alert("已保存到草稿箱");
  };

  return (
    <Card
      className={`${isLoading ? "opacity-70" : ""} ${
        compact ? "shadow-none border-0" : ""
      }`}
    >
      <CardContent className={compact ? "p-0" : "pt-6"}>
        {response ? (
          <div className="prose max-w-none dark:prose-invert">
            <Textarea
              value={response}
              readOnly
              rows={compact ? 6 : 12}
              className="resize-none font-serif text-base leading-relaxed"
            />
          </div>
        ) : (
          <div
            className={`flex items-center justify-center text-muted-foreground ${
              compact ? "h-[100px]" : "h-[200px]"
            }`}
          >
            {isLoading ? "AI正在生成内容..." : "生成的内容将显示在这里"}
          </div>
        )}
      </CardContent>

      {response && (
        <CardFooter
          className={`flex justify-between ${compact ? "px-0 py-2" : ""}`}
        >
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={copyToClipboard}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制"}
            </Button>

            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={saveToDraft}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              {saved ? "已保存" : "保存到草稿"}
            </Button>

            {onApplyToEditor && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => onApplyToEditor(response)}
                disabled={isLoading}
                className={compact ? "h-8 text-xs" : ""}
              >
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                应用到编辑器
              </Button>
            )}
          </div>

          {onRegenerate && (
            <Button
              variant="ghost"
              size={compact ? "sm" : "default"}
              onClick={onRegenerate}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新生成
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
