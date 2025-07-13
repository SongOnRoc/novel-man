"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users, Globe } from "lucide-react";
import { useLookup } from "@/hooks/lookup/useLookup";
import { CharacterCard } from "./CharacterCard";
import { WorldItemCard } from "./WorldItemCard";

interface SettingsLookupProps {
  workId: string;
  onSelectItem?: (name: string) => void;
}

export function SettingsLookup({ workId, onSelectItem }: SettingsLookupProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { characters, worldItems, isLoading, loadSettings, searchSettings } =
    useLookup();

  // 加载设定数据
  useEffect(() => {
    if (open && workId) {
      loadSettings(workId);
    }
  }, [open, workId, loadSettings]);

  // 处理搜索
  const handleSearch = () => {
    searchSettings(searchInput);
  };

  // 处理回车键搜索
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          设定速查
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>设定速查</SheetTitle>
          <SheetDescription>
            在这里快速搜索作品中的角色和世界观设定。
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-2">
          <div className="flex gap-2">
            <Input
              placeholder="搜索角色或设定..."
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

        <Tabs defaultValue="characters" className="px-6 pb-6">
          <TabsList className="mb-2">
            <TabsTrigger value="characters" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              角色 ({characters.length})
            </TabsTrigger>
            <TabsTrigger
              value="worldbuilding"
              className="flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              世界观 ({worldItems.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                加载中...
              </div>
            ) : characters.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput ? "没有找到匹配的角色" : "该作品还没有角色"}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {characters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onSelect={onSelectItem}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="worldbuilding" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                加载中...
              </div>
            ) : worldItems.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput
                  ? "没有找到匹配的世界观设定"
                  : "该作品还没有世界观设定"}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {worldItems.map((worldItem) => (
                    <WorldItemCard
                      key={worldItem.id}
                      worldItem={worldItem}
                      onSelect={onSelectItem}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
