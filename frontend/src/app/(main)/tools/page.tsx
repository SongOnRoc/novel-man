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
import { useWorldviewCategories } from "@/hooks/worldbuilding/useWorldviewService";
import {
  WorldviewCategory,
  WorldviewItem,
} from "@/lib/services/worldview.service";
import { useWorkCharacters, useWorkWorldview } from "@/hooks/work/useWorkService";
// import { useAIAssistant } from "@/hooks/ai/useAIAssistant";
import { useWorkList } from "@/hooks/work/useWorkService";
import { Character } from "@/lib/services/characters.service";
import { Work } from "@/lib/services/work.service";
import { AIAssistant } from "@/features/ai/components/AIAssistant";

export default function ToolsPage() {
  // 状态
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [worldviewCategories, setWorldviewCategories] = useState<
    WorldviewCategory[]
  >([]);
  const [mounted, setMounted] = useState(false);

  // Hooks
  const { data: worksData } = useWorkList({});
  const works = (worksData?.data as Work[]) || [];
  const { data: worldviewCategoriesResponse } = useWorldviewCategories({
    limit: 999,
  });
  const {
    characters,
    isLoading: isLoadingCharacters,
    error: charactersError,
  } = useWorkCharacters(parseInt(selectedWorkId, 10));
  const { items: worldItems, isLoading: isLoadingWorldItems } = useWorkWorldview(
    parseInt(selectedWorkId, 10)
  );

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
    const work = works.find((w: Work) => w.id?.toString() === selectedWorkId);
    setSelectedWork(work || null);
  }, [selectedWorkId, works]);

  useEffect(() => {
    if (worldviewCategoriesResponse?.data) {
      setWorldviewCategories(
        (worldviewCategoriesResponse.data as { data: WorldviewCategory[] })
          .data,
      );
    }
  }, [worldviewCategoriesResponse]);

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
              {works
                .filter((work: Work) => work.id)
                .map((work: Work) => (
                  <SelectItem key={work.id} value={work.id!.toString()}>
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
          <AIAssistant />
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
                    {works
                      .filter((work: Work) => work.id)
                      .map((work: Work) => (
                        <SelectItem key={work.id} value={work.id!.toString()}>
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
                  {characters.map((character: Character) => (
                    <Card key={character.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{character.name}</CardTitle>
                        <CardDescription>
                          {character.occupation || "未知职业"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {character.background_story || "暂无背景描述"}
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
                    {works
                      .filter((work: Work) => work.id)
                      .map((work: Work) => (
                        <SelectItem key={work.id} value={work.id!.toString()}>
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
                  {(worldItems as WorldviewItem[]).map((worldItem) => (
                    <Card key={worldItem.id}>
                      <CardHeader className="pb-2">
                        <CardTitle>{worldItem.name}</CardTitle>
                        <CardDescription>
                          {worldviewCategories.find(
                            (cat) => cat.id === worldItem.category_id
                          )?.name || "Uncategorized"}
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
