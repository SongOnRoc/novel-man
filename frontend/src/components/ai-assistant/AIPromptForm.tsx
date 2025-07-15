"use client";

import { useState, useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  PenSquare,
  Scaling,
  Check,
  BookText,
  Send,
  Icon,
  Edit,
} from "lucide-react";
import { AIPromptType, AIGenerateParams } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AIPromptFormProps {
  onSubmit: (params: AIGenerateParams) => void;
  isLoading: boolean;
  selectedText?: string;
  compact?: boolean;
  style: string;
  onStyleChange: (style: string) => void;
  isPersonalized: boolean;
  onPersonalizedChange: (value: boolean) => void;
}

import type { LucideIcon } from "lucide-react";

type QuickAction = {
  type: AIPromptType;
  label: string;
  icon: LucideIcon;
  requiresSelection: boolean;
};

const quickActions: QuickAction[] = [
  { type: "expand", label: "扩写", icon: Sparkles, requiresSelection: true },
  { type: "rewrite", label: "改写", icon: PenSquare, requiresSelection: true },
  { type: "summarize", label: "缩写", icon: Scaling, requiresSelection: true },
  { type: "correct", label: "纠错", icon: Check, requiresSelection: true },
  { type: "continue", label: "续写", icon: BookText, requiresSelection: false },
  { type: "custom", label: "自定义", icon: Edit, requiresSelection: false },
];

const styleOptions = [
  { value: "default", label: "默认风格" },
  { value: "gufeng", label: "古风" },
  { value: "xiandai", label: "现代" },
  { value: "kehuan", label: "科幻" },
];

export function AIPromptForm({
  onSubmit,
  isLoading,
  selectedText,
  compact = false,
  style,
  onStyleChange,
  isPersonalized,
  onPersonalizedChange,
}: AIPromptFormProps) {
  const [promptType, setPromptType] = useState<AIPromptType>("custom");
  const [prompt, setPrompt] = useState<string>("");

  const handleQuickAction = (type: AIPromptType) => {
    setPromptType(type);
    // 如果是需要选中文本的快捷操作，但没有选中文本，则不提交
    const action = quickActions.find((a) => a.type === type);
    if (action?.requiresSelection && !selectedText) {
      return;
    }
    // 对于不需要额外输入的快捷操作，可以直接提交
    if (type !== "continue") {
      handleSubmit(null, type);
    }
  };

  const getPlaceholder = useMemo(() => {
    switch (promptType) {
      case "continue":
        return "（选填）请输入后续剧情简述...";
      case "expand":
        return "已选择“扩写”，可直接生成或输入补充要求...";
      case "rewrite":
        return "已选择“改写”，可直接生成或输入补充要求...";
      case "summarize":
        return "已选择“缩写”，可直接生成或输入补充要求...";
      case "correct":
        return "已选择“纠错”，可直接生成...";
      default:
        return "请描述您的需求，或选择上方快捷功能...";
    }
  }, [promptType]);

  const handleSubmit = (
    e: React.FormEvent | null,
    typeOverride?: AIPromptType
  ) => {
    e?.preventDefault();
    const finalPromptType = typeOverride || promptType;
    if (prompt.trim() || selectedText || finalPromptType !== "custom") {
      onSubmit({
        promptType: finalPromptType,
        prompt,
        selectedText,
      });
    }
  };

  return (
    <Card className={cn("shadow-none border-0", compact && "p-0")}>
      <CardContent className={cn("pt-6", compact && "p-0")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {quickActions.map(
              ({ type, label, icon: Icon, requiresSelection }) => (
                <Button
                  key={type}
                  variant={promptType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickAction(type)}
                  disabled={isLoading || (requiresSelection && !selectedText)}
                  className="flex flex-col h-16"
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span>{label}</span>
                </Button>
              )
            )}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder={getPlaceholder}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setPromptType("custom");
              }}
              rows={compact ? 1 : 2}
              disabled={isLoading}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(null);
                }
              }}
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Select value={style} onValueChange={onStyleChange} disabled={isLoading}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="选择风格" />
                  </SelectTrigger>
                  <SelectContent>
                    {styleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="personalized-switch"
                    checked={isPersonalized}
                    onCheckedChange={onPersonalizedChange}
                    disabled={isLoading}
                  />
                  <Label htmlFor="personalized-switch">个性化建议</Label>
                </div>
              </div>
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                disabled={isLoading || (!prompt.trim() && !selectedText)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
