"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Book, Feather, Home, Settings, Bot } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const mainNav: NavItem[] = [
  { href: "/", label: "总览", icon: Home },
  { href: "/works", label: "作品管理", icon: Book },
  { href: "/drafts", label: "草稿箱", icon: Feather },
];

const toolsNav: NavItem[] = [
  { href: "/tools/characters", label: "角色管理", icon: Bot },
  { href: "/tools/worldbuilding", label: "世界观设定", icon: Bot },
];

interface SidebarProps {
  className?: string;
  isCollapsed: boolean;
}

export function Sidebar({ className, isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  const renderLink = (item: NavItem) => {
    const isActive =
      (pathname === "/" && item.href === "/") ||
      (item.href !== "/" && pathname.startsWith(item.href));

    if (isCollapsed) {
      return (
        <TooltipProvider key={item.href}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full h-10 flex items-center justify-center"
                  size="icon"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="sr-only">{item.label}</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-4">
              {item.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Link href={item.href} key={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className="w-full justify-start"
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </Link>
    );
  };

  return (
    <div className={cn("h-full border-r flex flex-col", className)}>
      <div className="p-2 pt-4">
        <h2
          className={cn(
            "px-2 text-lg font-semibold tracking-tight transition-all duration-300",
            isCollapsed ? "text-center text-xs" : "text-left",
          )}
        >
          {isCollapsed ? "🚀" : "创作中心"}
        </h2>
      </div>
      <ScrollArea className="h-full px-2">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            {!isCollapsed && (
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                创作
              </h2>
            )}
            <div className="space-y-1">{mainNav.map(renderLink)}</div>
          </div>
          <div className="px-3 py-2">
            {!isCollapsed && (
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                工具
              </h2>
            )}
            <div className="space-y-1">{toolsNav.map(renderLink)}</div>
          </div>
        </div>
      </ScrollArea>
      <div className="mt-auto p-2">
        <Link href="/settings">
          <Button
            variant={pathname === "/settings" ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Settings className="mr-2 h-4 w-4" />
            {!isCollapsed && (
              <span className="transition-all duration-300">设置</span>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
}
