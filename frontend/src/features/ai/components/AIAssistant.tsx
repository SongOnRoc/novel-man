import React from "react";
import { cn } from "@/lib/utils";
import { AIChatInterface } from "./chat/AIChatInterface";

interface AIAssistantProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  compact?: boolean;
  className?: string;
  workId?: number;
  characterIds?: number[];
}

export function AIAssistant({
  selectedText,
  onApplyToEditor,
  compact = false,
  className = "",
  workId,
  characterIds,
}: AIAssistantProps): React.ReactElement {
  return (
    <div className={cn("h-full w-full", className)}>
      <AIChatInterface
        workId={workId}
        characterIds={characterIds}
        selectedText={selectedText}
        onApplyToEditor={onApplyToEditor}
        className="h-full"
      />
    </div>
  );
}

