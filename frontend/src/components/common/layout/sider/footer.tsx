import * as React from 'react';
import { cn } from '@/lib/utils';

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <footer
        ref={ref}
        className={cn(
          'flex shrink-0 items-center justify-center border-t py-2',
          className
        )}
        {...props}
      >
        {children}
      </footer>
    );
  }
);

SidebarFooter.displayName = 'SidebarFooter';

export { SidebarFooter };