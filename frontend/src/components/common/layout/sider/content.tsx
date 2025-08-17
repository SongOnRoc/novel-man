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
        className={cn('flex-1 overflow-y-auto hide-scrollbar', className)}
        {...props}
      >
        {children}
      </main>
    );
  }
);

SidebarContent.displayName = 'SidebarContent';

export { SidebarContent };