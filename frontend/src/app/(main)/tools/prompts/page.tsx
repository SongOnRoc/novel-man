"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Filter,
  RotateCcw,
  CheckCircle,
  ChevronDown,
  MoreVertical,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import PromptCard from "@/features/prompts/components/PromptCard";
import ImportPromptsDialog from "@/features/prompts/components/ImportPromptsDialog";
import { usePromptList } from "@/hooks/prompt/usePromptService";
import { motion } from "framer-motion";

const topNavItems = [
  "全部",
  "扩写要求",
  "拆书要求",
  "续写要求",
  "写作风格",
  "书名生成器",
  "简介生成器",
  "大纲生成器",
  "黄金开篇生成器",
];
const mainCategories = [
  "全部",
  "长篇",
  "短篇",
  "老福特",
  "短剧",
  "剧本",
  "降AI率",
];
const secondaryCategories = ["知乎", "小程序风", "番茄"];
const contentTabs = ["我的", "最热", "最新", "精选", "搜索", "已收藏"];

export default function PromptsPage() {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [selectedMain, setSelectedMain] = useState(["长篇", "短篇"]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 12;

  const { data: promptsData, isLoading } = usePromptList({
    page: currentPage,
    limit: limit,
  });

  const prompts = promptsData?.items || [];
  const total = promptsData?.pagination?.total || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const toggleSelection = (category: string, type: "main" | "secondary") => {
    if (type === "main") {
      if (category === "全部") {
        setSelectedMain([]);
        return;
      }
      const newSelection = selectedMain.includes(category)
        ? selectedMain.filter((c) => c !== category)
        : [...selectedMain, category];
      setSelectedMain(newSelection);
    } else {
      const newSelection = selectedSecondary.includes(category)
        ? selectedSecondary.filter((c) => c !== category)
        : [...selectedSecondary, category];
      setSelectedSecondary(newSelection);
    }
  };

  const resetFilters = () => {
    setSelectedMain([]);
    setSelectedSecondary([]);
  };

  return (
    <div className="pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-[var(--border-subtle)]/60 bg-card/70 backdrop-blur-xl md:-mx-6">
        <div className="px-4 md:px-6">
          <div className="flex items-center gap-x-8 overflow-x-auto py-3 no-scrollbar">
            {topNavItems.map((item) => (
              <button
                key={item}
                className={cn(
                  "shrink-0 text-sm font-medium transition-colors hover:text-primary",
                  item === "全部" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-5 sm:space-y-5">
        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索提示词..."
                className="h-11 rounded-full border-[var(--border-default)]/60 bg-muted/30 pl-11 pr-4 text-sm transition-all focus:bg-card focus:ring-2 focus:ring-[var(--primary-500)]/20"
              />
            </div>
            <Button size="lg" className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              <Search className="mr-2 h-4 w-4" /> 搜索
            </Button>
          </div>

          <div className="mt-5">
            <div
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">高级筛选</span>
                {(selectedMain.length > 0 || selectedSecondary.length > 0) && (
                  <Badge variant="secondary" className="rounded-full">
                    {selectedMain.length + selectedSecondary.length}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                  }}
                  className="text-muted-foreground hover:text-primary"
                >
                  <RotateCcw className="mr-2 h-3 w-3" />
                  重置
                </Button>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-300",
                    isFiltersOpen && "rotate-180"
                  )}
                />
              </div>
            </div>

            <motion.div
              initial={false}
              animate={{ height: isFiltersOpen ? "auto" : 0, opacity: isFiltersOpen ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-5">
                <div className="flex flex-wrap gap-2">
                  {mainCategories.map((cat) => {
                    const isSelected =
                      cat === "全部"
                        ? selectedMain.length === 0
                        : selectedMain.includes(cat);
                    return (
                      <Button
                        key={cat}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSelection(cat, "main")}
                        className="rounded-full"
                      >
                        {cat}
                        {isSelected && cat !== "全部" && (
                          <CheckCircle className="ml-2 h-3 w-3" />
                        )}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {secondaryCategories.map((cat) => {
                    const isSelected = selectedSecondary.includes(cat);
                    return (
                      <Button
                        key={cat}
                        variant={isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleSelection(cat, "secondary")}
                        className={cn(
                          "rounded-full",
                          isSelected && "bg-[var(--accent-100)]/80 text-[var(--accent-700)] hover:bg-[var(--accent-200)]/80"
                        )}
                      >
                        {cat}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="最热" className="w-full">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 md:w-auto">
              {contentTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="rounded-full border border-transparent px-4 py-2 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">
              {isDesktop ? (
                <>
                  <ImportPromptsDialog />
                  <Button className="rounded-full">
                    <Plus className="mr-2 h-4 w-4" />
                    创建提示词
                  </Button>
                </>
              ) : (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <ImportPromptsDialog />
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Plus className="mr-2 h-4 w-4" />
                        创建提示词
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>

          {contentTabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-64 w-full animate-pulse rounded-xl bg-muted/40" />
                  ))}
                </div>
              ) : (
                <div className="columns-1 gap-4 md:columns-2 lg:columns-3 xl:columns-4 space-y-4">
                  {prompts.map((prompt) => (
                    <div key={`${tab}-${prompt.id}`} className="break-inside-avoid">
                      <PromptCard prompt={prompt} />
                    </div>
                  ))}
                  {prompts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center col-span-full">
                      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Sparkles className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight">暂无提示词</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        该分类下还没有提示词，快来创建第一个吧！
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Pagination */}
        <div className="flex justify-center pt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  }}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => {
                 if (totalPages > 10 && Math.abs(currentPage - (i + 1)) > 2 && i !== 0 && i !== totalPages - 1) {
                    if (i === 1 || i === totalPages - 2) return <PaginationItem key={i}>...</PaginationItem>;
                    return null;
                 }
                 return (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  }}
                  className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
