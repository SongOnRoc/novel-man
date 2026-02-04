"use client";

import { Check, Eye, Sparkles } from "lucide-react";
import { type FC, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { PromptListContainer } from "./PromptListContainer";
import { PromptPreviewCard } from "./PromptPreviewCard";
import { PromptSearchInput } from "./PromptSearchInput";
import { useAllPrompts, type PromptWithFavorite } from "./useAllPrompts";

// =============================================================================
// Types
// =============================================================================

interface PromptSelectorProps {
  /** 当前选中的提示词ID */
  selectedPromptId: number | null;
  /** 选中提示词的回调 */
  onSelectPrompt: (id: number | null) => void;
  /** 是否为移动端 */
  isMobile?: boolean;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// Default Built-in Prompt IDs (内置提示词 ID 列表)
// =============================================================================

const BUILT_IN_PROMPT_IDS = [10, 11, 12, 13];
// =============================================================================
// Main PromptSelector Component
// =============================================================================

export const PromptSelector: FC<PromptSelectorProps> = ({
  selectedPromptId,
  onSelectPrompt,
  isMobile = false,
  className,
}) => {
  const [searchKeyword, setSearchKeyword] = useState("");

  // 获取所有提示词，包含收藏功能
  const {
    prompts: allPrompts,
    isLoading,
    toggleFavorite,
    isAddingFavorite,
    isRemovingFavorite,
    isFavoriteAvailable,
  } = useAllPrompts();

  // 获取当前选中的提示词信息
  const selectedPrompt = selectedPromptId
    ? allPrompts.find((p) => p.id === selectedPromptId)
    : null;

  const handleSearchChange = useCallback((value: string) => {
    setSearchKeyword(value);
  }, []);

  const handleToggleFavorite = useCallback(
    async (promptId: number) => {
      await toggleFavorite(promptId);
    },
    [toggleFavorite]
  );

      if (isLoading) {
      return (
        <div
          className={cn("h-8 w-32 rounded-lg bg-muted animate-pulse", className)}
        />
      );
    }

  // 根据设备类型渲染不同的选择器入口
  if (isMobile) {
    return (
      <MobileSelectorTrigger
        selectedPrompt={selectedPrompt}
        prompts={allPrompts}
        selectedPromptId={selectedPromptId}
        searchKeyword={searchKeyword}
        onSearchChange={handleSearchChange}
        onSelect={onSelectPrompt}
        onToggleFavorite={handleToggleFavorite}
        builtInPromptIds={BUILT_IN_PROMPT_IDS}
        isFavoriteDisabled={isAddingFavorite || isRemovingFavorite}
        hideFavorite={!isFavoriteAvailable}
        className={className}
      />
    );
  }

  return (
    <DesktopSelectorTrigger
      selectedPrompt={selectedPrompt}
      prompts={allPrompts}
      selectedPromptId={selectedPromptId}
      searchKeyword={searchKeyword}
      onSearchChange={handleSearchChange}
      onSelect={onSelectPrompt}
      onToggleFavorite={handleToggleFavorite}
      builtInPromptIds={BUILT_IN_PROMPT_IDS}
      isFavoriteDisabled={isAddingFavorite || isRemovingFavorite}
      hideFavorite={!isFavoriteAvailable}
      className={className}
    />
  );
};

// =============================================================================
// Desktop Selector Trigger (桌面端选择器入口)
// =============================================================================

interface SelectorTriggerProps {
  selectedPrompt: PromptWithFavorite | null | undefined;
  prompts: PromptWithFavorite[];
  selectedPromptId: number | null;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: number | null) => void;
  onToggleFavorite: (id: number) => void;
  builtInPromptIds: number[];
  isFavoriteDisabled: boolean;
  hideFavorite?: boolean;
  className?: string;
}

const DesktopSelectorTrigger: FC<SelectorTriggerProps> = ({
  selectedPrompt,
  prompts,
  selectedPromptId,
  searchKeyword,
  onSearchChange,
  onSelect,
  onToggleFavorite,
  builtInPromptIds,
  isFavoriteDisabled,
  hideFavorite = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [hoveredPrompt, setHoveredPrompt] = useState<PromptWithFavorite | null>(
    null
  );
  const [previewPrompt, setPreviewPrompt] = useState<PromptWithFavorite | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (id: number | null): void => {
    onSelect(id);
    setOpen(false);
    setPreviewOpen(false);
  };

  //悬停延迟逻辑：300ms 触发，150ms 关闭
  const handleHover = useCallback((prompt: PromptWithFavorite | null) => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }

    if (prompt) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredPrompt(prompt);
      }, 300);
    } else {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      leaveTimeoutRef.current = setTimeout(() => {
        setHoveredPrompt(null);
      }, 150);
    }
  }, []);

  const handlePreview = useCallback((prompt: PromptWithFavorite): void => {
    setPreviewPrompt(prompt);
    setPreviewOpen(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  useEffect(() => {
    if (!open) {
      setHoveredPrompt(null);
      setPreviewOpen(false);
      setPreviewPrompt(null);
    }
  }, [open]);

  useEffect(() => {
    if (hoveredPrompt && previewOpen) {
      setPreviewPrompt(hoveredPrompt);
    }
  }, [hoveredPrompt, previewOpen]);

  useEffect(() => {
    if (!searchKeyword.trim()) return;
    const hasMatch = prompts.some(
      (p) =>
        p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ?? false)
    );
    if (!hasMatch) {
      setPreviewOpen(false);
      setPreviewPrompt(null);
    }
  }, [prompts, searchKeyword]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-3 gap-2 rounded-lg border-dashed",
            selectedPrompt
              ? "border-primary/50 bg-primary/5 text-primary"
              : "border-muted-foreground/30 text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs truncate max-w-[120px]">
            {selectedPrompt ? selectedPrompt.title : "选择提示词"}
          </span>
          {selectedPrompt && <Check className="h-3 w-3 text-primary" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(430px,calc(100vw-20px))] p-0"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="max-h-[62vh] overflow-hidden flex flex-col">
          <div className="py-3 px-4 border-b">
            <h4 className="text-sm font-medium mb-2">选择提示词</h4>
            <PromptSearchInput
              value={searchKeyword}
              onSearchChange={onSearchChange}
              placeholder="搜索提示词..."
              debounceMs={300}
            />
          </div>
          <PromptListContainer
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            searchKeyword={searchKeyword}
            builtInPromptIds={builtInPromptIds}
            onSelect={handleSelect}
            onToggleFavorite={onToggleFavorite}
            onHover={handleHover}
            onPreview={handlePreview}
            onClearSearch={handleClearSearch}
            isFavoriteDisabled={isFavoriteDisabled}
            hideFavorite={hideFavorite}
            maxHeight="48vh"
            className="p-2"
          />
        </div>
      </PopoverContent>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              提示词预览
            </DialogTitle>
            <DialogDescription className="sr-only">
              预览当前选中的提示词内容，并可执行收藏、复制和使用操作。
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 pt-2">
            <PromptPreviewCard
              prompt={previewPrompt || hoveredPrompt}
              isBuiltIn={
                (previewPrompt || hoveredPrompt)
                  ? builtInPromptIds.includes((previewPrompt || hoveredPrompt)!.id)
                  : false
              }
              onToggleFavorite={onToggleFavorite}
              onSelect={handleSelect}
              showSelectButton={true}
              className="w-full"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Popover>
  );
};

// =============================================================================
// Mobile Selector Trigger (移动端选择器入口)
// =============================================================================

const MobileSelectorTrigger: FC<SelectorTriggerProps> = ({
  selectedPrompt,
  prompts,
  selectedPromptId,
  searchKeyword,
  onSearchChange,
  onSelect,
  onToggleFavorite,
  builtInPromptIds,
  isFavoriteDisabled,
  hideFavorite = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);

  const handleSelect = (id: number | null): void => {
    onSelect(id);
    setOpen(false);
    setMobilePreviewOpen(false);
  };

  // 移动端点击展开预览
  const handleItemClick = (id: number | null): void => {
    if (id === null) return;
    setExpandedPromptId(id);
    setMobilePreviewOpen(true);
  };

  const handlePreview = useCallback((prompt: PromptWithFavorite): void => {
    setExpandedPromptId(prompt.id);
    setMobilePreviewOpen(true);
  }, []);

  const handleClearSearch = useCallback(() => {
    onSearchChange("");
  }, [onSearchChange]);

  useEffect(() => {
    if (!open) {
      setExpandedPromptId(null);
      setMobilePreviewOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!searchKeyword.trim()) return;
    const hasMatch = prompts.some(
      (p) =>
        p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchKeyword.toLowerCase()) ?? false)
    );
    if (!hasMatch) {
      setExpandedPromptId(null);
      setMobilePreviewOpen(false);
    }
  }, [prompts, searchKeyword]);

  const expandedPrompt = expandedPromptId
    ? prompts.find((p) => p.id === expandedPromptId) || null
    : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 px-3 gap-2 rounded-lg border-dashed",
            selectedPrompt
              ? "border-primary/50 bg-primary/5 text-primary"
              : "border-muted-foreground/30 text-muted-foreground",
            className
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs truncate max-w-[100px]">
            {selectedPrompt ? selectedPrompt.title : "选择提示词"}
          </span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>选择提示词</DrawerTitle>
          <PromptSearchInput
            value={searchKeyword}
            onSearchChange={onSearchChange}
            placeholder="搜索提示词..."
            debounceMs={300}
            className="mt-2"
          />
        </DrawerHeader>

        <PromptListContainer
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          searchKeyword={searchKeyword}
          builtInPromptIds={builtInPromptIds}
          onSelect={handleItemClick}
          onToggleFavorite={onToggleFavorite}
          onPreview={handlePreview}
          onClearSearch={handleClearSearch}
          isFavoriteDisabled={isFavoriteDisabled}
          hideFavorite={hideFavorite}
          maxHeight="52vh"
          className="px-2 pb-6"
        />
      </DrawerContent>

      <Sheet open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
        <SheetContent side="bottom" className="max-h-[78vh] rounded-t-xl p-0">
          <SheetHeader className="border-b pb-2">
            <SheetTitle className="text-sm font-medium">提示词预览</SheetTitle>
          </SheetHeader>
          <div className="p-4 overflow-y-auto">
            <PromptPreviewCard
              prompt={expandedPrompt}
              isBuiltIn={expandedPrompt ? builtInPromptIds.includes(expandedPrompt.id) : false}
              onToggleFavorite={onToggleFavorite}
              onSelect={handleSelect}
              showSelectButton={true}
              className="w-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </Drawer>
  );
};

export default PromptSelector;
