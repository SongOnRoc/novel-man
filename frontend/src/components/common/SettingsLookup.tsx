"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface LookupSource<T = any> {
  name: string;
  icon: React.ReactNode;
  useData: (params: {
    workId: string;
    searchTerm: string;
  }) => { data: T[]; isLoading: boolean };
  renderItem: (props: {
    item: T;
    onSelect?: (name: string) => void;
  }) => React.ReactNode;
}

interface SettingsLookupProps {
  workId: string;
  sources: LookupSource[];
  onSelectItem?: (name: string) => void;
}

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
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export function SettingsLookup({
  workId,
  sources,
  onSelectItem,
}: SettingsLookupProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

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
            在这里快速搜索作品中的设定。
          </SheetDescription>
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
                  onSelectItem={onSelectItem}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}