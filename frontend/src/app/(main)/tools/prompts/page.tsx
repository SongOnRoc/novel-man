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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import PromptCard from "@/features/prompts/components/PromptCard";

// import usePromptService from "@/hooks/prompt/usePromptService";

const mockPrompts: PromptForClient[] = [
  {
    id: 1,
    title: "【橙子】根据已有剧情扩写润色,去ai味(长短篇交流群...",
    author: "橙子",
    authorSpecialty: "(长篇、短篇、剧本教学)",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704d",
    usageCount: 715904,
    updatedAt: "2025-08-25",
    description:
      "使用方法: 橙子的脑洞生成→大纲生成→橙子的细纲生成→根据已有剧情扩写润色 (或者选择ai写作;) →最后生成完整章节→选择一键章节评分取名, 从编辑读者角度, 给出修改建议 注意: 如果细纲全部选中, 扩写...",
    primaryTag: "扩写要求",
    summary: [
      { icon: "Book", text: "爆款网文创作圣典" },
      { icon: "Feather", text: "五感模型" },
    ],
    categories: ["长篇", "短篇"],
    footerTags: ["番茄", "起点", "降AI率"],
  },
  {
    id: 2,
    title: "【西瓜出品】黄金文风1.3, 开启新人造神时代! 番茄起...",
    author: "西瓜",
    authorSpecialty: "(短篇+长篇行动营)",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704e",
    usageCount: 553491,
    updatedAt: "2025-08-25",
    description:
      "视觉: 建立「色彩档案」 例如:《诡秘之主》雾霾灰 x 煤气灯黄→蒸汽朋克美学 听觉: 设计「声音符号」 例如: 古风文: 三更鼓声 声 修仙文: 灵鹤破云唳",
    primaryTag: "写作风格",
    summary: [
      { icon: "Book", text: "爆款网文创作圣典" },
      { icon: "Feather", text: "五感模型" },
    ],
    categories: ["长篇", "短篇", "番茄"],
    footerTags: ["起点", "番茄"],
  },
  {
    id: 3,
    title: "【西瓜出品】黄金写作1.3, 开启新人造神时代! 番茄起点爆...",
    author: "西瓜",
    authorSpecialty: "(短篇+长篇行动营)",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704f",
    usageCount: 427858,
    updatedAt: "2025-08-25",
    description:
      "视觉: 建立「色彩档案」 例如:《诡秘之主》雾霾灰 x 煤气灯黄→蒸汽朋克美学 听觉: 设计「声音符号」 例如: 古风文: 二更鼓",
    primaryTag: "写作要求",
    summary: [
      { icon: "Book", text: "爆款网文创作圣典" },
      { icon: "Feather", text: "五感模型" },
    ],
    categories: ["短篇", "知乎"],
    footerTags: ["起点", "番茄"],
  },
  {
    id: 4,
    title: "【西瓜出品】黄金主编, 你的星月大神! 百万本爆款经验...",
    author: "西瓜",
    authorSpecialty: "(短篇+长篇行动营)",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704a",
    usageCount: 408100,
    updatedAt: "2025-08-30",
    description:
      "【AI网文主编——你的数字时代爆款炼金术】>>>核心亮点<<< ☀️三维动态检测引擎[引擎引爆20年顶配主编思维模型+万部万订作品数据库+百万级扫描文本, 精准定位91%劝退隐患。不同...",
    primaryTag: "审稿要求",
    summary: [],
    categories: ["短篇"],
    footerTags: ["短剧"],
  },
  {
    id: 5,
    title: "【🌙一键成文】情节连贯, 适合续写 (十三月)",
    author: "十三月",
    authorSpecialty: "",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704b",
    usageCount: 384868,
    updatedAt: "2025-09-26",
    description:
      "祛AI味, 完美过朱雀, 必须搭配一整套才是完整的提示词 点击以下链接添加写作风格【🌙】祛AI味, 番茄剧情框架, 减少描述 (十三月) 【🌙】都市高武/脑洞, 番茄文风, 完美过朱雀 (十三月) 【玄幻脑洞】番茄风小白描爽文...",
    primaryTag: "写作要求",
    summary: [],
    categories: ["长篇", "番茄"],
    footerTags: ["番茄", "起点"],
  },
  {
    id: 6,
    title: "【橙子】续写一键成文, 番茄爆款文风, 强情绪期待 (交...",
    author: "橙子",
    authorSpecialty: "(长篇、短篇、剧本教学)",
    authorAvatar: "https://i.pravatar.cc/40?u=a042581f4e29026704c",
    usageCount: 375000,
    updatedAt: "2025-08-24",
    description:
      "这是一个为番茄小说设计的续写提示词, 旨在生成具有强烈情绪价值和高度期待感的内容, 帮助作者写出能吸引并留住读者的爆款文章。",
    primaryTag: "续写要求",
    summary: [],
    categories: ["长篇", "番茄"],
    footerTags: ["番茄"],
  },
];

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
  const [selectedMain, setSelectedMain] = useState(["长篇", "短篇"]);
  const [selectedSecondary, setSelectedSecondary] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 10; // Mock total pages

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
                  },
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
              },
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

            <Button className="ml-4">
              <Plus className="mr-2 h-4 w-4" />
              创建提示词
            </Button>
          </div>
          {contentTabs.map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockPrompts
                  .slice()
                  .sort(() => 0.5 - Math.random())
                  .map((prompt) => (
                    <PromptCard key={`${tab}-${prompt.id}`} prompt={prompt} />
                  ))}
              </div>
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
              {[...Array(totalPages)].map((_, i) => (
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
              ))}
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
