## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局
9. 创建了首页，包括统计卡片、最近作品和快速操作组件
10. 创建了主题切换按钮
11. 创建了作品列表页面
12. 创建了新作品页面
13. 安装了表单处理和验证相关的依赖
14. 创建了章节管理页面
15. 创建了草稿箱页面
16. 集成了Tiptap编辑器并创建了编辑器组件
17. 创建了章节编辑页面
18. 创建了AI写作助手的基础设置和Hook
19. 创建了角色管理与世界观设定的基础类型、模拟数据、详情页面，并整合了AI写作助手与作品关联

## 第20步：设定速查功能

在完成了角色管理和世界观设定的基本功能后，我们需要实现设定速查功能，让作家在写作过程中能够快速查阅角色和世界观设定，保持创作的一致性。这个功能对于长篇小说创作尤为重要，可以避免出现角色设定或世界观设定的前后矛盾。

**执行命令**：
```
mkdir -p src/components/common/lookup
mkdir -p src/hooks/lookup
touch src/components/common/lookup/SettingsLookup.tsx
touch src/components/common/lookup/CharacterCard.tsx
touch src/components/common/lookup/WorldItemCard.tsx
touch src/hooks/lookup/useLookup.ts
```

**创建文件**：`src/hooks/lookup/useLookup.ts`

```tsx
import { useState, useCallback } from 'react';
import { Character } from '@/types/character';
import { WorldItem } from '@/types/worldbuilding';
import { mockGetCharactersByWorkId } from '@/lib/character-mock-data';
import { mockGetWorldItemsByWorkId } from '@/lib/worldbuilding-mock-data';

/**
 * 设定速查Hook
 * 提供快速查询角色和世界观设定的功能
 */
export function useLookup() {
  // 状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 加载作品的所有设定
   */
  const loadSettings = useCallback(async (workId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 并行加载角色和世界观设定
      const [charactersResult, worldItemsResult] = await Promise.all([
        mockGetCharactersByWorkId(workId),
        mockGetWorldItemsByWorkId(workId)
      ]);
      
      setCharacters(charactersResult);
      setWorldItems(worldItemsResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载设定数据时发生错误';
      setError(errorMessage);
      console.error("加载设定数据错误:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 搜索设定
   */
  const searchSettings = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  /**
   * 过滤后的角色列表
   */
  const filteredCharacters = searchTerm
    ? characters.filter(char => 
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        char.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.background?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : characters;
  
  /**
   * 过滤后的世界观设定列表
   */
  const filteredWorldItems = searchTerm
    ? worldItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : worldItems;
  
  return {
    characters: filteredCharacters,
    worldItems: filteredWorldItems,
    isLoading,
    error,
    searchTerm,
    loadSettings,
    searchSettings
  };
}
```

**创建文件**：`src/components/common/lookup/CharacterCard.tsx`

```tsx
import { Character } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{character.name}</CardTitle>
            <CardDescription>{character.occupation || '未知职业'}</CardDescription>
          </div>
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
          {character.personality && character.personality.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">性格：</span>
              <span>{character.personality.join('、')}</span>
            </div>
          )}
          
          {character.abilities && character.abilities.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">能力：</span>
              <span>{character.abilities.join('、')}</span>
            </div>
          )}
          
          {character.background && (
            <div className="mb-2">
              <span className="font-medium">背景：</span>
              <p className="mt-1 text-muted-foreground line-clamp-3">{character.background}</p>
            </div>
          )}
          
          {character.appearance && (
            <div>
              <span className="font-medium">外貌：</span>
              <p className="mt-1 text-muted-foreground line-clamp-2">{character.appearance}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
```

**创建文件**：`src/components/common/lookup/WorldItemCard.tsx`

```tsx
import { WorldItem, worldItemTypeOptions } from '@/types/worldbuilding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface WorldItemCardProps {
  worldItem: WorldItem;
}

export function WorldItemCard({ worldItem }: WorldItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // 获取设定类型标签
  const typeLabel = worldItemTypeOptions.find(opt => opt.value === worldItem.type)?.label || worldItem.type;
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{worldItem.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-1 text-xs">
                {typeLabel}
              </Badge>
            </CardDescription>
          </div>
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
      <CardContent className="text-sm pt-0">
        <p className="text-muted-foreground line-clamp-2">{worldItem.description}</p>
        
        {expanded && worldItem.details && (
          <div className="mt-2">
            <span className="font-medium">详细信息：</span>
            <p className="mt-1 text-muted-foreground">{worldItem.details}</p>
          </div>
        )}
        
        {expanded && worldItem.tags.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">标签：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {worldItem.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**执行命令**：
```
pnpm dlx shadcn@latest add scroll-area
```

**创建文件**：`src/components/common/lookup/SettingsLookup.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Globe } from 'lucide-react';
import { useLookup } from '@/hooks/lookup/useLookup';
import { CharacterCard } from './CharacterCard';
import { WorldItemCard } from './WorldItemCard';

interface SettingsLookupProps {
  workId: string;
}

export function SettingsLookup({ workId }: SettingsLookupProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { characters, worldItems, isLoading, loadSettings, searchSettings } = useLookup();
  
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
    if (e.key === 'Enter') {
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
            <Button onClick={handleSearch}>
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
            <TabsTrigger value="worldbuilding" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              世界观 ({worldItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="characters" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">加载中...</div>
            ) : characters.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput ? '没有找到匹配的角色' : '该作品还没有角色'}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {characters.map((character) => (
                    <CharacterCard key={character.id} character={character} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="worldbuilding" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">加载中...</div>
            ) : worldItems.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput ? '没有找到匹配的世界观设定' : '该作品还没有世界观设定'}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {worldItems.map((worldItem) => (
                    <WorldItemCard key={worldItem.id} worldItem={worldItem} />
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
```

**修改文件**：`src/app/(main)/chapters/[id]/edit/page.tsx`

在章节编辑页面中添加设定速查按钮，让作家在写作过程中能够快速查阅角色和世界观设定。

```tsx
// 导入设定速查组件
import { SettingsLookup } from '@/components/common/lookup/SettingsLookup';

  {/* 页面标题和返回按钮 */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">返回</span>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">编辑章节</h1>
        <p className="text-muted-foreground">编辑章节内容，自动保存草稿。</p>
      </div>
    </div>
    
    {/* 添加设定速查按钮 */}
    {workId && (
      <SettingsLookup workId={workId} />
    )}
  </div>
```

**执行目的**：
1. **设定速查功能**：创建设定速查功能，让作家在写作过程中能够快速查阅角色和世界观设定
2. **搜索功能**：提供搜索功能，方便作家快速找到需要的设定信息
3. **分类展示**：使用选项卡分类展示角色和世界观设定，提高信息查找效率
4. **简洁展示**：使用可折叠卡片展示设定信息，默认显示简要信息，点击展开查看详情
5. **写作集成**：将设定速查功能集成到章节编辑页面，方便作家在写作过程中随时查阅

**替代方案**：
- **侧边固定面板**：可以使用固定在编辑器一侧的面板展示设定信息，但这会占用宝贵的屏幕空间
- **悬浮提示**：可以在编辑器中输入角色名或设定名时显示悬浮提示，但这需要更复杂的文本分析
- **单独页面**：可以使用单独的页面展示设定信息，但这会打断写作流程，降低效率

设定速查功能是小说创作管理系统的重要辅助工具，可以帮助作家保持角色和世界观设定的一致性，提高创作质量。通过简洁的界面和便捷的搜索功能，作家可以在写作过程中随时查阅需要的设定信息，避免出现前后矛盾的情况。

## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局
9. 创建了首页，包括统计卡片、最近作品和快速操作组件
10. 创建了主题切换按钮
11. 创建了作品列表页面
12. 创建了新作品页面
13. 安装了表单处理和验证相关的依赖
14. 创建了章节管理页面
15. 创建了草稿箱页面
16. 集成了Tiptap编辑器并创建了编辑器组件
17. 创建了章节编辑页面
18. 创建了AI写作助手的基础设置和Hook
19. 创建了角色管理与世界观设定的基础类型、模拟数据、详情页面，并整合了AI写作助手与作品关联

## 第20步：设定速查功能

在完成了角色管理和世界观设定的基本功能后，我们需要实现设定速查功能，让作家在写作过程中能够快速查阅角色和世界观设定，保持创作的一致性。这个功能对于长篇小说创作尤为重要，可以避免出现角色设定或世界观设定的前后矛盾。

**执行命令**：
```
mkdir -p frontend/components/common/lookup
touch frontend/components/common/lookup/SettingsLookup.tsx
touch frontend/components/common/lookup/CharacterCard.tsx
touch frontend/components/common/lookup/WorldItemCard.tsx
touch frontend/hooks/lookup/useLookup.ts
```

**创建文件**：`frontend/hooks/lookup/useLookup.ts`

```tsx
import { useState, useCallback } from 'react';
import { Character } from '@/types/character';
import { WorldItem } from '@/types/worldbuilding';
import { mockGetCharactersByWorkId } from '@/lib/character-mock-data';
import { mockGetWorldItemsByWorkId } from '@/lib/worldbuilding-mock-data';

/**
 * 设定速查Hook
 * 提供快速查询角色和世界观设定的功能
 */
export function useLookup() {
  // 状态
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 加载作品的所有设定
   */
  const loadSettings = useCallback(async (workId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 并行加载角色和世界观设定
      const [charactersResult, worldItemsResult] = await Promise.all([
        mockGetCharactersByWorkId(workId),
        mockGetWorldItemsByWorkId(workId)
      ]);
      
      setCharacters(charactersResult);
      setWorldItems(worldItemsResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载设定数据时发生错误';
      setError(errorMessage);
      console.error("加载设定数据错误:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 搜索设定
   */
  const searchSettings = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);
  
  /**
   * 过滤后的角色列表
   */
  const filteredCharacters = searchTerm
    ? characters.filter(char => 
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        char.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.background?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : characters;
  
  /**
   * 过滤后的世界观设定列表
   */
  const filteredWorldItems = searchTerm
    ? worldItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : worldItems;
  
  return {
    characters: filteredCharacters,
    worldItems: filteredWorldItems,
    isLoading,
    error,
    searchTerm,
    loadSettings,
    searchSettings
  };
}
```

**创建文件**：`frontend/components/common/lookup/CharacterCard.tsx`

```tsx
import { Character } from '@/types/character';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{character.name}</CardTitle>
            <CardDescription>{character.occupation || '未知职业'}</CardDescription>
          </div>
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
          {character.personality && character.personality.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">性格：</span>
              <span>{character.personality.join('、')}</span>
            </div>
          )}
          
          {character.abilities && character.abilities.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">能力：</span>
              <span>{character.abilities.join('、')}</span>
            </div>
          )}
          
          {character.background && (
            <div className="mb-2">
              <span className="font-medium">背景：</span>
              <p className="mt-1 text-muted-foreground line-clamp-3">{character.background}</p>
            </div>
          )}
          
          {character.appearance && (
            <div>
              <span className="font-medium">外貌：</span>
              <p className="mt-1 text-muted-foreground line-clamp-2">{character.appearance}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
```

**创建文件**：`frontend/components/common/lookup/WorldItemCard.tsx`

```tsx
import { WorldItem, worldItemTypeOptions } from '@/types/worldbuilding';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface WorldItemCardProps {
  worldItem: WorldItem;
}

export function WorldItemCard({ worldItem }: WorldItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // 获取设定类型标签
  const typeLabel = worldItemTypeOptions.find(opt => opt.value === worldItem.type)?.label || worldItem.type;
  
  return (
    <Card className="mb-3">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{worldItem.name}</CardTitle>
            <CardDescription>
              <Badge variant="outline" className="mt-1 text-xs">
                {typeLabel}
              </Badge>
            </CardDescription>
          </div>
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
      <CardContent className="text-sm pt-0">
        <p className="text-muted-foreground line-clamp-2">{worldItem.description}</p>
        
        {expanded && worldItem.details && (
          <div className="mt-2">
            <span className="font-medium">详细信息：</span>
            <p className="mt-1 text-muted-foreground">{worldItem.details}</p>
          </div>
        )}
        
        {expanded && worldItem.tags.length > 0 && (
          <div className="mt-2">
            <span className="font-medium">标签：</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {worldItem.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**创建文件**：`frontend/components/common/lookup/SettingsLookup.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Globe } from 'lucide-react';
import { useLookup } from '@/hooks/lookup/useLookup';
import { CharacterCard } from './CharacterCard';
import { WorldItemCard } from './WorldItemCard';

interface SettingsLookupProps {
  workId: string;
}

export function SettingsLookup({ workId }: SettingsLookupProps) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const { characters, worldItems, isLoading, loadSettings, searchSettings } = useLookup();
  
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
    if (e.key === 'Enter') {
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
            <Button onClick={handleSearch}>
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
            <TabsTrigger value="worldbuilding" className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              世界观 ({worldItems.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="characters" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">加载中...</div>
            ) : characters.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput ? '没有找到匹配的角色' : '该作品还没有角色'}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {characters.map((character) => (
                    <CharacterCard key={character.id} character={character} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="worldbuilding" className="mt-0">
            {isLoading ? (
              <div className="py-4 text-center text-muted-foreground">加载中...</div>
            ) : worldItems.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {searchInput ? '没有找到匹配的世界观设定' : '该作品还没有世界观设定'}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="pr-4">
                  {worldItems.map((worldItem) => (
                    <WorldItemCard key={worldItem.id} worldItem={worldItem} />
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
```

**修改文件**：`novel/frontend/src/app/(main)/chapters/[id]/edit/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor, EditorContent } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SettingsLookup } from "@/components/common/lookup/SettingsLookup";

// 修改模拟章节数据，添加workId字段
const mockChapters: Record<string, EditorContent & { workId: string }> = {
  "1-1": {
    title: "第一章 意外得到仙家传承",
    content:
      "<p>李青是一个普通的农村青年，从小就对种植有着浓厚的兴趣。他家祖祖辈辈都是种地的，但收成一直平平，生活也过得紧巴巴的。</p><p>这一天，李青像往常一样在自家的地里忙活。突然，他的锄头碰到了一个硬物。他以为是石头，便弯腰去捡，却发现那是一个古朴的小盒子。</p><p>好奇心驱使下，他打开了盒子，里面是一本泛黄的古书和一颗晶莹剔透的种子。古书上写着《仙农传承》四个大字。</p><p>当李青的手触碰到那本书的瞬间，一股奇异的能量涌入他的体内。他惊讶地发现，自己竟然能够感知到周围植物的生命力，甚至能够通过意念影响它们的生长。</p><p>这一刻，李青知道自己的人生将彻底改变。他决定按照古书上的指引，将那颗神秘的种子种下，开始了自己的修仙种田之路。</p>",
    workId: "work-1" // 添加作品ID
  },
  "1-2": {
    title: "第二章 初试灵力",
    content: `<p>回到家后，李青迫不及待地翻阅《仙农传承》。书中记载了许多奇特的种植方法和修炼功法，其中最基础的是"引灵入体"，可以吸收天地间的灵气，提升自身修为。</p><p>按照书上的指导，李青盘腿而坐，调整呼吸，尝试感知周围的灵气。起初，他什么也没感觉到，但坚持了大约一个小时后，他开始隐约感觉到有微弱的能量围绕着自己流动。</p><p>"这就是灵气吗？"李青心中暗想。他按照功法引导这些能量进入体内，顿时感到一股清凉之意流遍全身，疲劳一扫而空。</p><p>第二天清晨，李青来到自家的菜园，决定试试自己的新能力。他将手掌贴在一株长势不佳的白菜上，尝试将一丝灵力输入其中。</p><p>令他惊讶的是，那株白菜以肉眼可见的速度变得更加翠绿挺拔，叶片也更加厚实。这小小的成功让李青兴奋不已，他决定找一块隐蔽的地方，种下那颗神秘的种子。</p>`,
    workId: "work-1" // 添加作品ID
  },
};

// 章节编辑页面组件
export default function ChapterEditPage() {
  // 获取URL参数中的章节ID
  const params = useParams();
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  // 从URL参数中提取章节ID
  const chapterId = params.id as string;

  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState<EditorContent>({
    title: "",
    content: "",
  });
  
  // 添加workId状态
  const [workId, setWorkId] = useState<string>("");

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 加载章节数据
  useEffect(() => {
    // 模拟API请求延迟
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        // 这里将来会调用API获取章节数据
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 从模拟数据中获取章节
        const chapter = mockChapters[chapterId];
        if (chapter) {
          setEditorContent({
            title: chapter.title,
            content: chapter.content
          });
          // 设置workId
          setWorkId(chapter.workId);
        } else {
          console.error(`找不到章节: ${chapterId}`);
          // 如果找不到章节，可以重定向到章节列表
          // router.push('/chapters');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId, router]);

  // 保存章节
  const handleSave = async (content: EditorContent) => {
    // 这里将来会调用API保存章节
    console.log("保存章节:", chapterId, content);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 更新本地数据
    if (mockChapters[chapterId]) {
      mockChapters[chapterId] = {
        ...content,
        workId: mockChapters[chapterId].workId
      };
    }
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">返回</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">编辑章节</h1>
            <p className="text-muted-foreground">编辑章节内容，自动保存草稿。</p>
          </div>
        </div>
        
        {/* 添加设定速查按钮 */}
        {workId && (
          <SettingsLookup workId={workId} />
        )}
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              正在加载章节内容...
            </p>
          </div>
        </div>
      ) : (
        /* Tiptap编辑器 */
        <TiptapEditor
          initialContent={editorContent}
          onSave={handleSave}
          placeholder="开始编写您的章节内容..."
          autoFocus
        />
      )}

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/chapters">返回章节列表</Link>
        </Button>
        <div className="space-x-2">
          <Button variant="outline">保存为草稿</Button>
          <Button>发布章节</Button>
        </div>
      </div>
    </div>
  );
}
```

**执行目的**：
1. **设定速查功能**：创建设定速查功能，让作家在写作过程中能够快速查阅角色和世界观设定
2. **搜索功能**：提供搜索功能，方便作家快速找到需要的设定信息
3. **分类展示**：使用选项卡分类展示角色和世界观设定，提高信息查找效率
4. **简洁展示**：使用可折叠卡片展示设定信息，默认显示简要信息，点击展开查看详情
5. **写作集成**：将设定速查功能集成到章节编辑页面，方便作家在写作过程中随时查阅

**替代方案**：
- **侧边固定面板**：可以使用固定在编辑器一侧的面板展示设定信息，但这会占用宝贵的屏幕空间
- **悬浮提示**：可以在编辑器中输入角色名或设定名时显示悬浮提示，但这需要更复杂的文本分析
- **单独页面**：可以使用单独的页面展示设定信息，但这会打断写作流程，降低效率

设定速查功能是小说创作管理系统的重要辅助工具，可以帮助作家保持角色和世界观设定的一致性，提高创作质量。通过简洁的界面和便捷的搜索功能，作家可以在写作过程中随时查阅需要的设定信息，避免出现前后矛盾的情况。
