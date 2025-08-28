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
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Breadcrumbs />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
