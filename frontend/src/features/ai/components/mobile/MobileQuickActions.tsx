"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { PromptSelector } from "@/features/ai/components/prompt-selector/PromptSelector";

interface MobileQuickActionsProps {
  /** 当前选中的提示词 ID */
  selectedPromptId: number | null;
  /** 选中提示词的回调 */
  onSelectPrompt: (id: number | null) => void;
  /** Maximum number of actions to show */
  maxActions?: number;
  /** Custom class name */
  className?: string;
}

/**
 * Mobile Quick Actions
 *
 * A row of quick action buttons for common AI operations.
 * Uses PromptSelector for dynamic prompt selection.
 */
export function MobileQuickActions({
  selectedPromptId,
  onSelectPrompt,
  maxActions = 3,
  className,
}: MobileQuickActionsProps) {
  return (
    <div className={cn("flex items-center shrink-0", className)}>
      <PromptSelector
        selectedPromptId={selectedPromptId}
        onSelectPrompt={onSelectPrompt}
        isMobile={true}
      />
    </div>
  );
}

export default MobileQuickActions;
