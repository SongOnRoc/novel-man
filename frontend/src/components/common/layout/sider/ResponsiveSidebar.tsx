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
  const [panelSize, setPanelSize] = React.useState(isCollapsed ? 5 : 15);

  // 同步 Zustand 状态与 ResizablePanel 状态
  React.useEffect(() => {
    setPanelSize(isCollapsed ? 5 : 15);
  }, [isCollapsed]);

  if (isDesktop) {
    return (
      <ResizablePanel
        defaultSize={panelSize}
        collapsedSize={5}
        collapsible={true}
        minSize={5}
        maxSize={25}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        onResize={(size) => {
          // 根据大小更新折叠状态
          if (size <= 6 && !isCollapsed) {
            setIsCollapsed(true);
          } else if (size > 6 && isCollapsed) {
            setIsCollapsed(false);
          }
        }}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed && "min-w-[5%] max-w-[5%]",
          !isCollapsed && "min-w-[15%] max-w-[25%]",
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
