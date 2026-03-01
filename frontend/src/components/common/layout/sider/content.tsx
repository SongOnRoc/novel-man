import * as React from 'react';

import { cn } from '@/lib/utils';

interface SidebarContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarContent = React.forwardRef<HTMLDivElement, SidebarContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          'flex-1 overflow-y-auto hide-scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/20 hover:scrollbar-thumb-border/40 transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </main>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

export { SidebarContent };