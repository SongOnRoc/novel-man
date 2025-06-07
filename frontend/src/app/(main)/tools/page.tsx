"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [selectedWork, setSelectedWork] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [worldItems, setWorldItems] = useState<any[]>([]);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [isLoadingWorldItems, setIsLoadingWorldItems] = useState(false);
  const [mounted, setMounted] = useState(false);

  // AI助手状态
  const [promptType, setPromptType] = useState<AIPromptType>("expand");
  const [prompt, setPrompt] = useState("");
  const {
    isLoading: isAILoading,
    response: aiResponse,
    generateResponse,
    clearResponse,
  } = useAIAssistant();

  // Hooks
  const { getCharactersByWorkId } = useCharacters();
  const { getWorldItemsByWorkId } = useWorldbuilding();

  // 处理URL参数和客户端水合问题
  useEffect(() => {
    setMounted(true);

    // 从URL参数中获取作品ID
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const workParam = urlParams.get("work");
      if (workParam) {
        setSelectedWorkId(workParam);
      }
    }
  }, []);

  // 处理作品选择变化
  useEffect(() => {
    if (selectedWorkId) {
      const work = mockWorks.find((w) => w.id === selectedWorkId);
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
              {mockWorks.map((work) => (
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
                  <Select
                    value={promptType}
                    onValueChange={(value) =>
                      setPromptType(value as AIPromptType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择提示类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {promptTypeOptions.map((option) => (
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
                <Button
                  variant="outline"
                  onClick={clearResponse}
                  disabled={isAILoading || !aiResponse}
                >
                  清除
                </Button>
                <Button
                  onClick={handleGenerateAI}
                  disabled={isAILoading || !prompt}
                >
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
                <p className="text-muted-foreground mb-4">
                  请先选择一个作品来管理角色
                </p>
                <Select
                  value={selectedWorkId}
                  onValueChange={setSelectedWorkId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择作品" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockWorks.map((work) => (
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
                    <p className="text-muted-foreground mb-4">
                      该作品还没有角色
                    </p>
                    <Button size="sm" asChild>
                      <Link
                        href={`/tools/characters/new?workId=${selectedWorkId}`}
                      >
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
                        <CardDescription>
                          {character.occupation || "未知职业"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.background || "暂无背景描述"}
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
                <p className="text-muted-foreground mb-4">
                  请先选择一个作品来管理世界观设定
                </p>
                <Select
                  value={selectedWorkId}
                  onValueChange={setSelectedWorkId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择作品" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockWorks.map((work) => (
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
                  <Link
                    href={`/tools/worldbuilding/new?workId=${selectedWorkId}`}
                  >
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
                    <p className="text-muted-foreground mb-4">
                      该作品还没有世界观设定
                    </p>
                    <Button size="sm" asChild>
                      <Link
                        href={`/tools/worldbuilding/new?workId=${selectedWorkId}`}
                      >
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
