"use client";

import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AIChatMessage, Message } from "./AIChatMessage";
import { useGenerateStream } from "@/hooks/ai/useAIAssistant";
import { AIContext } from "@/lib/services/ai.service";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Wand2, PenTool, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AIChatInterfaceProps {
  workId?: number;
  characterIds?: number[];
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  className?: string;
  hideBorder?: boolean;
}

export function AIChatInterface({
  workId,
  characterIds,
  selectedText,
  onApplyToEditor,
  className,
  hideBorder = false,
}: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "你好！我是你的 AI 写作助手。请告诉我你需要什么帮助？",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { generate, isLoading, streamingContent, error } = useGenerateStream();
  const [currentAiMsgId, setCurrentAiMsgId] = useState<string | null>(null);

  // Update AI message with streaming content
  useEffect(() => {
    // 如果没有流式内容，什么都不做
    if (!streamingContent) return;

    // 如果还没有当前的 AI 消息 ID，说明这是流式响应的第一个数据块
    // 我们需要创建一个新的消息
    if (!currentAiMsgId) {
      const newMsgId = uuidv4();
      const aiMsg: Message = {
        id: newMsgId,
        role: "assistant",
        content: streamingContent,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentAiMsgId(newMsgId);
    } else {
      // 如果已经有消息 ID，更新该消息的内容
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === currentAiMsgId) {
            return { ...msg, content: streamingContent };
          }
          return msg;
        });
      });
    }
  }, [streamingContent, currentAiMsgId]);

  // Handle stream error
  useEffect(() => {
    if (error && currentAiMsgId) {
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === currentAiMsgId) {
            return {
              ...msg,
              content: msg.content + "\n\n[生成出错，请重试]",
              isError: true,
            };
          }
          return msg;
        });
      });
      setCurrentAiMsgId(null);
    }
  }, [error, currentAiMsgId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, streamingContent]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const text = input.trim();
    setInput("");
    
    // Add user message
    const userMsg: Message = {
      id: uuidv4(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Reset current AI message ID for new generation
    setCurrentAiMsgId(null);

    // Prepare context
    const context: AIContext = {
      work_id: workId,
    };

    let prompt = text;
    let assistantType = "chat"; // Default to chat

    if (text.startsWith("润色") || text.includes("优化")) {
      assistantType = "polish";
      if (selectedText) {
        prompt = selectedText;
      }
    }

    // Start streaming
    generate({
      text: prompt,
      context,
      assistant_type: assistantType,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    if (!selectedText) {
      setInput(`${action}（请先在编辑器中选择文本）`);
      return;
    }
    // For quick actions, we might want to send immediately or just populate input
    // Let's populate input for now so user can confirm
    setInput(`${action}：\n${selectedText}`);
  };

  return (
    <div className={cn("flex flex-col h-full w-full overflow-hidden bg-transparent", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full p-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-6 pb-4 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground/60 space-y-4 mt-20">
                <div className="p-4 rounded-full bg-primary/5 mb-2 ring-1 ring-primary/10">
                    <Sparkles className="h-8 w-8 text-primary/60" />
                </div>
                <p className="text-sm font-medium">AI 助手准备就绪</p>
                <p className="text-xs max-w-[200px]">
                  选中编辑器中的文本，或直接在此处提问。
                </p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <AIChatMessage
                      message={msg}
                      onInsert={onApplyToEditor}
                      onCopy={(content) => navigator.clipboard.writeText(content)}
                      onOptionSelect={(option) => onApplyToEditor?.(option)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            {isLoading && !currentAiMsgId && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/10 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground font-medium">AI 正在思考...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="p-4 z-10">
        <div className="relative flex flex-col gap-2 p-3 bg-background/40 backdrop-blur-md border border-border/10 rounded-[1.5rem] shadow-lg hover:shadow-xl transition-all duration-300 group-focus-within:bg-background/60">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入指令或问题..."
            className="min-h-[44px] max-h-[120px] w-full resize-none border-0 bg-transparent px-2 py-1 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/50 scrollbar-hide"
            rows={1}
          />
          
          <div className="flex items-center justify-between pt-2 border-t border-border/5">
             {/* Quick Actions */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide mask-linear-fade max-w-[calc(100%-40px)]">
                {[
                  { label: "润色", icon: Sparkles },
                  { label: "续写", icon: PenTool },
                  { label: "分析", icon: BookOpen },
                  { label: "扩写", icon: Wand2 }
                ].map((action) => (
                    <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.label)}
                        className="flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded-full bg-primary/5 hover:bg-primary/10 text-[10px] text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                        <action.icon className="h-3 w-3" />
                        {action.label}
                    </button>
                ))}
            </div>

            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "h-8 w-8 rounded-full shrink-0 transition-all duration-300 shadow-sm",
                input.trim() 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-primary/25" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
