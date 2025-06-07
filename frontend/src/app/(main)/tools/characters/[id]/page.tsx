"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, BookOpen } from "lucide-react";
import { useCharacters } from "@/hooks/character/useCharacters";
import { Character } from "@/types/character";

// 模拟作品数据 - 实际应用中应从API获取
const mockWorks = [
  { id: "work-1", title: "修仙从种田开始" },
  { id: "work-2", title: "都市之全能高手" },
  { id: "work-3", title: "星际穿越之旅" },
];

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getCharacter, deleteCharacter } = useCharacters();
  const [character, setCharacter] = useState<Character | null>(null);
  const [workTitle, setWorkTitle] = useState<string>("");
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
          // 查找并设置作品标题
          const work = mockWorks.find((w) => w.id === result.workId);
          setWorkTitle(work?.title || "未知作品");
        } else {
          setError("未找到角色信息");
        }
      } catch (err) {
        setError("加载角色信息失败");
        console.error("Error fetching character:", err);
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
          // 返回到工具页面，并选择正确的作品
          router.push(`/tools?work=${character.workId}`);
        } else {
          setError("删除角色失败");
        }
      } catch (err) {
        setError("删除角色时发生错误");
        console.error("Error deleting character:", err);
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
        <p className="text-destructive">{error || "未找到角色信息"}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/tools")}
        >
          返回工具页面
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tools?work=${character.workId}`)}
        >
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

      {/* 添加作品信息 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>所属作品: {workTitle}</span>
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
              <CardTitle className="text-center text-2xl">
                {character.name}
              </CardTitle>
              <CardDescription className="text-center">
                {character.occupation || "未知职业"}
                {character.age && ` • ${character.age}岁`}
                {character.gender &&
                  ` • ${
                    character.gender === "male"
                      ? "男"
                      : character.gender === "female"
                      ? "女"
                      : "其他"
                  }`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 其余内容保持不变 */}
              <div>
                <h3 className="font-medium mb-1">性格特点</h3>
                <div className="flex flex-wrap gap-1">
                  {character.personality?.map((trait, index) => (
                    <span
                      key={index}
                      className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs"
                    >
                      {trait}
                    </span>
                  )) || (
                    <span className="text-muted-foreground text-sm">
                      未设置性格特点
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-1">能力</h3>
                <div className="flex flex-wrap gap-1">
                  {character.abilities?.map((ability, index) => (
                    <span
                      key={index}
                      className="bg-secondary/10 text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
                    >
                      {ability}
                    </span>
                  )) || (
                    <span className="text-muted-foreground text-sm">
                      未设置能力
                    </span>
                  )}
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
          {/* 选项卡内容保持不变 */}
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
                    <p className="whitespace-pre-line">
                      {character.background}
                    </p>
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
                    <p className="whitespace-pre-line">
                      {character.appearance}
                    </p>
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
                  <p className="text-muted-foreground">
                    暂无关系数据，后续版本将添加角色关系图谱可视化功能。
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
