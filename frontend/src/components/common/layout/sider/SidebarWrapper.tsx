"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useSidebarStore } from "@/hooks/ui/useSidebarStore";
import { SidebarContext } from "@/hooks/ui/useSidebarContext";

interface SidebarWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarWrapper({ children, className }: SidebarWrapperProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isCollapsed } = useSidebarStore();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (isDesktop) {
    return (
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[5%]" : "w-[15%]",
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 md:hidden sidebar-trigger
                     flex items-center justify-center
                     w-8 h-16 text-primary-foreground
                     rounded-r-lg cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-6 w-6" />
        </div>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full max-w-xs p-0 md:hidden bg-card/95 backdrop-blur-lg border-r border-primary/30 shadow-2xl"
      >
        <SidebarContext.Provider
          value={{ closeSheet: () => setIsSheetOpen(false) }}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  isSheet: true,
                })
              : child
          )}
        </SidebarContext.Provider>
      </SheetContent>
    </Sheet>
  );
}
