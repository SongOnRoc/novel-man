"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PanelRightClose, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { cn } from "@/lib/utils";

import type { ImperativePanelHandle } from "react-resizable-panels";

interface AssistantDockProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  panelContent: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  tooltip?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AssistantDock({
  title,
  description,
  children,
  panelContent,
  open: controlledOpen,
  onOpenChange,
  tooltip,
  icon,
  className,
}: AssistantDockProps): React.ReactElement {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (controlledOpen === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [controlledOpen, onOpenChange],
  );

  const panelRef = useRef<ImperativePanelHandle>(null);

  useEffect(() => {
    if (!isDesktop) {
      return;
    }
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    if (isOpen) {
      panel.expand();
    } else {
      panel.collapse();
    }
  }, [isOpen, isDesktop]);

  const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  const floatingButton = (
    <div className="fixed bottom-8 right-8 z-40">
      <Button
        type="button"
        variant="default"
        size="icon"
        onClick={toggle}
        aria-label={tooltip ?? (isOpen ? "关闭工作台" : "打开工作台")}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl",
          isOpen
            ? "border border-border/40 bg-background text-foreground hover:bg-muted"
            : "bg-primary text-primary-foreground ring-4 ring-primary/10 hover:bg-primary/90",
        )}
      >
        {isOpen ? (
          <PanelRightClose className="h-5 w-5" />
        ) : (
          icon ?? <Sparkles className="h-6 w-6" />
        )}
      </Button>
    </div>
  );

  if (!isDesktop) {
    return (
      <div className={cn("relative", className)}>
        {children}
        {floatingButton}
        <Sheet open={isOpen} onOpenChange={setOpen}>
          <SheetContent
            side="bottom"
            className="h-[85vh] rounded-t-md border-t border-[var(--border-subtle)] bg-[var(--bg-page)] p-0"
          >
            <SheetHeader className="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 py-3">
              <SheetTitle className="text-sm font-semibold text-[var(--text-primary)]">
                {title}
              </SheetTitle>
              {description ? (
                <SheetDescription className="text-[12px] text-[var(--text-tertiary)]">
                  {description}
                </SheetDescription>
              ) : null}
            </SheetHeader>
            <div className="h-[calc(85vh-3.5rem)] overflow-y-auto">{panelContent}</div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className={cn("relative h-full", className)}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={isOpen ? 70 : 100} minSize={50}>
          <div className="relative h-full w-full">
            {children}
            {floatingButton}
          </div>
        </ResizablePanel>
        <ResizableHandle
          withHandle={false}
          className={cn(
            "w-2 bg-transparent transition-colors hover:bg-[var(--border-subtle)]",
            !isOpen && "hidden",
          )}
        />
        <ResizablePanel
          ref={panelRef}
          collapsible
          collapsedSize={0}
          defaultSize={0}
          minSize={26}
          maxSize={48}
          onCollapse={() => setOpen(false)}
          onExpand={() => setOpen(true)}
          className={cn("transition-[flex] duration-200", !isOpen && "border-none")}
        >
          {isOpen ? (
            <div className="flex h-full flex-col overflow-hidden border-l border-[var(--border-subtle)] bg-[var(--bg-page)]">
              <header className="flex h-12 items-center justify-between border-b border-[var(--border-subtle)] px-4">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--primary-500)]" />
                  <span>{title}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                  onClick={() => setOpen(false)}
                  aria-label="关闭工作台"
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </header>
              <div className="flex-1 overflow-hidden">{panelContent}</div>
            </div>
          ) : null}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
