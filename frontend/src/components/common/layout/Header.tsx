"use client";

import React from "react";
import { Menu, Bell, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarOpen: _isSidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-subtle)]/60 bg-[var(--bg-card)]/70 backdrop-blur-xl px-3 md:px-5">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>

        <div className="hidden md:block min-w-0">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <div className="relative hidden lg:block">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <Input
            type="search"
            placeholder="搜索..."
            className="h-8 w-56 rounded-md border-[var(--border-subtle)] bg-transparent pl-8 text-sm focus-visible:ring-1 focus-visible:ring-[var(--primary-500)]"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent-500)]" />
        </Button>

        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
