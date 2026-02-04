"use client";

import { type FC, useState } from "react";
import { MoreHorizontal, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useQuickActionPrompts,
  type QuickActionPrompt,
} from "./useQuickActionPrompts";

// =============================================================================
// Types
// =============================================================================

interface PromptSelectorProps {
  /**当前选中的提示词ID */
  selectedPromptId: number | null;
  /** 选中提示词的回调 */
  onSelectPrompt: (id: number | null) => void;
  /** 默认显示的快捷按钮数量 */
  visibleCount?: number;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// Default Quick Actions (fallback when no prompts loaded)
// =============================================================================

const defaultQuickActions: QuickActionPrompt[] = [
  { id: 10, title: "润色", description: "优化文字表达", primaryTag: "polish" },
  { id: 11, title: "续写", description: "继续写作", primaryTag: "continue" },
  { id: 12, title: "分析", description: "分析文本内容", primaryTag: "analyze" },
  { id: 13, title: "扩写", description: "扩展内容", primaryTag: "expand" },
];

// =============================================================================
// Prompt Button Component
// =============================================================================

interface PromptButtonProps {
  prompt: QuickActionPrompt;
  isSelected: boolean;
  onClick: () => void;
  size?: "sm" | "default";
}

const PromptButton: FC<PromptButtonProps> = ({
  prompt,
  isSelected,
  onClick,
  size = "sm",
}) => {
  return (
    <button
      onClick={onClick}
      title={prompt.description}
      className={cn(
        "flex items-center gap-1 whitespace-nowrap rounded-full transition-colors duration-200 cursor-pointer",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        isSelected
          ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
          : "bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary"
      )}
    >
      {isSelected && <Check className="h-3 w-3" />}
      <Sparkles className={cn("h-3 w-3", isSelected && "hidden")} />
      {prompt.title}
    </button>
  );
};

// =============================================================================
// Prompt List in Dropdown/Drawer
// =============================================================================

interface PromptListProps {
  prompts: QuickActionPrompt[];
  selectedPromptId: number | null;
  onSelect: (id: number | null) => void;
}

const PromptList: FC<PromptListProps> = ({
  prompts,
  selectedPromptId,
  onSelect,
}) => {
  return (
    <div className="flex flex-col gap-1 p-2">
      {prompts.map((prompt) => (
        <button
          key={prompt.id}
          onClick={() =>
            onSelect(selectedPromptId === prompt.id ? null : prompt.id)
          }
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left transition-colors",
            selectedPromptId === prompt.id
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted text-foreground"
          )}
        >
          {selectedPromptId === prompt.id ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{prompt.title}</span>
            {prompt.description && (
              <span className="text-xs text-muted-foreground truncate">
                {prompt.description}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

// =============================================================================
// Desktop Popover More Menu
// =============================================================================

interface MoreMenuPopoverProps {
  prompts: QuickActionPrompt[];
  selectedPromptId: number | null;
  onSelect: (id: number | null) => void;
}

const MoreMenuPopover: FC<MoreMenuPopoverProps> = ({
  prompts,
  selectedPromptId,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: number | null) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">更多提示词</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="py-2 px-3 border-b">
          <h4 className="text-sm font-medium">选择提示词</h4>
        </div>
        <ScrollArea className="max-h-64">
          <PromptList
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            onSelect={handleSelect}
          />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// =============================================================================
// Mobile Drawer More Menu
// =============================================================================

interface MoreMenuDrawerProps {
  prompts: QuickActionPrompt[];
  selectedPromptId: number | null;
  onSelect: (id: number | null) => void;
}

const MoreMenuDrawer: FC<MoreMenuDrawerProps> = ({
  prompts,
  selectedPromptId,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: number | null) => {
    onSelect(id);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 rounded-full hover:bg-primary/10"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">更多提示词</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>选择提示词</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="max-h-[60vh] pb-6">
          <PromptList
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            onSelect={handleSelect}
          />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};

// =============================================================================
// Main PromptSelector Component
// =============================================================================

export const PromptSelector: FC<PromptSelectorProps> = ({
  selectedPromptId,
  onSelectPrompt,
  visibleCount = 4,
  isMobile = false,
  className,
}) => {
  const { prompts, isLoading } = useQuickActionPrompts();

  // 使用获取到的提示词，如果为空则使用默认快捷操作
  const displayPrompts = prompts.length > 0 ? prompts : defaultQuickActions;

  // 分割为可见和隐藏的提示词
  const visiblePrompts = displayPrompts.slice(0, visibleCount);
  const hasMore = displayPrompts.length > visibleCount;

  const handlePromptClick = (promptId: number) => {
    // 如果已选中则取消选中，否则选中
    onSelectPrompt(selectedPromptId === promptId ? null : promptId);
  };

  if (isLoading) {
    return (
      <div className={cn("flex gap-1", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-6 w-12 rounded-full bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-1 items-center overflow-x-auto scrollbar-hide",
        className
      )}
    >
      {visiblePrompts.map((prompt) => (
        <PromptButton
          key={prompt.id}
          prompt={prompt}
          isSelected={selectedPromptId === prompt.id}
          onClick={() => handlePromptClick(prompt.id)}
        />
      ))}

      {hasMore &&
        (isMobile ? (
          <MoreMenuDrawer
            prompts={displayPrompts}
            selectedPromptId={selectedPromptId}
            onSelect={onSelectPrompt}
          />
        ) : (
          <MoreMenuPopover
            prompts={displayPrompts}
            selectedPromptId={selectedPromptId}
            onSelect={onSelectPrompt}
          />
        ))}
    </div>
  );
};

export default PromptSelector;
