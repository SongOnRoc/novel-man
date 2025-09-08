"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import { SidebarContent } from "./content";
import { SidebarFooter } from "./footer";
import { SidebarHeader } from "./header";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  isSheet?: boolean;
}

type SidebarComponent = React.FC<SidebarProps> & {
  Header: typeof SidebarHeader;
  Content: typeof SidebarContent;
  Footer: typeof SidebarFooter;
};

const Sidebar: SidebarComponent = ({
  children,
  className,
  isSheet = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex h-full flex-col text-foreground w-full",
        !isSheet && "sidebar-desktop glass-card transition-all duration-300 ease-in-out bg-gradient-to-b from-background/80 to-background/60 backdrop-blur-md border-r border-border/30 shadow-xl",
        isSheet && "sidebar-mobile bg-gradient-to-b from-background/95 to-background/90 backdrop-blur-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Sidebar.Header = SidebarHeader;
Sidebar.Content = SidebarContent;
Sidebar.Footer = SidebarFooter;

export { Sidebar };
