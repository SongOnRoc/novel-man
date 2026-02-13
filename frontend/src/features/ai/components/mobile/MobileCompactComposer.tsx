'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface MobileCompactComposerProps {
  /** Callback when input receives focus */
  onFocus: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Mobile Compact Composer
 * 
 * A streamlined input field for the floating bar.
 * Tapping expands to immersive mode for full interaction.
 * Uses theme-compatible colors to blend with editor theme.
 */
export function MobileCompactComposer({
  onFocus,
  placeholder = "问问AI...",
  disabled = false,
}: MobileCompactComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Trigger focus callback to switch to immersive mode
    onFocus();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2',
        // 合适的高度和内边距
        'h-11 px-3 rounded-xl',
        // 使用前景色相关的颜色，与主题协调
        'bg-foreground/5 border border-foreground/10',
        'cursor-pointer transition-all duration-200',
        'hover:bg-foreground/10 hover:border-foreground/15',
        'active:scale-[0.99]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        readOnly
        className={cn(
          'flex-1 bg-transparent border-none outline-none',
          'text-sm text-foreground placeholder:text-foreground/50',
          'cursor-pointer'
        )}
        onFocus={onFocus}
      />
    </div>
  );
}

export default MobileCompactComposer;