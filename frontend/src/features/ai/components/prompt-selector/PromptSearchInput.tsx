"use client";

import { Search, X } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface PromptSearchInputProps {
  /** 搜索值变化回调（防抖后） */
  onSearchChange: (value: string) => void;
  /** 受控值（可选） */
  value?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 防抖延迟（毫秒） */
  debounceMs?: number;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// PromptSearchInput Component
// =============================================================================

/**
 * 提示词搜索输入框组件
 * 支持防抖搜索和清空功能
 */
export const PromptSearchInput: FC<PromptSearchInputProps> = ({
  onSearchChange,
  value,
  placeholder = "搜索提示词...",
  debounceMs = 300,
  className,
}) => {
  const [inputValue, setInputValue] = useState(value ?? "");
  const debouncedValue = useDebounce(inputValue, debounceMs);

  // 当外部受控值变化时同步内部输入
  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  // 当防抖值变化时通知父组件
  useEffect(() => {
    onSearchChange(debouncedValue);
  }, [debouncedValue, onSearchChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    setInputValue("");
  }, []);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
      />
      {inputValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="清空搜索"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default PromptSearchInput;