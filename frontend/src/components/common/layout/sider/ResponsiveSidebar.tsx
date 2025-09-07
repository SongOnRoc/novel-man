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
import { ResizablePanel } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useSidebarStore } from "@/hooks/ui/useSidebarStore";
import { SidebarContext } from "@/hooks/ui/useSidebarContext";

interface ResponsiveSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveSidebar({
  children,
  className,
}: ResponsiveSidebarProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { isCollapsed, setIsCollapsed } = useSidebarStore();
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  if (isDesktop) {
    return (
      <ResizablePanel
        defaultSize={isCollapsed ? 5 : 15}
        collapsedSize={5}
        collapsible={true}
        minSize={15}
        maxSize={25}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        className={cn(
          "gtransition-all duration-300 ease-in-out",
          isCollapsed && "min-w-[4rem] max-w-[4rem]",
          className
        )}
      >
        {children}
      </ResizablePanel>
    );
  }

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <div
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 md:hidden
                     flex items-center justify-center
                     w-6 h-12 bg-primary/30 text-primary-foreground
                     rounded-r-lg shadow-none cursor-pointer
                     hover:bg-primary hover:shadow-lg transition-all"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </div>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-full max-w-xs p-0 md:hidden bg-transparent border-none"
        style={{ backgroundImage: "var(--bg-image)" }}
      >
        <SidebarContext.Provider value={{ closeSheet: () => setIsSheetOpen(false) }}>
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
