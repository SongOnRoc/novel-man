"use client";

import { useState } from "react";
import type { PromptForClient } from "@/lib/services/prompt.service";
import {
  Search,
  Plus,
  Filter,
  RotateCcw,
  CheckCircle,
  ChevronDown,
  MoreVertical,
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
// import mockPromptsData from "@/lib/mock/prompts-mock-data.json";

import { usePromptList } from "@/hooks/prompt/usePromptService";

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

  // Construct query params
  // Currently only supporting simple category filtering or passing all selected categories
  // For now, let's just pass page and limit.
  // TODO: Implement proper category filtering mapping if needed by backend
  const { data: promptsData, isLoading } = usePromptList({
    page: currentPage,
    limit: limit,
    // category: ... // Add category filtering logic here if backend supports multiple categories or specific mapping
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
    <div className="bg-gray-50/50 min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-x-8 text-sm font-medium text-gray-600 overflow-x-auto no-scrollbar">
            {topNavItems.map((item) => (
              <a
                key={item}
                href="#"
                className="py-3 shrink-0 border-b-2 border-transparent hover:text-primary transition-colors data-[active=true]:text-primary data-[active=true]:border-primary"
                data-active={item === "全部"}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative flex-grow">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <Input
                placeholder="搜索提示词..."
                className="w-full h-12 pl-12 pr-4 text-base bg-white border border-gray-200 rounded-full shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500"
              />
            </div>
            <Button className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full">
              搜索
            </Button>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-gray-800">分类筛选</h3>
              <Badge variant="secondary" className="rounded-full">
                {selectedMain.length + selectedSecondary.length}
              </Badge>
            </div>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  resetFilters();
                }}
                className="text-muted-foreground hover:text-primary mr-2"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-gray-500 transition-transform duration-300",
                  {
                    "rotate-180": isFiltersOpen,
                  }
                )}
              />
            </div>
          </div>

          <div
            className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              {
                "max-h-0": !isFiltersOpen,
                "max-h-96 mt-4 pt-4 border-t": isFiltersOpen,
              }
            )}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(cat, "main");
                      }}
                      className={cn("rounded-full transition-all", {
                        "bg-primary/10 border-primary/30 text-primary":
                          isSelected && cat !== "全部",
                      })}
                    >
                      {cat}
                      {isSelected && cat !== "全部" && (
                        <CheckCircle className="w-4 h-4 ml-2" />
                      )}
                    </Button>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {secondaryCategories.map((cat) => {
                  const isSelected = selectedSecondary.includes(cat);
                  return (
                    <Button
                      key={cat}
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(cat, "secondary");
                      }}
                      className={cn("rounded-full transition-all", {
                        "bg-amber-100/60 border-amber-300/80 text-amber-800":
                          isSelected,
                      })}
                    >
                      {cat}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="最热" className="w-full">
          <div className="flex justify-between items-center mb-6">
            {/* Desktop Tabs */}
            <TabsList className="bg-transparent p-0 hidden md:flex">
              {contentTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="text-base text-gray-500 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none relative px-4 py-2"
                >
                  {tab}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 scale-x-0 data-[state=active]:scale-x-100 transition-transform duration-300 origin-center" />
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Mobile Select */}
            <div className="md:hidden flex-grow">
              <Select defaultValue="最热">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {contentTabs.map((tab) => (
                    <SelectItem key={tab} value={tab}>
                      {tab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-x-2">
              {isDesktop ? (
                <>
                  <ImportPromptsDialog />
                  <Button className="ml-4">
                    <Plus className="mr-2 h-4 w-4" />
                    创建提示词
                  </Button>
                </>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <div onClick={(e) => e.stopPropagation()}>
                        <ImportPromptsDialog />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        创建提示词
                      </Button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          {contentTabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {prompts.map((prompt) => (
                    <PromptCard key={`${tab}-${prompt.id}`} prompt={prompt} />
                  ))}
                  {prompts.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      暂无提示词
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  }}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>
              {/* Simple pagination logic for now, can be improved */}
              {[...Array(totalPages)].map((_, i) => {
                 // Show limited pages logic can be added here
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
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}
