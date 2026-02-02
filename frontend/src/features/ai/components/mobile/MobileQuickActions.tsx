'use client';

import React from 'react';
import { Sparkles, PenLine, BarChart3, Expand } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Whether this action requires selected text */
  requiresSelection?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'polish', label: '润色', icon: <Sparkles className="h-4 w-4" />, requiresSelection: true },
  { id: 'continue', label: '续写', icon: <PenLine className="h-4 w-4" /> },
  { id: 'analyze', label: '分析', icon: <BarChart3 className="h-4 w-4" />, requiresSelection: true },
  { id: 'expand', label: '扩写', icon: <Expand className="h-4 w-4" />, requiresSelection: true },
];

interface MobileQuickActionsProps {
  /** Callback when an action is triggered */
  onAction: (actionId: string) => void;
  /** Whether there is selected text in the editor */
  hasSelectedText: boolean;
  /** Maximum number of actions to show */
  maxActions?: number;/** Custom class name */
  className?: string;
}

/**
 * Mobile Quick Actions
 * 
 * A row of quick action buttons for common AI operations.
 * All buttons meet the 44x44px minimum touch target requirement.
 * Uses theme-compatible colors to blend with editor theme.
 */
export function MobileQuickActions({
  onAction,
  hasSelectedText,
  maxActions = 3,
  className,
}: MobileQuickActionsProps) {
  // Filter actions based on whether they require selection
  const availableActions = QUICK_ACTIONS.filter(
    action => !action.requiresSelection || hasSelectedText
  );

  // Show limited actions based on maxActions prop
  const visibleActions = availableActions.slice(0, maxActions);

  return (
    <div className={cn('flex items-center gap-1 shrink-0', className)}>
      {visibleActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={cn(
            'flex items-center justify-center',
            //足够的触控区域
            'h-10 w-10 rounded-lg',
            // 使用前景色相关的颜色，与主题协调
            'bg-foreground/5 text-foreground/60',
            'border border-foreground/10',
            'transition-all duration-200',
            'hover:bg-foreground/10 hover:text-foreground',
            'active:scale-95'
          )}
          title={action.label}
          aria-label={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}

export default MobileQuickActions;