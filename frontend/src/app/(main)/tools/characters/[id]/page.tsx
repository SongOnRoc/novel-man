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
import {
  useCharacter,
  useDeleteCharacter,
} from "@/hooks/character/useCharacters";
import { Character } from "@/types/character";
// import { CharacterRelations } from "@/components/character/CharacterRelations";
import { useWorks } from "@/hooks/work/useWorks";

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = Number(
    Array.isArray(params.id) ? params.id[0] : params.id,
  );

  const { data: character, isLoading, error } = useCharacter(characterId);
  const deleteCharacterMutation = useDeleteCharacter();
  const { data: worksData } = useWorks();
  const works = worksData?.data || [];

  const workTitle =
    character && works.find((w: any) => w.id === character.work_id)?.title;

  // 处理删除角色
  const handleDelete = async () => {
    if (!character) return;

    if (confirm(`确定要删除角色 "${character.name}" 吗？此操作不可撤销。`)) {
      try {
        await deleteCharacterMutation.mutateAsync(character.id);
        router.push(`/tools/characters`);
      } catch (err) {
        console.error("Error deleting character:", err);
        // Optionally, show an error message to the user
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-destructive">加载角色信息失败: {error.message}</p>
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

  if (!character) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">未找到角色信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tools/characters`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/tools/characters/${character.id}/edit`)
            }
          >
            <Edit className="mr-2 h-4 w-4" />
            编辑角色
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除角色
          </Button>
        </div>
      </div>

      {workTitle && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>所属作品: {workTitle}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                {character.avatarUrl ? (
                  <img
                    src={character.avatarUrl}
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
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Simplified display based on new flat model */}
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
              <TabsTrigger value="personality">性格</TabsTrigger>
              <TabsTrigger value="ability">能力</TabsTrigger>
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

            <TabsContent value="personality" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>性格</CardTitle>
                </CardHeader>
                <CardContent>
                  {character.personality ? (
                    <p className="whitespace-pre-line">
                      {character.personality}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">暂无性格描述</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ability" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>能力</CardTitle>
                </CardHeader>
                <CardContent>
                  {character.abilities ? (
                    <p className="whitespace-pre-line">{character.abilities}</p>
                  ) : (
                    <p className="text-muted-foreground">暂无能力描述</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="relationships" className="mt-4">
              {/* <CharacterRelations characterId={character.id.toString()} /> */}
              <Card>
                <CardHeader>
                  <CardTitle>关系网络</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    此功能正在基于新的通用关系模型进行重构，敬请期待。
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
