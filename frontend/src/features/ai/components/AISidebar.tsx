"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { AIAssistant } from "./AIAssistant";

interface AISidebarProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  onClose: () => void;
}

export function AISidebar({
  selectedText,
  onApplyToEditor,
  onClose,
}: AISidebarProps) {
  const handleApply = (text: string) => {
    onApplyToEditor?.(text);
    onClose();
  };

  return (
    <div
      className="flex flex-col w-96 bg-card/60 backdrop-blur-xl border-y border-r border-white/10 overflow-hidden"
      style={{
        boxShadow:
          "0 4px 10px rgba(0, 0, 0, 0.1), 4px 4px 10px rgba(0, 0, 0, 0.1)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
        borderTopRightRadius: "1rem"
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
        <h2 className="text-lg font-semibold">AI 写作助手</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <AIAssistant
            selectedText={selectedText}
            onApplyToEditor={handleApply}
            compact={true}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
