"use client";

import { Editor } from "@tiptap/react";
import { Search, FileSearch } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { characterLookupSource } from "@/features/characters/character-lookup";
import { worldviewLookupSource } from "@/features/worldview/worldview-lookup";
import type { LookupSource } from "@/components/common/SettingsLookup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { FindReplace } from "./FindReplace";

interface UnifiedSearchButtonProps {
  editor: Editor | null;
  workId?: string;
}

// SettingsLookup 内部的LookupContent组件逻辑
const LookupContent = ({
  source,
  workId,
  searchTerm,
  onSelectItem,
}: {
  source: LookupSource;
  workId: string;
  searchTerm: string;
  onSelectItem?: (name: string) => void;
}) => {
  const { data, isLoading } = source.useData({ workId, searchTerm });

  if (isLoading) {
    return (
      <div className="py-4 text-center text-muted-foreground">加载中...</div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        {searchTerm ? `没有找到匹配的${source.name}` : `该作品还没有${source.name}`}
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="pr-4">
        {data.map((item: any) => (
          <source.renderItem
            key={item.id}
            item={item}
            workId={workId}
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export function UnifiedSearchButton({ editor, workId }: UnifiedSearchButtonProps) {
  const [findDialogOpen, setFindDialogOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const sources = [characterLookupSource, worldviewLookupSource];

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (!editor) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            title="查找"
          >
            <Search className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>查找工具</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setFindDialogOpen(true)}>
            <Search className="h-4 w-4 mr-2" />
            查找替换
          </DropdownMenuItem>
          {workId && (
            <DropdownMenuItem onClick={() => setSettingsSheetOpen(true)}>
              <FileSearch className="h-4 w-4 mr-2" />
              设定速查
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 查找替换对话框 */}
      <Dialog open={findDialogOpen} onOpenChange={setFindDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>查找与替换</DialogTitle>
            <DialogDescription>在文档中查找并替换文本</DialogDescription>
          </DialogHeader>
          <FindReplace editor={editor} embedded />
        </DialogContent>
      </Dialog>

      {/* 设定速查 Sheet */}
      {workId && (
        <Sheet open={settingsSheetOpen} onOpenChange={setSettingsSheetOpen}>
          <SheetContent className="w-full sm:w-[540px] p-0">
            <SheetHeader className="px-6 pt-6 pb-2">
              <SheetTitle>设定速查</SheetTitle>
              <SheetDescription>在这里快速搜索作品中的设定。</SheetDescription>
            </SheetHeader>

            <div className="px-6 py-2">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button onClick={handleSearch} aria-label="搜索">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {sources.length > 0 && (
              <Tabs defaultValue={sources[0].name} className="px-6 pb-6">
                <TabsList className="mb-2">
                  {sources.map((source) => (
                    <TabsTrigger
                      key={source.name}
                      value={source.name}
                      className="flex items-center gap-1"
                    >
                      {source.icon}
                      {source.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {sources.map((source) => (
                  <TabsContent key={source.name} value={source.name} className="mt-0">
                    <LookupContent
                      source={source}
                      workId={workId}
                      searchTerm={searchTerm}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
