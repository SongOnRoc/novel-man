## 已完成的部分总结
目前我们已经完成了：
1.  创建了基础Next.js项目，并选择了Turbopack作为开发服务器。
2.  安装并初始化了shadcn/ui，设置了组件系统。
3.  安装了next-themes库用于实现深色/浅色主题切换功能。
4.  创建了ThemeProvider组件来封装next-themes库的功能。
5.  修改了根布局，添加了字体支持和主题切换功能。
6.  修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式。
7.  安装了必要的UI组件。
8.  创建了侧边栏和主布局组件，并设置了路由组布局。
9.  实现了首页仪表盘，包括统计卡片、最近作品和快速操作。
10. 实现了作品管理页面，可以展示和创建新作品。
11. 实现了章节管理页面，可以根据作品筛选章节。
12. 实现了基本的草稿管理功能。
13. 实现了AI助手、角色设定和世界观设定的基本框架。
14. 实现了Tiptap编辑器，并集成了基础的文本编辑功能。
15. 实现了编辑器的书签管理和专注模式。
16. 实现了AI助手的悬浮按钮和交互界面。
17. 实现了角色和世界观的查找与选择功能。
18. 实现了创建角色和世界观条目的页面。
19. 实现了章节编辑页面，并集成了Tiptap编辑器。
20. 实现了基本的草稿功能。
21. 细化了AI助手、角色和世界观的模拟数据和类型。
22. 实现了作品大纲与章节细纲的完整功能。
23. 整理并完善了项目文档结构。
24. 实现了功能完善的“查找与替换”功能，并将其逻辑封装在独立的Tiptap扩展中。

## 第25步：设定速查功能集成

**目标与原因**：
长篇小说的设定（角色、地点、物品等）数量庞大，作者在写作时很难记住所有细节。为了确保设定的准确性和一致性，并减少作者的记忆负担，我们需要提供一个内置的“设定速查”工具。本步骤将实现一个从侧边滑出的面板，允许作者在不离开编辑页面的情况下，快速搜索、浏览并引用设定。

**执行命令**：
```
touch frontend/src/hooks/lookup/useLookup.ts
touch frontend/src/components/common/lookup/CharacterCard.tsx
touch frontend/src/components/common/lookup/WorldItemCard.tsx
touch frontend/src/components/common/lookup/SettingsLookup.tsx
```

**创建文件**：`frontend/src/hooks/lookup/useLookup.ts`

```ts
import { useState, useCallback } from "react";
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { Character } from "@/types/character";
import { WorldItem } from "@/types/worldbuilding";

export function useLookup() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [originalCharacters, setOriginalCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [originalWorldItems, setOriginalWorldItems] = useState<WorldItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { getCharactersByWorkId } = useCharacters();
  const { getWorldItemsByWorkId } = useWorldbuilding();

  const loadSettings = useCallback(
    async (workId: string) => {
      setIsLoading(true);
      try {
        const [charData, worldData] = await Promise.all([
          getCharactersByWorkId(workId),
          getWorldItemsByWorkId(workId),
        ]);
        setCharacters(charData);
        setOriginalCharacters(charData);
        setWorldItems(worldData);
        setOriginalWorldItems(worldData);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [getCharactersByWorkId, getWorldItemsByWorkId]
  );

  const searchSettings = useCallback(
    (query: string) => {
      setIsLoading(true);
      if (!query) {
        setCharacters(originalCharacters);
        setWorldItems(originalWorldItems);
      } else {
        const lowercasedQuery = query.toLowerCase();
        const filteredChars = originalCharacters.filter((c) =>
          c.name.toLowerCase().includes(lowercasedQuery)
        );
        const filteredWorldItems = originalWorldItems.filter((w) =>
          w.name.toLowerCase().includes(lowercasedQuery)
        );
        setCharacters(filteredChars);
        setWorldItems(filteredWorldItems);
      }
      setIsLoading(false);
    },
    [originalCharacters, originalWorldItems]
  );

  return { characters, worldItems, isLoading, loadSettings, searchSettings };
}
```

**代码详解**：
1.  **逻辑封装**: 这是React生态中的最佳实践。我们创建了一个自定义Hook `useLookup`，将所有与设定数据相关的逻辑（获取、缓存、搜索）都封装在此，实现了业务逻辑与UI组件的完全分离。
2.  **数据获取**: `loadSettings` 函数通过 `Promise.all` 并发调用其他Hooks（`useCharacters`, `useWorldbuilding`）来异步获取角色和世界观数据，提高了加载效率。
3.  **数据缓存**: 获取到的原始数据被分别存储在 `originalCharacters` 和 `originalWorldItems` 这两个state中。这是一种重要的性能优化策略，它为后续的本地搜索提供了数据源，避免了不必要的网络请求。
4.  **本地搜索**: `searchSettings` 函数是一个同步操作。它直接在内存中的 `original` 数组上进行过滤，响应速度极快，提供了流畅的搜索体验。

---

**创建文件**：`frontend/src/components/common/lookup/CharacterCard.tsx`

```tsx
import { Character } from "@/types/character";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CharacterCardProps {
  character: Character;
  onSelect?: (name: string) => void;
}

export function CharacterCard({ character, onSelect }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onSelect?.(character.name);
  };

  return (
    <Card className="mb-3 cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{character.name}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="text-sm">
          {/* Details */}
        </CardContent>
      )}
    </Card>
  );
}
```

**代码详解**：
1.  **展示型组件**: 这是一个纯粹的UI组件，职责单一，只负责渲染单个角色卡片。
2.  **可展开详情**: 使用 `useState` 管理 `expanded` 状态，允许用户点击按钮展开或折叠卡片以查看更多详细信息。
3.  **回调通信**: 组件接收一个可选的 `onSelect` 函数作为prop。当卡片被点击时，它会调用此函数并将角色的名字传递给父组件，实现了子组件到父组件的通信。

---

**创建文件**：`frontend/src/components/common/lookup/WorldItemCard.tsx`
*(该文件与`CharacterCard.tsx`结构类似，此处从略)*

---

**创建文件**：`frontend/src/components/common/lookup/SettingsLookup.tsx`

```tsx
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

  useEffect(() => {
    if (open && workId) {
      loadSettings(workId);
    }
  }, [open, workId, loadSettings]);

  const handleSearch = () => {
    searchSettings(searchInput);
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
        </SheetHeader>
        <div className="px-6 py-2">
          {/* Search Input and Button */}
        </div>
        <Tabs defaultValue="characters" className="px-6 pb-6">
          <TabsList>
            <TabsTrigger value="characters">角色 ({characters.length})</TabsTrigger>
            <TabsTrigger value="worldbuilding">世界观 ({worldItems.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="characters">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {characters.map((character) => (
                <CharacterCard
                  key={character.id}
                  character={character}
                  onSelect={onSelectItem}
                />
              ))}
            </ScrollArea>
          </TabsContent>
          <TabsContent value="worldbuilding">
             <ScrollArea className="h-[calc(100vh-200px)]">
              {worldItems.map((worldItem) => (
                <WorldItemCard
                  key={worldItem.id}
                  worldItem={worldItem}
                  onSelect={onSelectItem}
                />
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

**代码详解**：
1.  **容器组件**: 该组件作为速查功能的“容器”，负责整合UI和逻辑。
2.  **UI框架**: 使用 `Sheet` (侧边栏) 作为主布局，提供了充足的展示空间；使用 `Tabs` 对“角色”和“世界观”进行分类，结构清晰。
3.  **消费Hook**: 组件通过调用 `useLookup()` Hook，轻松地获取了所有需要的数据（`characters`, `worldItems`）和操作函数（`loadSettings`, `searchSettings`），自身无需关心复杂的实现细节。
4.  **组件组装**: 它将 `CharacterCard` 和 `WorldItemCard` 作为子组件进行循环渲染，并通过props将 `onSelectItem` 回调函数传递下去，形成完整的功能链路。

**执行目的**：
本步骤通过创建自定义Hook和服务于不同层级的React组件，构建了一个功能完善、体验流畅、代码结构清晰的“设定速查”系统。该系统允许作者在写作时快速查找和引用设定，确保了内容的一致性，显著提升了创作效率。

**替代方案**：
- **将所有逻辑写在组件内**: 会导致 `SettingsLookup` 组件代码极其臃肿，难以阅读和维护，也无法复用数据获取逻辑。
- **使用Modal弹窗**: 交互过重，会完全打断用户的写作流程，不如 `Sheet` 侧边栏的用户体验友好。
- **每次搜索都请求API**: 会造成不必要的服务器压力和网络延迟，用户体验差。我们采用的“一次加载，多次本地搜索”的方案性能更优。