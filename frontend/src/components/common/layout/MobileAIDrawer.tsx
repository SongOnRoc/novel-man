"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { Drawer } from "vaul";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileAIDrawerProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileAIDrawer({ children, open, onOpenChange }: MobileAIDrawerProps) {
  return (
    <Drawer.Root shouldScaleBackground open={open} onOpenChange={onOpenChange}>
      <Drawer.Trigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex h-[85vh] flex-col rounded-t-[10px] bg-background outline-none">
          <div className="flex-1 rounded-t-[10px] bg-background p-4">
            <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-muted" />
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
              <Sparkles className="h-5 w-5" />
              <span>AI 助手</span>
            </div>
            <ScrollArea className="h-[calc(85vh-100px)]">
              {children}
            </ScrollArea>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
