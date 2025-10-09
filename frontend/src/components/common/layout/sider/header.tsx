import * as React from 'react';

import { cn } from '@/lib/utils';

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex h-16 shrink-0 items-center justify-between border-b border-border/40 bg-gradient-to-r from-transparent via-background/50 to-transparent backdrop-blur-sm px-4 transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </header>
    );
  }
);

SidebarHeader.displayName = 'SidebarHeader';

export { SidebarHeader };