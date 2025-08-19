'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

import { SidebarContent } from './content';
import { SidebarFooter } from './footer';
import { SidebarHeader } from './header';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

type SidebarComponent = React.FC<SidebarProps> & {
  Header: typeof SidebarHeader;
  Content: typeof SidebarContent;
  Footer: typeof SidebarFooter;
};

const Sidebar: SidebarComponent = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col bg-background text-foreground',
        'transition-all duration-300 ease-in-out',
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