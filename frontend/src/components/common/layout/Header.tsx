"use client";

import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav"; // Assuming UserNav will be created
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn(className)}>
      <div className="flex h-10 w-full items-center">
        <Breadcrumbs />
        <div className="flex items-center justify-end space-x-2 flex-1">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
