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
        "sticky top-4 z-50 rounded-2xl border transition-all duration-300 animate-fadeInDown",
        "glass-card",
        scrolled
          ? "shadow-lg shadow-primary/5 border-primary/20"
          : "shadow-md border-transparent",
        className
      )}
    >
      <div className="flex h-14 w-full items-center px-6">
        <Breadcrumbs />
        <div className="flex flex-1 items-center justify-end space-x-3">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
