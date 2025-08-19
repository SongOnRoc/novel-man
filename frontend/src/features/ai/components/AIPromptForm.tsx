"use client";

import {
  Sparkles,
  PenSquare,
  Scaling,
  BookText,
  Send,
  UserPlus,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIPromptFormProps {
  onSubmit: (promptType: string, prompt: string, selectedText?: string) => void;
  isLoading: boolean;
  selectedText?: string;
  compact?: boolean;
  style: string;
  onStyleChange: (style: string) => void;
  isPersonalized: boolean;
  onPersonalizedChange: (value: boolean) => void;
}


type QuickAction = {
  type: string; // 使用 string 替代 AIPromptType
  label: string;
  icon: LucideIcon;
  requiresSelection: boolean;
  isPromptBased: boolean; // 新增：是否需要输入框内容
};

const quickActions: QuickAction[] = [
  {
    type: "polish",
    label: "润色",
    icon: Sparkles,
    requiresSelection: true,
    isPromptBased: false,
  },
  {
    type: "completion",
    label: "续写",
    icon: BookText,
    requiresSelection: true,
    isPromptBased: false,
  },
  {
    type: "generate-outline",
    label: "生成大纲",
    icon: FileText,
    requiresSelection: false,
    isPromptBased: true,
  },
  {
    type: "create-character",
    label: "创建角色",
    icon: UserPlus,
    requiresSelection: false,
    isPromptBased: true,
  },
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
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");

  const handleQuickAction = (action: QuickAction) => {
    setActiveAction(action.type);
    if (!action.isPromptBased) {
      // 对于基于选中文本的操作，直接提交
      onSubmit(action.type, "", selectedText);
    }
    // 对于基于prompt的操作，等待用户输入后点击发送按钮
  };

  const getPlaceholder = useMemo(() => {
    const action = quickActions.find((a) => a.type === activeAction);
    if (action) {
      if (action.type === "generate-outline")
        return "请输入作品简介或核心创意...";
      if (action.type === "create-character")
        return "请输入对角色的简单描述，如“一个失忆的剑客”...";
    }
    return "请选择一个功能，然后输入您的需求...";
  }, [activeAction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAction || !prompt.trim()) return;
    onSubmit(activeAction, prompt, selectedText);
  };

  return (
    <Card className={cn("shadow-none border-0", compact && "p-0")}>
      <CardContent className={cn("pt-6", compact && "p-0")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.type}
                variant={activeAction === action.type ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickAction(action)}
                disabled={
                  isLoading || (action.requiresSelection && !selectedText)
                }
                className="flex flex-col h-16"
              >
                <action.icon className="h-5 w-5 mb-1" />
                <span>{action.label}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder={getPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={compact ? 2 : 3}
              disabled={
                isLoading ||
                !quickActions.find((a) => a.type === activeAction)
                  ?.isPromptBased
              }
              className="resize-none"
            />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Select
                  value={style}
                  onValueChange={onStyleChange}
                  disabled={isLoading}
                >
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
                disabled={isLoading || !activeAction || !prompt.trim()}
                aria-label="send"
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
