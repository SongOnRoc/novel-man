"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { Copy, RefreshCw, Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isError?: boolean;
  options?: string[]; // For multi-choice responses
}

interface AIChatMessageProps {
  message: Message;
  onCopy?: (content: string) => void;
  onInsert?: (content: string) => void;
  onRegenerate?: () => void;
  onOptionSelect?: (option: string) => void;
}

export function AIChatMessage({
  message,
  onCopy,
  onInsert,
  onRegenerate,
  onOptionSelect,
}: AIChatMessageProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm transition-transform hover:scale-105",
        isUser 
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground ring-2 ring-primary/20" 
          : "bg-gradient-to-br from-muted to-muted/50 text-muted-foreground border border-white/10 ring-1 ring-white/20"
      )}>
        {isUser ? <div className="h-4 w-4 rounded-full border-2 border-current opacity-80" /> : <Sparkles className="h-4 w-4 text-primary/70" />}
      </div>

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-5 py-3.5 text-sm shadow-sm transition-all duration-200 backdrop-blur-sm",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-sm shadow-primary/10"
              : "bg-muted/80 border border-border/50 text-foreground rounded-tl-sm shadow-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed prose-p:my-1 prose-headings:my-2 prose-strong:text-foreground/90">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Multi-option selection */}
        {!isUser && message.options && message.options.length > 0 && (
           <div className="flex flex-col gap-2 w-full mt-1">
             {message.options.map((option, idx) => (
               <Button
                 key={idx}
                 variant="outline"
                 className="justify-start h-auto py-3 px-4 text-left text-sm whitespace-normal bg-white/50 hover:bg-primary/5 hover:border-primary/30 transition-all shadow-sm hover:shadow-md border-white/20"
                 onClick={() => onOptionSelect?.(option)}
               >
                 <span className="mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary font-bold">
                   {idx + 1}
                 </span>
                 {option}
               </Button>
             ))}
           </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/50"
              onClick={handleCopy}
              title="复制"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {onInsert && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/50"
                onClick={() => onInsert(message.content)}
                title="插入编辑器"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/50"
                onClick={onRegenerate}
                title="重新生成"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
