"use client";

import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav"; // Assuming UserNav will be created
import { useScroll } from "@/hooks/ui/useScroll";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        "sticky top-2.5 z-50 rounded-2xl border transition-all duration-300",
        "bg-background/60 backdrop-blur-xl",
        scrolled
          ? "border-border/50 shadow-lg shadow-black/10"
          : "border-transparent",
        className
      )}
    >
      <div className="flex h-10 w-full items-center px-6">
        <Breadcrumbs />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
