import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SidePanelContainerProps {
  title: string;
  icon?: ReactNode;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export function SidePanelContainer({
  title,
  icon,
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
  children,
  className,
}: SidePanelContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "flex flex-col border-b last:border-b-0 overflow-hidden transition-all duration-300 ease-in-out",
        isCollapsed ? "h-10 shrink-0" : "flex-1 h-full",
        className
      )}
      style={{ backgroundColor: 'var(--card)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-10 shrink-0 border-b bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          {icon}
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/80"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex-1 overflow-hidden transition-all duration-300",
          isCollapsed && "opacity-0 pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}
