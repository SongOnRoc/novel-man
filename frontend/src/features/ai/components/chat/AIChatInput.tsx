"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Wand2, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIChatInputProps {
  onSend: (text: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  onToolSelect?: (tool: string) => void;
}

export function AIChatInput({
  onSend,
  isLoading,
  placeholder = "输入指令或问题...",
  onToolSelect,
}: AIChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const tools = [
    { id: "polish", icon: Wand2, label: "润色", prompt: "请润色这段文字，使其更生动：" },
    { id: "expand", icon: Sparkles, label: "扩写", prompt: "请扩写这段情节，增加细节：" },
    { id: "character", icon: User, label: "角色", prompt: "请帮我构思一个角色：" },
    { id: "outline", icon: BookOpen, label: "大纲", prompt: "请帮我生成一个章节大纲：" },
  ];

  return (
    <div className="flex flex-col gap-3 bg-transparent">
      {/* Quick Tools */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-image-linear-gradient-to-r">
        {tools.map((tool) => (
          <TooltipProvider key={tool.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 rounded-full border-primary/10 bg-primary/5 text-xs font-medium text-primary hover:bg-primary/10 hover:border-primary/20 transition-all"
                  onClick={() => {
                    if (onToolSelect) {
                      onToolSelect(tool.id);
                    } else {
                      setInput(tool.prompt);
                      textareaRef.current?.focus();
                    }
                  }}
                >
                  <tool.icon className="h-3 w-3" />
                  {tool.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>使用{tool.label}工具</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="relative flex items-end gap-2 rounded-2xl border border-white/20 bg-white/40 dark:bg-black/20 p-2 shadow-inner focus-within:border-primary/50 focus-within:bg-background/60 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-[200px] min-h-[44px] flex-1 resize-none border-0 bg-transparent p-2.5 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50"
          rows={1}
        />
        <Button
          size="icon"
          className={`h-9 w-9 shrink-0 rounded-xl transition-all duration-300 ${
            input.trim() 
              ? "bg-primary text-primary-foreground shadow-lg scale-100" 
              : "bg-muted text-muted-foreground scale-90 opacity-70"
          }`}
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">发送</span>
        </Button>
      </div>
      <div className="text-center text-[10px] text-muted-foreground/40 font-medium tracking-wide">
        AI生成内容仅供参考
      </div>
    </div>
  );
}
