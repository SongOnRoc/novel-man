"use client";

import { FilePlus, LayoutGrid, List, Search, Filter } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Work } from "@/lib/services/work.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DraftToolbarProps {
  viewMode: "list" | "grid";
  onViewModeChange: (mode: "list" | "grid") => void;
  workId: string;
  onWorkIdChange: (workId: string) => void;
  works: Work[];
  onCreateDraft: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function DraftToolbar({
  viewMode,
  onViewModeChange,
  workId,
  onWorkIdChange,
  works,
  onCreateDraft,
  searchQuery,
  onSearchChange,
}: DraftToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder="搜索草稿..."
          className="border-border/50 bg-background/50 pl-9 transition-colors focus:bg-background"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Select value={workId} onValueChange={onWorkIdChange}>
            <SelectTrigger className="w-full border-border/50 bg-background/50 sm:w-[160px]">
              <SelectValue placeholder="筛选作品" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部作品</SelectItem>
              <SelectItem value="0">其他草稿</SelectItem>
              {works.map((work) => (
                <SelectItem key={work.id} value={work.id!.toString()}>
                  {work.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-border/50 bg-background/50"
              >
                <Filter className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>排序方式</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value="updated_desc">
                <DropdownMenuRadioItem value="updated_desc">
                  最近更新
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created_desc">
                  最近创建
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title_asc">
                  标题 A-Z
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden h-6 w-px bg-border/50 sm:block" />

        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) =>
              value && onViewModeChange(value as "list" | "grid")
            }
            className="rounded-lg border border-border/20 bg-muted/30 p-1"
          >
            <ToggleGroupItem
              value="list"
              aria-label="列表视图"
              size="sm"
              className="h-8 w-8 rounded-md transition-all data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="grid"
              aria-label="网格视图"
              size="sm"
              className="h-8 w-8 rounded-md transition-all data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            type="button"
            onClick={onCreateDraft}
            className="flex-1 shadow-lg shadow-primary/20 transition-all hover:scale-105 hover:shadow-primary/30 sm:flex-none"
          >
            <FilePlus className="mr-2 h-4 w-4" />
            新草稿
          </Button>
        </div>
      </div>
    </div>
  );
}
