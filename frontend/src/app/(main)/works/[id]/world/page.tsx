"use client";

import {
  ChevronRight,
  Folder,
  FolderOpen,
  Globe,
  MoreVertical,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkById } from "@/hooks/work/useWorkService";
import { cn } from "@/lib/utils";

// Mock Data
const categories = [
  { id: "1", name: "地理环境", count: 5 },
  { id: "2", name: "历史事件", count: 3 },
  { id: "3", name: "魔法体系", count: 8 },
  { id: "4", name: "种族设定", count: 4 },
  { id: "5", name: "组织势力", count: 6 },
];

const items = [
  { id: "1", name: "艾尔迪亚大陆", categoryId: "1", description: "主要的大陆板块，分为三个区域..." },
  { id: "2", name: "迷雾森林", categoryId: "1", description: "终年被迷雾笼罩的神秘森林..." },
  { id: "3", name: "第一次魔导战争", categoryId: "2", description: "确立了现代魔法体系的战争..." },
  { id: "4", name: "元素魔法", categoryId: "3", description: "基础的魔法类型，包括地水火风..." },
  { id: "5", name: "精灵族", categoryId: "4", description: "居住在森林深处的长寿种族..." },
];

export default function WorldPage(): React.ReactElement {
  const params = useParams();
  const workId = Number(params.id);
  const { setBreadcrumb } = useBreadcrumb();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: work } = useWorkById(workId);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "世界观");
    }
  }, [work, workId, setBreadcrumb]);

  const filteredItems = items.filter(
    (item) =>
      (!selectedCategory || item.categoryId === selectedCategory) &&
      (item.name.includes(searchQuery) || item.description.includes(searchQuery))
  );

  return (
    <div className="h-[calc(100vh-64px)] -m-8 flex flex-col animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold">世界观设定</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            设定集管理
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新建条目
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar: Categories */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="flex h-full flex-col bg-muted/10">
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">分类目录</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                >
                  <FolderOpen className="mr-2 h-4 w-4 text-primary" />
                  全部条目
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    {category.name}
                    <span className="ml-auto text-xs text-muted-foreground">{category.count}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Main Area: Items Grid */}
        <ResizablePanel defaultSize={80}>
          <div className="flex h-full flex-col bg-background">
            {/* Toolbar */}
            <div className="flex items-center gap-4 border-b p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索设定..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Grid */}
            <ScrollArea className="flex-1 p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                  >
                    <div>
                      <div className="mb-3 flex items-start justify-between">
                        <div className="rounded-md bg-primary/5 p-2 text-primary">
                          <Globe className="h-5 w-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>编辑</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">删除</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold tracking-tight">{item.name}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                        {item.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-4">
                      <span className="text-xs text-muted-foreground">
                        {categories.find(c => c.id === item.categoryId)?.name}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        查看详情 <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
                
                {/* Add New Card */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-6 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <div className="mb-4 rounded-full bg-background p-3 shadow-sm">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-muted-foreground">新建设定</span>
                </motion.button>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
