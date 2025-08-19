"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";

import { AIAssistant } from "./AIAssistant";

interface AIFloatingButtonProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
}

export function AIFloatingButton({
  selectedText,
  onApplyToEditor,
}: AIFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = (text: string) => {
    onApplyToEditor?.(text);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-8 right-8 h-10 w-10 rounded-full shadow-lg z-50"
        >
          <Sparkles className="h-7 w-7" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="sr-only">AI 写作助手</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="max-h-[85vh] w-full">
          <div className="mx-auto w-full max-w-2xl p-4 pt-0">
            <AIAssistant
              selectedText={selectedText}
              onApplyToEditor={handleApply}
              compact={true}
            />
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
