"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { Search, FileSearch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FindReplace } from "./FindReplace";
import { SidePanelContainer } from "./SidePanelContainer";
import { characterLookupSource } from "@/features/characters/character-lookup";
import { worldviewLookupSource } from "@/features/worldview/worldview-lookup";
import type { LookupSource } from "@/components/common/SettingsLookup";

interface SearchPanelProps {
  editor: Editor | null;
  workId?: string;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
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
    <ScrollArea className="h-full">
      <div className="pr-4 pb-4">
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

export function SearchPanel({
  editor,
  workId,
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
  embedded = false,
}: SearchPanelProps & { embedded?: boolean }) {
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

  const content = (
    <Tabs defaultValue="find" className="flex flex-col h-full overflow-hidden bg-transparent">
      <div className="px-4 py-2 shrink-0 border-b bg-muted/10">
        <TabsList className="w-full grid grid-cols-2 h-8 bg-muted/20">
          <TabsTrigger value="find" className="flex items-center gap-2 text-xs">
            <Search className="h-3.5 w-3.5" />
            查找替换
          </TabsTrigger>
          <TabsTrigger value="lookup" disabled={!workId} className="flex items-center gap-2 text-xs">
            <FileSearch className="h-3.5 w-3.5" />
            设定速查
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="find" className="flex-1 overflow-hidden mt-0 p-4">
        <FindReplace editor={editor} embedded />
      </TabsContent>

      {workId && (
        <TabsContent value="lookup" className="flex-1 flex flex-col overflow-hidden mt-0">
          <div className="px-4 py-3 shrink-0 space-y-3 border-b">
            <div className="flex gap-2">
              <Input
                placeholder="搜索设定..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-8 text-sm"
              />
              <Button onClick={handleSearch} size="sm" className="h-8 px-3" aria-label="搜索">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {sources.length > 0 && (
            <Tabs defaultValue={sources[0].name} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-2 shrink-0">
                <TabsList className="w-full justify-start h-8 bg-transparent p-0 border-b rounded-none">
                  {sources.map((source) => (
                    <TabsTrigger
                      key={source.name}
                      value={source.name}
                      className="flex items-center gap-1 px-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none transition-none"
                    >
                      {source.icon}
                      {source.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {sources.map((source) => (
                <TabsContent key={source.name} value={source.name} className="flex-1 overflow-hidden mt-0 px-4 py-2">
                  <LookupContent
                    source={source}
                    workId={workId}
                    searchTerm={searchTerm}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </TabsContent>
      )}
    </Tabs>
  );

  if (embedded) {
    return <div className="h-full w-full bg-transparent">{content}</div>;
  }

  return (
    <SidePanelContainer
      title="搜索工具"
      icon={<Search className="h-4 w-4" />}
      isOpen={isOpen}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onClose={onClose}
    >
      {content}
    </SidePanelContainer>
  );
}
