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

## 第19步：角色管理与世界观设定 - 第1部分：基础类型与模拟数据

在完成了AI写作助手功能后，我们需要继续实现用户需求中的角色管理和世界观设定功能。这些功能对于小说创作至关重要，能帮助作家保持角色和世界设定的一致性，提高创作质量。

首先，我们需要创建基础的类型定义、模拟数据和工具页面入口，为后续的组件开发提供基础。

**执行命令**：
```
mkdir -p src/types/character
mkdir -p src/types/worldbuilding
mkdir -p src/lib
mkdir -p src/hooks/character
mkdir -p src/hooks/worldbuilding
mkdir -p src/app/\(main\)/tools
touch src/types/character/index.ts
touch src/types/worldbuilding/index.ts
touch src/lib/character-mock-data.ts
touch src/lib/worldbuilding-mock-data.ts
touch src/hooks/character/useCharacters.ts
touch src/hooks/worldbuilding/useWorldbuilding.ts
touch src/app/\(main\)/tools/page.tsx
```

**创建文件**：`src/types/character/index.ts`

```tsx
// 角色基本信息
export interface Character {
  id: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 角色关系类型
export type RelationshipType = 
  | 'family' // 家人
  | 'friend' // 朋友
  | 'lover' // 恋人
  | 'enemy' // 敌人
  | 'master' // 师傅
  | 'disciple' // 弟子
  | 'ally' // 盟友
  | 'rival' // 竞争对手
  | 'subordinate' // 下属
  | 'superior'; // 上级

// 角色关系
export interface CharacterRelationship {
  id: string;
  sourceId: string; // 源角色ID
  targetId: string; // 目标角色ID
  type: RelationshipType;
  description?: string;
}

// 创建角色请求
export interface CreateCharacterRequest {
  name: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
}

// 更新角色请求
export interface UpdateCharacterRequest extends Partial<CreateCharacterRequest> {
  id: string;
}
```

**创建文件**：`src/types/worldbuilding/index.ts`

```tsx
// 世界观设定类型
export type WorldItemType = 
  | 'location' // 地点
  | 'organization' // 组织/势力
  | 'item' // 物品
  | 'event' // 事件
  | 'system' // 系统(如修真、魔法)
  | 'custom'; // 自定义类型

// 世界观设定项
export interface WorldItem {
  id: string;
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string; // 详细描述，可以是富文本
  tags: string[]; // 标签，用于分类和搜索
  relatedItems?: string[]; // 相关设定项的ID
  createdAt: string;
  updatedAt: string;
}

// 创建世界观设定请求
export interface CreateWorldItemRequest {
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string;
  tags: string[];
  relatedItems?: string[];
}

// 更新世界观设定请求
export interface UpdateWorldItemRequest extends Partial<CreateWorldItemRequest> {
  id: string;
}

// 世界观设定类型选项
export const worldItemTypeOptions = [
  { value: 'location', label: '地点/场景' },
  { value: 'organization', label: '势力/组织' },
  { value: 'item', label: '物品/法宝' },
  { value: 'event', label: '事件/历史' },
  { value: 'system', label: '系统/规则' },
  { value: 'custom', label: '自定义类型' },
];
```

**创建文件**：`src/lib/character-mock-data.ts`

```tsx
import { Character, CharacterRelationship, CreateCharacterRequest, UpdateCharacterRequest } from "@/types/character";

// 模拟角色数据
export const mockCharacters: Character[] = [
  {
    id: "char-1",
    name: "林逸风",
    avatar: "/avatars/char-1.jpg",
    age: 25,
    gender: "male",
    occupation: "修真者",
    background: "出身于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。被一位隐居的老者收养，学习了独特的炼丹技术。",
    personality: ["坚韧", "聪慧", "重情义", "谨慎"],
    abilities: ["火属性灵力", "炼丹术", "基础剑法"],
    appearance: "身材修长，面容俊朗，眉宇间透露着坚毅。右手手腕上有一道蜿蜒的疤痕，是幼时逃亡时留下的。",
    notes: "主角，性格成长轨迹：从复仇到救世。",
    createdAt: "2023-01-15T08:30:00Z",
    updatedAt: "2023-03-20T14:15:00Z",
  },
  {
    id: "char-2",
    name: "沈月",
    avatar: "/avatars/char-2.jpg",
    age: 23,
    gender: "female",
    occupation: "丹药师",
    background: "丹药世家出身，天赋异禀，年纪轻轻就成为宗门重点培养的丹药师。性格直爽，与林逸风在一次历练中相识。",
    personality: ["直率", "聪颖", "善良", "固执"],
    abilities: ["丹药精通", "水属性灵力", "医术"],
    appearance: "长发如瀑，眼若秋水，身姿窈窕。手指因长期炼丹而略显粗糙，但动作灵巧。",
    notes: "女主角，与主角的关系从互相竞争到互相扶持。",
    createdAt: "2023-01-20T10:45:00Z",
    updatedAt: "2023-03-25T16:30:00Z",
  },
  {
    id: "char-3",
    name: "莫天阳",
    avatar: "/avatars/char-3.jpg",
    age: 45,
    gender: "male",
    occupation: "宗门长老",
    background: "修真界赫赫有名的强者，表面上是正道宗门的长老，实则暗中勾结魔道，意图颠覆修真界秩序。",
    personality: ["城府深", "野心勃勃", "残忍", "精明"],
    abilities: ["雷属性灵力", "高级阵法", "幻术"],
    appearance: "面容威严，鹰钩鼻，眼神锐利。常着华贵长袍，举止优雅，让人难以联想到其内心的阴暗。",
    notes: "主要反派，与主角有深仇大恨，最终将在修真界大战中败亡。",
    createdAt: "2023-02-05T09:20:00Z",
    updatedAt: "2023-04-10T11:05:00Z",
  },
];

// 模拟角色关系数据
export const mockRelationships: CharacterRelationship[] = [
  {
    id: "rel-1",
    sourceId: "char-1",
    targetId: "char-2",
    type: "ally",
    description: "共同历练中结识，互相扶持，逐渐产生感情。",
  },
  {
    id: "rel-2",
    sourceId: "char-1",
    targetId: "char-3",
    type: "enemy",
    description: "莫天阳是灭门惨案的幕后黑手，林逸风立志复仇。",
  },
  {
    id: "rel-3",
    sourceId: "char-2",
    targetId: "char-3",
    type: "superior",
    description: "沈月表面上是莫天阳的弟子，实则在暗中调查其罪行。",
  },
];

// 模拟获取所有角色
export async function mockGetAllCharacters(): Promise<Character[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockCharacters];
}

// 模拟获取单个角色
export async function mockGetCharacterById(id: string): Promise<Character | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  const character = mockCharacters.find(char => char.id === id);
  return character || null;
}

// 模拟创建角色
export async function mockCreateCharacter(data: CreateCharacterRequest): Promise<Character> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const now = new Date().toISOString();
  const newCharacter: Character = {
    id: `char-${mockCharacters.length + 1}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  mockCharacters.push(newCharacter);
  return newCharacter;
}

// 模拟更新角色
export async function mockUpdateCharacter(data: UpdateCharacterRequest): Promise<Character> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const index = mockCharacters.findIndex(char => char.id === data.id);
  if (index === -1) {
    throw new Error(`角色不存在: ${data.id}`);
  }
  
  const now = new Date().toISOString();
  const updatedCharacter: Character = {
    ...mockCharacters[index],
    ...data,
    updatedAt: now,
  };
  
  mockCharacters[index] = updatedCharacter;
  return updatedCharacter;
}

// 模拟删除角色
export async function mockDeleteCharacter(id: string): Promise<boolean> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockCharacters.findIndex(char => char.id === id);
  if (index === -1) {
    return false;
  }
  
  mockCharacters.splice(index, 1);
  return true;
}
```

**创建文件**：`src/lib/worldbuilding-mock-data.ts`

```tsx
import { WorldItem, WorldItemType, CreateWorldItemRequest, UpdateWorldItemRequest } from "@/types/worldbuilding";

// 模拟世界观设定数据
export const mockWorldItems: WorldItem[] = [
  {
    id: "world-1",
    name: "灵气体系",
    type: "system",
    description: "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。",
    details: "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。灵气分为五行属性：金、木、水、火、土，以及更为稀有的雷、风、光、暗等属性。修炼者通过吸收灵气提升修为，经历炼气、筑基、金丹、元婴、化神等境界。",
    tags: ["修真体系", "灵气", "五行"],
    relatedItems: ["world-3"],
    createdAt: "2023-01-10T08:00:00Z",
    updatedAt: "2023-02-15T14:30:00Z",
  },
  {
    id: "world-2",
    name: "青云宗",
    type: "organization",
    description: "修真界五大宗门之一，以炼丹术闻名天下。",
    image: "/worldbuilding/qingyun.jpg",
    details: "修真界五大宗门之一，以炼丹术闻名天下，门规严苛，弟子众多。坐落于灵气充沛的青云山脉，有"丹道正宗"之称。宗主青云子已有千年道行，为当世少有的大能。宗门内分为内门、外门和杂役，设有炼丹堂、藏经阁、执法堂等机构。",
    tags: ["宗门", "势力", "炼丹"],
    relatedItems: ["world-1"],
    createdAt: "2023-01-15T10:20:00Z",
    updatedAt: "2023-03-05T16:45:00Z",
  },
  {
    id: "world-3",
    name: "天元大陆",
    type: "location",
    description: "故事发生的主要大陆，分为东南西北中五大区域。",
    image: "/worldbuilding/continent.jpg",
    details: "天元大陆是一片广袤的大陆，分为东南西北中五大区域，每个区域都有不同的地理特征和文化。东域多山多水，灵气充沛，是大多数修真宗门的所在地；南域气候温暖，适合种植灵草灵药；西域多沙漠戈壁，环境恶劣，但蕴含特殊资源；北域终年冰雪，是一些特殊功法的修炼圣地；中域则是人类王朝的所在，凡人与修真者共存。",
    tags: ["地理", "大陆", "区域划分"],
    relatedItems: [],
    createdAt: "2023-01-05T09:15:00Z",
    updatedAt: "2023-02-20T11:30:00Z",
  },
];

// 模拟获取所有世界观设定
export async function mockGetAllWorldItems(): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...mockWorldItems];
}

// 模拟获取单个世界观设定
export async function mockGetWorldItemById(id: string): Promise<WorldItem | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  const worldItem = mockWorldItems.find(item => item.id === id);
  return worldItem || null;
}

// 模拟创建世界观设定
export async function mockCreateWorldItem(data: CreateWorldItemRequest): Promise<WorldItem> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const now = new Date().toISOString();
  const newWorldItem: WorldItem = {
    id: `world-${mockWorldItems.length + 1}`,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  mockWorldItems.push(newWorldItem);
  return newWorldItem;
}

// 模拟更新世界观设定
export async function mockUpdateWorldItem(data: UpdateWorldItemRequest): Promise<WorldItem> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const index = mockWorldItems.findIndex(item => item.id === data.id);
  if (index === -1) {
    throw new Error(`世界观设定不存在: ${data.id}`);
  }
  
  const now = new Date().toISOString();
  const updatedWorldItem: WorldItem = {
    ...mockWorldItems[index],
    ...data,
    updatedAt: now,
  };
  
  mockWorldItems[index] = updatedWorldItem;
  return updatedWorldItem;
}

// 模拟删除世界观设定
export async function mockDeleteWorldItem(id: string): Promise<boolean> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = mockWorldItems.findIndex(item => item.id === id);
  if (index === -1) {
    return false;
  }
  
  mockWorldItems.splice(index, 1);
  return true;
}
```

**创建文件**：`src/hooks/character/useCharacters.ts`

```tsx
import { useState, useCallback, useEffect } from 'react';
import { Character, CreateCharacterRequest, UpdateCharacterRequest } from '@/types/character';
import { mockGetAllCharacters, mockGetCharacterById, mockCreateCharacter, mockUpdateCharacter, mockDeleteCharacter } from '@/lib/character-mock-data';

/**
 * 角色管理Hook
 * 提供角色列表获取、创建、更新和删除功能
 */
export function useCharacters() {
  // 角色列表
  const [characters, setCharacters] = useState<Character[]>([]);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 获取所有角色
   */
  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mockGetAllCharacters();
      setCharacters(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取角色列表时发生错误';
      setError(errorMessage);
      console.error("获取角色列表错误:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 获取单个角色
   */
  const getCharacter = useCallback(async (id: string) => {
    try {
      return await mockGetCharacterById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取角色信息时发生错误';
      console.error("获取角色信息错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 创建角色
   */
  const createCharacter = useCallback(async (data: CreateCharacterRequest) => {
    try {
      const newCharacter = await mockCreateCharacter(data);
      setCharacters(prev => [...prev, newCharacter]);
      return newCharacter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建角色时发生错误';
      console.error("创建角色错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 更新角色
   */
  const updateCharacter = useCallback(async (data: UpdateCharacterRequest) => {
    try {
      const updatedCharacter = await mockUpdateCharacter(data);
      setCharacters(prev => 
        prev.map(char => char.id === updatedCharacter.id ? updatedCharacter : char)
      );
      return updatedCharacter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新角色时发生错误';
      console.error("更新角色错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 删除角色
   */
  const deleteCharacter = useCallback(async (id: string) => {
    try {
      const success = await mockDeleteCharacter(id);
      if (success) {
        setCharacters(prev => prev.filter(char => char.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除角色时发生错误';
      console.error("删除角色错误:", err);
      return false;
    }
  }, []);
  
  // 初始加载角色列表
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);
  
  return {
    characters,
    isLoading,
    error,
    fetchCharacters,
    getCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter
  };
}
```

**创建文件**：`src/hooks/worldbuilding/useWorldbuilding.ts`

```tsx
import { useState, useCallback, useEffect } from 'react';
import { WorldItem, CreateWorldItemRequest, UpdateWorldItemRequest } from '@/types/worldbuilding';
import { mockGetAllWorldItems, mockGetWorldItemById, mockCreateWorldItem, mockUpdateWorldItem, mockDeleteWorldItem } from '@/lib/worldbuilding-mock-data';

/**
 * 世界观设定Hook
 * 提供世界观设定的获取、创建、更新和删除功能
 */
export function useWorldbuilding() {
  // 世界观设定列表
  const [worldItems, setWorldItems] = useState<WorldItem[]>([]);
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 获取所有世界观设定
   */
  const fetchWorldItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await mockGetAllWorldItems();
      setWorldItems(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取世界观设定列表时发生错误';
      setError(errorMessage);
      console.error("获取世界观设定列表错误:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 获取单个世界观设定
   */
  const getWorldItem = useCallback(async (id: string) => {
    try {
      return await mockGetWorldItemById(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取世界观设定信息时发生错误';
      console.error("获取世界观设定信息错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 创建世界观设定
   */
  const createWorldItem = useCallback(async (data: CreateWorldItemRequest) => {
    try {
      const newWorldItem = await mockCreateWorldItem(data);
      setWorldItems(prev => [...prev, newWorldItem]);
      return newWorldItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建世界观设定时发生错误';
      console.error("创建世界观设定错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 更新世界观设定
   */
  const updateWorldItem = useCallback(async (data: UpdateWorldItemRequest) => {
    try {
      const updatedWorldItem = await mockUpdateWorldItem(data);
      setWorldItems(prev => 
        prev.map(item => item.id === updatedWorldItem.id ? updatedWorldItem : item)
      );
      return updatedWorldItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新世界观设定时发生错误';
      console.error("更新世界观设定错误:", err);
      return null;
    }
  }, []);
  
  /**
   * 删除世界观设定
   */
  const deleteWorldItem = useCallback(async (id: string) => {
    try {
      const success = await mockDeleteWorldItem(id);
      if (success) {
        setWorldItems(prev => prev.filter(item => item.id !== id));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除世界观设定时发生错误';
      console.error("删除世界观设定错误:", err);
      return false;
    }
  }, []);
  
  // 初始加载世界观设定列表
  useEffect(() => {
    fetchWorldItems();
  }, [fetchWorldItems]);
  
  return {
    worldItems,
    isLoading,
    error,
    fetchWorldItems,
    getWorldItem,
    createWorldItem,
    updateWorldItem,
    deleteWorldItem
  };
}
```

**创建文件**：`src/app/(main)/tools/page.tsx`

```tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Globe } from "lucide-react";
import Link from "next/link";
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { useEffect, useState } from "react";

export default function ToolsPage() {
  const { characters, isLoading: charactersLoading } = useCharacters();
  const { worldItems, isLoading: worldItemsLoading } = useWorldbuilding();
  const [mounted, setMounted] = useState(false);
  
  // 处理客户端水合问题
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">创作工具</h1>
          <p className="text-muted-foreground">
            管理角色、世界观设定和其他创作辅助工具
          </p>
        </div>
      </div>

      <Tabs defaultValue="characters" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="characters">角色管理</TabsTrigger>
          <TabsTrigger value="worldbuilding">世界观设定</TabsTrigger>
        </TabsList>
        
        <TabsContent value="characters" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">角色列表</h2>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              创建角色
            </Button>
          </div>
          
          {charactersLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map((character) => (
                <Card key={character.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{character.name}</CardTitle>
                    <CardDescription>{character.occupation || '未知职业'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {character.background || '暂无背景描述'}
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tools/characters/${character.id}`}>
                          查看详情
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="worldbuilding" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">世界观设定</h2>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              创建设定
            </Button>
          </div>
          
          {worldItemsLoading ? (
            <div className="flex justify-center p-8">
              <div className="text-center">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {worldItems.map((worldItem) => (
                <Card key={worldItem.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{worldItem.name}</CardTitle>
                    <CardDescription>
                      {worldItemTypeOptions.find(opt => opt.value === worldItem.type)?.label || worldItem.type}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {worldItem.description}
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/tools/worldbuilding/${worldItem.id}`}>
                          查看详情
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**修改文件**：`src/components/common/layout/AppSidebar.tsx`

在导入部分添加 Tool 图标：

```tsx
import {
  SquareArrowUpRight,
  BarChartIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ShoppingBag,
  ExternalLinkIcon,
  Tool as ToolIcon
} from 'lucide-react';
```

在导航项中添加工具入口：

```tsx
/**
 * 主导航栏
 */
const navMain = [
  {
    title: '探索广场',
    url: '/explore',
    icon: LayoutDashboardIcon,
  },
  {
    title: '实时数据',
    url: '/dashboard',
    icon: BarChartIcon,
  },
  {
    title: '我的项目',
    url: '/project',
    icon: FolderIcon,
  },
  {
    title: '我的领取',
    url: '/received',
    icon: ShoppingBag,
  },
  {
    title: '创作工具',
    url: '/tools',
    icon: ToolIcon,
  },
];
```

**执行目的**：
1. **类型定义**：创建角色和世界观设定相关的类型定义，提供类型安全和自动补全
   - 角色类型包含基本信息、关系类型等
   - 世界观设定类型包含不同类别的设定项

2. **模拟数据**：提供测试数据，使我们能在没有后端API的情况下开发前端
   - 角色模拟数据包含了三个示例角色
   - 世界观模拟数据包含了三个不同类型的设定项
   - 提供了模拟的CRUD操作函数

3. **Hook封装**：将角色和世界观设定的核心逻辑封装在自定义Hook中
   - `useCharacters` 提供角色管理功能
   - `useWorldbuilding` 提供世界观设定管理功能
   - 两个Hook都遵循相似的模式，便于使用和维护

4. **工具页面**：创建工具页面作为角色管理和世界观设定的入口
   - 使用Tabs组件分隔不同功能
   - 展示角色和世界观设定列表
   - 提供创建新内容的入口
   - 使用Card组件展示每个项目的基本信息

5. **导航更新**：在侧边栏中添加工具入口，便于用户访问

**替代方案**：
- **使用Context API代替Hook**：可以使用React Context API来管理状态，但对于MVP版本，自定义Hook更简单直接
- **使用Redux或MobX**：这些状态管理库功能强大，但对于当前需求来说可能过于复杂
- **使用单独的页面**：可以为角色和世界观设定创建单独的页面，但使用标签页可以减少导航层级，提供更好的用户体验
- **使用表格视图**：可以使用表格代替卡片来展示列表，但卡片布局更适合展示丰富的信息和图片

**下一步计划**：
1. 创建角色详情页面和编辑表单
2. 创建世界观设定详情页面和编辑表单
3. 实现角色关系图谱可视化
4. 添加设定速查功能，便于写作时快速查阅

这个实现符合MVP版本的需求，为用户提供了角色管理和世界观设定的基础功能，帮助作家保持角色和世界设定的一致性，提高创作质量。

## 第19步：角色管理与世界观设定 - 第2部分：详情页面与编辑功能

在完成了角色管理和世界观设定的基础类型与模拟数据后，我们需要继续实现详情页面和编辑功能，让用户能够查看和编辑角色与世界观设定的详细信息。

**执行命令**：
```
mkdir -p src/app/\(main\)/tools/characters/\[id\]
mkdir -p src/app/\(main\)/tools/worldbuilding/\[id\]
touch src/app/\(main\)/tools/characters/\[id\]/page.tsx
touch src/app/\(main\)/tools/worldbuilding/\[id\]/page.tsx
```

**创建文件**：`src/app/(main)/tools/characters/[id]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useCharacters } from '@/hooks/character/useCharacters';
import { Character } from '@/types/character';

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCharacter, deleteCharacter } = useCharacters();
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取角色详情
  useEffect(() => {
    const fetchCharacter = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        const characterId = Array.isArray(params.id) ? params.id[0] : params.id;
        const result = await getCharacter(characterId);
        if (result) {
          setCharacter(result);
        } else {
          setError('未找到角色信息');
        }
      } catch (err) {
        setError('加载角色信息失败');
        console.error('Error fetching character:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCharacter();
  }, [params.id, getCharacter]);
  
  // 处理删除角色
  const handleDelete = async () => {
    if (!character) return;
    
    if (confirm(`确定要删除角色 "${character.name}" 吗？此操作不可撤销。`)) {
      try {
        const success = await deleteCharacter(character.id);
        if (success) {
          router.push('/tools');
        } else {
          setError('删除角色失败');
        }
      } catch (err) {
        setError('删除角色时发生错误');
        console.error('Error deleting character:', err);
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }
  
  if (error || !character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-destructive">{error || '未找到角色信息'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tools')}>
          返回角色列表
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push('/tools')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            编辑角色
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除角色
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {character.avatar ? (
                  <img 
                    src={character.avatar} 
                    alt={character.name} 
                    className="rounded-full h-32 w-32 object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="rounded-full h-32 w-32 bg-muted flex items-center justify-center text-2xl font-bold">
                    {character.name.charAt(0)}
                  </div>
                )}
              </div>
              <CardTitle className="text-center text-2xl">{character.name}</CardTitle>
              <CardDescription className="text-center">
                {character.occupation || '未知职业'}
                {character.age && ` • ${character.age}岁`}
                {character.gender && ` • ${character.gender === 'male' ? '男' : character.gender === 'female' ? '女' : '其他'}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-1">性格特点</h3>
                <div className="flex flex-wrap gap-1">
                  {character.personality?.map((trait, index) => (
                    <span key={index} className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                      {trait}
                    </span>
                  )) || <span className="text-muted-foreground text-sm">未设置性格特点</span>}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">能力</h3>
                <div className="flex flex-wrap gap-1">
                  {character.abilities?.map((ability, index) => (
                    <span key={index} className="bg-secondary/10 text-secondary-foreground rounded-full px-2 py-0.5 text-xs">
                      {ability}
                    </span>
                  )) || <span className="text-muted-foreground text-sm">未设置能力</span>}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">创建时间</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(character.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-1">最后更新</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(character.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-2/3">
          <Tabs defaultValue="background" className="w-full">
            <TabsList>
              <TabsTrigger value="background">背景故事</TabsTrigger>
              <TabsTrigger value="appearance">外貌描述</TabsTrigger>
              <TabsTrigger value="notes">笔记</TabsTrigger>
              <TabsTrigger value="relationships">关系网络</TabsTrigger>
            </TabsList>
            
            <TabsContent value="background" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>背景故事</CardTitle>
                </CardHeader>
                <CardContent>
                  {character.background ? (
                    <p className="whitespace-pre-line">{character.background}</p>
                  ) : (
                    <p className="text-muted-foreground">暂无背景故事</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>外貌描述</CardTitle>
                </CardHeader>
                <CardContent>
                  {character.appearance ? (
                    <p className="whitespace-pre-line">{character.appearance}</p>
                  ) : (
                    <p className="text-muted-foreground">暂无外貌描述</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>笔记</CardTitle>
                </CardHeader>
                <CardContent>
                  {character.notes ? (
                    <p className="whitespace-pre-line">{character.notes}</p>
                  ) : (
                    <p className="text-muted-foreground">暂无笔记</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="relationships" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>关系网络</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">暂无关系数据，后续版本将添加角色关系图谱可视化功能。</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
```

**创建文件**：`src/app/(main)/tools/worldbuilding/[id]/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Tag } from 'lucide-react';
import { useWorldbuilding } from '@/hooks/worldbuilding/useWorldbuilding';
import { WorldItem, worldItemTypeOptions } from '@/types/worldbuilding';

export default function WorldItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getWorldItem, deleteWorldItem } = useWorldbuilding();
  const [worldItem, setWorldItem] = useState<WorldItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 获取世界观设定详情
  useEffect(() => {
    const fetchWorldItem = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        const itemId = Array.isArray(params.id) ? params.id[0] : params.id;
        const result = await getWorldItem(itemId);
        if (result) {
          setWorldItem(result);
        } else {
          setError('未找到世界观设定信息');
        }
      } catch (err) {
        setError('加载世界观设定信息失败');
        console.error('Error fetching world item:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorldItem();
  }, [params.id, getWorldItem]);
  
  // 处理删除世界观设定
  const handleDelete = async () => {
    if (!worldItem) return;
    
    if (confirm(`确定要删除世界观设定 "${worldItem.name}" 吗？此操作不可撤销。`)) {
      try {
        const success = await deleteWorldItem(worldItem.id);
        if (success) {
          router.push('/tools');
        } else {
          setError('删除世界观设定失败');
        }
      } catch (err) {
        setError('删除世界观设定时发生错误');
        console.error('Error deleting world item:', err);
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }
  
  if (error || !worldItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-destructive">{error || '未找到世界观设定信息'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/tools')}>
          返回世界观设定列表
        </Button>
      </div>
    );
  }
  
  // 获取设定类型标签
  const typeLabel = worldItemTypeOptions.find(opt => opt.value === worldItem.type)?.label || worldItem.type;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.push('/tools')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            编辑设定
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除设定
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{worldItem.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {typeLabel}
                  </Badge>
                </CardDescription>
              </div>
              {worldItem.image && (
                <img 
                  src={worldItem.image} 
                  alt={worldItem.name} 
                  className="h-24 w-24 object-cover rounded-md border"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{worldItem.description}</p>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">详细信息</h3>
                {worldItem.details ? (
                  <p className="whitespace-pre-line text-sm">{worldItem.details}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无详细信息</p>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-2">标签</h3>
                <div className="flex flex-wrap gap-1">
                  {worldItem.tags.length > 0 ? (
                    worldItem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">暂无标签</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>创建于: {new Date(worldItem.createdAt).toLocaleDateString()}</span>
                <span>更新于: {new Date(worldItem.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>相关设定</CardTitle>
            <CardDescription>与此设定相关的其他世界观元素</CardDescription>
          </CardHeader>
          <CardContent>
            {worldItem.relatedItems && worldItem.relatedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-muted-foreground col-span-full">相关设定功能将在后续版本中实现</p>
              </div>
            ) : (
              <p className="text-muted-foreground">暂无相关设定</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**执行目的**：
1. **角色详情页面**：创建角色详情页面，展示角色的完整信息
   - 使用选项卡分类展示不同类型的信息（背景故事、外貌描述等）
   - 提供编辑和删除功能
   - 展示角色的基本信息、性格特点和能力

2. **世界观设定详情页面**：创建世界观设定详情页面，展示设定的完整信息
   - 展示设定的基本信息、详细描述和标签
   - 提供编辑和删除功能
   - 预留相关设定展示区域

这些页面的实现遵循了以下设计原则：
- **信息分层**：将信息按照重要性和类型进行分层展示
- **一致的UI模式**：使用卡片、选项卡等一致的UI组件
- **直观的操作**：提供明确的编辑和删除按钮
- **错误处理**：处理加载错误和未找到数据的情况
- **用户反馈**：提供加载状态和操作确认

**替代方案**：
- **单页面展示所有信息**：可以将所有信息放在一个长页面中，但使用选项卡可以减少信息过载
- **模态框展示详情**：可以使用模态框而非单独页面，但单独页面提供更好的浏览体验和URL可访问性
- **使用富文本编辑器**：可以为详细描述使用富文本编辑器，但对于MVP版本，简单的文本展示已经足够

通过这些页面的实现，我们为用户提供了查看和管理角色与世界观设定的详细信息的能力，帮助作家更好地组织和维护创作素材。这些功能对于保持故事的一致性和丰富度至关重要，符合MVP版本的用户需求。

## 第19步：角色管理与世界观设定 - 第3部分：集成AI写作助手与作品关联

在完成了角色管理和世界观设定的基础类型、模拟数据和详情页面后，我们发现两个重要问题需要解决：
1. 之前实现的AI写作助手功能在添加新功能时被忽略了
2. 角色管理和世界观设定缺少与作品的关联，这不符合实际创作需求

接下来，我们将修改工具页面，整合AI写作助手功能，并添加作品关联。

**执行命令**：
```
touch frontend/app/\(main\)/tools/characters/new/page.tsx
touch frontend/app/\(main\)/tools/worldbuilding/new/page.tsx
```

**修改文件**：`frontend/types/character/index.ts`

```tsx
// 角色基本信息
export interface Character {
  id: string;
  workId: string; // 添加作品ID关联
  name: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建角色请求
export interface CreateCharacterRequest {
  workId: string; // 添加作品ID关联
  name: string;
  avatar?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  background?: string;
  personality?: string[];
  abilities?: string[];
  appearance?: string;
  notes?: string;
}

// 其他接口保持不变...
```

**修改文件**：`frontend/types/worldbuilding/index.ts`

```tsx
// 世界观设定项
export interface WorldItem {
  id: string;
  workId: string; // 添加作品ID关联
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string;
  tags: string[];
  relatedItems?: string[];
  createdAt: string;
  updatedAt: string;
}

// 创建世界观设定请求
export interface CreateWorldItemRequest {
  workId: string; // 添加作品ID关联
  name: string;
  type: WorldItemType;
  description: string;
  image?: string;
  details?: string;
  tags: string[];
  relatedItems?: string[];
}

// 其他定义保持不变...
```

**修改文件**：`frontend/lib/character-mock-data.ts`

```tsx
// 修改模拟角色数据，添加作品ID
export const mockCharacters: Character[] = [
  {
    id: "char-1",
    workId: "work-1", // 添加作品ID
    name: "林逸风",
    // 其他字段保持不变...
  },
  {
    id: "char-2",
    workId: "work-1", // 添加作品ID
    name: "沈月",
    // 其他字段保持不变...
  },
  {
    id: "char-3",
    workId: "work-1", // 添加作品ID
    name: "莫天阳",
    // 其他字段保持不变...
  },
];

// 添加按作品ID筛选的函数
export async function mockGetCharactersByWorkId(workId: string): Promise<Character[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockCharacters.filter(char => char.workId === workId);
}
```

**修改文件**：`frontend/lib/worldbuilding-mock-data.ts`

```tsx
// 修改模拟世界观设定数据，添加作品ID
export const mockWorldItems: WorldItem[] = [
  {
    id: "world-1",
    workId: "work-1", // 添加作品ID
    name: "灵气体系",
    // 其他字段保持不变...
  },
  {
    id: "world-2",
    workId: "work-1", // 添加作品ID
    name: "青云宗",
    // 其他字段保持不变...
  },
  {
    id: "world-3",
    workId: "work-1", // 添加作品ID
    name: "天元大陆",
    // 其他字段保持不变...
  },
];

// 添加按作品ID筛选的函数
export async function mockGetWorldItemsByWorkId(workId: string): Promise<WorldItem[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockWorldItems.filter(item => item.workId === workId);
}
```

**修改文件**：`frontend/hooks/character/useCharacters.ts`

```tsx
// 添加按作品ID获取角色的函数
const getCharactersByWorkId = useCallback(async (workId: string) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const result = await mockGetCharactersByWorkId(workId);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取角色列表时发生错误';
    setError(errorMessage);
    console.error("获取角色列表错误:", err);
    return [];
  } finally {
    setIsLoading(false);
  }
}, []);

// 在返回值中添加新函数
return {
  characters,
  isLoading,
  error,
  fetchCharacters,
  getCharacter,
  getCharactersByWorkId, // 添加这个函数
  createCharacter,
  updateCharacter,
  deleteCharacter
};
```

**修改文件**：`frontend/hooks/worldbuilding/useWorldbuilding.ts`

```tsx
// 添加按作品ID获取世界观设定的函数
const getWorldItemsByWorkId = useCallback(async (workId: string) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const result = await mockGetWorldItemsByWorkId(workId);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '获取世界观设定列表时发生错误';
    setError(errorMessage);
    console.error("获取世界观设定列表错误:", err);
    return [];
  } finally {
    setIsLoading(false);
  }
}, []);

// 在返回值中添加新函数
return {
  worldItems,
  isLoading,
  error,
  fetchWorldItems,
  getWorldItem,
  getWorldItemsByWorkId, // 添加这个函数
  createWorldItem,
  updateWorldItem,
  deleteWorldItem
};
```

**修改文件**：`frontend/app/(main)/tools/page.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Users, Globe, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { useAIAssistant } from "@/hooks/ai/useAIAssistant";
import { worldItemTypeOptions } from "@/types/worldbuilding";
import { AIPromptType, promptTypeOptions } from "@/types/ai";
import { Textarea } from "@/components/ui/textarea";

// 模拟作品数据
const mockWorks = [
  { id: "work-1", title: "修仙从种田开始" },
  { id: "work-2", title: "都市之全能高手" },
  { id: "work-3", title: "星际穿越之旅" },
];

export default function ToolsPage() {
  // 状态
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");
  const [selectedWork, setSelectedWork] = useState<{id: string, title: string} | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [worldItems, setWorldItems] = useState<any[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingWorldItems, setIsLoadingWorldItems] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // AI助手状态
  const [promptType, setPromptType] = useState<AIPromptType>("expand");
  const [prompt, setPrompt] = useState("");
  const { isLoading: isAILoading, response: aiResponse, generateResponse, clearResponse } = useAIAssistant();
  
  // Hooks
  const { getCharactersByWorkId } = useCharacters();
  const { getWorldItemsByWorkId } = useWorldbuilding();
  
  // 处理URL参数和客户端水合问题
  useEffect(() => {
    setMounted(true);
    
    // 从URL参数中获取作品ID
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const workParam = urlParams.get('work');
      if (workParam) {
        setSelectedWorkId(workParam);
      }
    }
  }, []);
  
  // 处理作品选择变化
  useEffect(() => {
    if (selectedWorkId) {
      const work = mockWorks.find(w => w.id === selectedWorkId);
      setSelectedWork(work || null);
      
      // 加载该作品的角色
      const loadCharacters = async () => {
        setIsLoadingCharacters(true);
        const chars = await getCharactersByWorkId(selectedWorkId);
        setCharacters(chars);
        setIsLoadingCharacters(false);
      };
      
      // 加载该作品的世界观设定
      const loadWorldItems = async () => {
        setIsLoadingWorldItems(true);
        const items = await getWorldItemsByWorkId(selectedWorkId);
        setWorldItems(items);
        setIsLoadingWorldItems(false);
      };
      
      loadCharacters();
      loadWorldItems();
    } else {
      setSelectedWork(null);
      setCharacters([]);
      setWorldItems([]);
    }
  }, [selectedWorkId, getCharactersByWorkId, getWorldItemsByWorkId]);
  
  // 处理AI生成
  const handleGenerateAI = async () => {
    if (!prompt) return;
    await generateResponse(promptType, prompt);
  };
  
  if (!mounted) {
    return null;
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">创作工具</h1>
          <p className="text-muted-foreground">
            AI写作助手、角色管理和世界观设定
          </p>
        </div>
      </div>
      
      {/* 作品选择器 */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
            <SelectTrigger>
              <SelectValue placeholder="选择作品" />
            </SelectTrigger>
            <SelectContent>
              {mockWorks.map(work => (
                <SelectItem key={work.id} value={work.id}>
                  {work.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/works">
            <BookOpen className="mr-2 h-4 w-4" />
            管理作品
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ai">
            <Sparkles className="mr-2 h-4 w-4" />
            AI写作助手
          </TabsTrigger>
          <TabsTrigger value="characters">
            <Users className="mr-2 h-4 w-4" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="worldbuilding">
            <Globe className="mr-2 h-4 w-4" />
            世界观设定
          </TabsTrigger>
        </TabsList>
        
        {/* AI写作助手选项卡 */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI写作助手</CardTitle>
              <CardDescription>
                智能续写、情节构思、角色设计和文本优化
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <Select value={promptType} onValueChange={(value) => setPromptType(value as AIPromptType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择提示类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Textarea 
                    placeholder="输入您的提示..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={clearResponse} disabled={isAILoading || !aiResponse}>
                  清除
                </Button>
                <Button onClick={handleGenerateAI} disabled={isAILoading || !prompt}>
                  {isAILoading ? "生成中..." : "生成内容"}
                </Button>
              </div>
              
              {aiResponse && (
                <div className="mt-4 p-4 border rounded-md bg-muted/30">
                  <h3 className="font-medium mb-2">AI回复:</h3>
                  <p className="whitespace-pre-line">{aiResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 角色管理选项卡 */}
        <TabsContent value="characters" className="space-y-4">
          {!selectedWorkId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">请先选择一个作品来管理角色</p>
                <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择作品" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockWorks.map(work => (
                      <SelectItem key={work.id} value={work.id}>
                        {work.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {selectedWork?.title} - 角色列表
                </h2>
                <Button size="sm" asChild>
                  <Link href={`/tools/characters/new?workId=${selectedWorkId}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    创建角色
                  </Link>
                </Button>
              </div>
              
              {isLoadingCharacters ? (
                <div className="flex justify-center p-8">
                  <div className="text-center">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                </div>
              ) : characters.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">该作品还没有角色</p>
                    <Button size="sm" asChild>
                      <Link href={`/tools/characters/new?workId=${selectedWorkId}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        创建第一个角色
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {characters.map((character) => (
                    <Card key={character.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{character.name}</CardTitle>
                        <CardDescription>{character.occupation || '未知职业'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.background || '暂无背景描述'}
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tools/characters/${character.id}`}>
                              查看详情
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        {/* 世界观设定选项卡 */}
        <TabsContent value="worldbuilding" className="space-y-4">
          {!selectedWorkId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground mb-4">请先选择一个作品来管理世界观设定</p>
                <Select value={selectedWorkId} onValueChange={setSelectedWorkId}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择作品" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockWorks.map(work => (
                      <SelectItem key={work.id} value={work.id}>
                        {work.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">
                  {selectedWork?.title} - 世界观设定
                </h2>
                <Button size="sm" asChild>
                  <Link href={`/tools/worldbuilding/new?workId=${selectedWorkId}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    创建设定
                  </Link>
                </Button>
              </div>
              
              {isLoadingWorldItems ? (
                <div className="flex justify-center p-8">
                  <div className="text-center">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                </div>
              ) : worldItems.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-muted-foreground mb-4">该作品还没有世界观设定</p>
                    <Button size="sm" asChild>
                      <Link href={`/tools/worldbuilding/new?workId=${selectedWorkId}`}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        创建第一个设定
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {worldItems.map((worldItem) => (
                    <Card key={worldItem.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{worldItem.name}</CardTitle>
                        <CardDescription>
                          {worldItemTypeOptions.find(
                            (opt) => opt.value === worldItem.type
                          )?.label || worldItem.type}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {worldItem.description}
                        </p>
                        <div className="mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/tools/worldbuilding/${worldItem.id}`}>
                              查看详情
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**修改文件**：`frontend/app/(main)/tools/characters/[id]/page.tsx`

```tsx
// 添加作品信息显示
// 在返回按钮下方添加
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <BookOpen className="h-4 w-4" />
  <span>所属作品: {workTitle}</span>
</div>

// 修改返回按钮的链接
<Button variant="outline" size="sm" onClick={() => router.push(`/tools?work=${character.workId}`)}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  返回
</Button>
```

**修改文件**：`frontend/app/(main)/tools/worldbuilding/[id]/page.tsx`

```tsx
// 添加作品信息显示
// 在返回按钮下方添加
<div className="flex items-center gap-2 text-sm text-muted-foreground">
  <BookOpen className="h-4 w-4" />
  <span>所属作品: {workTitle}</span>
</div>

// 修改返回按钮的链接
<Button variant="outline" size="sm" onClick={() => router.push(`/tools?work=${worldItem.workId}`)}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  返回
</Button>
```

**执行目的**：
1. **整合AI写作助手**：在工具页面添加AI写作助手选项卡，保留原有功能，使用户可以继续使用AI辅助创作
2. **添加作品关联**：修改数据结构和页面流程，使角色和世界观设定与特定作品关联，符合实际创作需求
3. **改进用户体验**：添加作品选择器，支持通过URL参数选择作品，提供清晰的导航和错误处理
4. **创建按钮链接**：将创建角色和创建设定按钮链接到相应的创建页面，并自动传递当前选中的作品ID

**替代方案**：
- **独立工具页面**：可以为AI助手、角色管理和世界观设定创建独立的页面，但这会增加导航层级，降低用户体验
- **作品内嵌子页面**：可以将角色和世界观设定作为作品详情页的子页面，但这会使功能分散，不利于集中管理创作工具
- **全局角色库**：可以创建不与作品关联的全局角色库，但这不符合实际创作需求，角色通常属于特定作品

通过这些修改，我们解决了两个重要问题：恢复了AI写作助手功能，并添加了角色和世界观设定与作品的关联。这使得功能更加合理，符合用户在创作过程中的实际需求，为小说创作提供了更好的工具支持。
