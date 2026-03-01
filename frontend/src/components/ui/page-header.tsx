import * as React from "react";
import { cn } from "@/lib/utils";

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("flex flex-col gap-2 pb-4", className)}
    {...props}
  />
));
PageHeader.displayName = "PageHeader";

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-3xl font-bold leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]",
      className
    )}
    {...props}
  />
));
PageHeaderHeading.displayName = "PageHeaderHeading";

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "max-w-[750px] text-lg text-muted-foreground sm:text-xl",
      className
    )}
    {...props}
  />
));
PageHeaderDescription.displayName = "PageHeaderDescription";

export { PageHeader, PageHeaderHeading, PageHeaderDescription };