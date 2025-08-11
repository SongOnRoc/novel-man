"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import {
  useCharacter,
  useUpdateCharacter,
} from "@/hooks/character/useCharacters";
import { useWorks } from "@/hooks/work/useWorks";
// import { useCharacterRelations } from "@/hooks/character/useCharacterRelations";
// import { CharacterRelationManager } from "@/components/character/CharacterRelationManager";
import {
  Character,
  // CharacterRelationship,
  // RelationshipType,
} from "@/types/character";
import { Separator } from "@/components/ui/separator";

export default function EditCharacterPage() {
  const router = useRouter();
  const params = useParams();
  const characterId = Number(
    Array.isArray(params.id) ? params.id[0] : params.id,
  );

  const {
    data: character,
    isLoading,
    error: fetchError,
  } = useCharacter(characterId);
  const updateCharacterMutation = useUpdateCharacter();
  const { data: worksData } = useWorks();
  const works = worksData?.data || [];

  const [formData, setFormData] = useState<Partial<Character>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (character) {
      setFormData(character);
    }
  }, [character]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!characterId) {
      setError("无效的角色ID，无法更新。");
      return;
    }

    if (!formData.name) {
      setError("角色名称不能为空");
      return;
    }

    setError(null);

    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: formData,
      });
      router.push(`/tools/characters/${characterId}`);
    } catch (err) {
      setError("更新角色时发生错误");
      console.error("Error updating character:", err);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">加载角色数据中...</div>;
  }

  if (fetchError) {
    return (
      <div className="text-center text-destructive p-8">
        加载数据失败: {fetchError.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">编辑角色</h1>
        <div className="w-24"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>角色信息</CardTitle>
            <CardDescription>
              修改角色的基本信息，带 * 的字段为必填项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">角色名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  placeholder="输入角色名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">职业/身份</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={formData.occupation || ""}
                  onChange={handleChange}
                  placeholder="如：修真者、丹药师"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">年龄</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={formData.age || ""}
                  onChange={handleChange}
                  placeholder="输入年龄"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value) => handleSelectChange("gender", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="work_id">所属作品 *</Label>
              <Select
                value={formData.work_id?.toString() || ""}
                onValueChange={(value) => handleSelectChange("work_id", value)}
              >
                <SelectTrigger id="work_id">
                  <SelectValue placeholder="选择一个作品..." />
                </SelectTrigger>
                <SelectContent>
                  {works.map((work: any) => (
                    <SelectItem key={work.id} value={work.id.toString()}>
                      {work.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="personality">性格特点（用逗号分隔）</Label>
                <Input
                  id="personality"
                  name="personality"
                  value={formData.personality || ""}
                  onChange={handleChange}
                  placeholder="如：坚韧,聪慧,重情义"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abilities">能力（用逗号分隔）</Label>
                <Input
                  id="abilities"
                  name="abilities"
                  value={formData.abilities || ""}
                  onChange={handleChange}
                  placeholder="如：火属性灵力,炼丹术,剑法"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">背景故事</Label>
              <Textarea
                id="background"
                name="background"
                value={formData.background || ""}
                onChange={handleChange}
                placeholder="描述角色的背景故事、经历和动机"
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appearance">外貌描述</Label>
              <Textarea
                id="appearance"
                name="appearance"
                value={formData.appearance || ""}
                onChange={handleChange}
                placeholder="描述角色的外貌特征、穿着和气质"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">笔记</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes || ""}
                onChange={handleChange}
                placeholder="其他需要记录的信息"
                rows={3}
              />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <Separator />

            {/* Relations Manager - Temporarily Disabled */}
            {/* {characterId && (
              <CharacterRelationManager
                characterId={characterId}
                allCharacters={allCharacters.filter(
                  (c) => c.workId === formData.workId && c.id !== characterId
                )}
                relations={relations}
                onAddRelation={addRelation}
                onDeleteRelation={deleteRelation}
                onUpdateRelationType={updateRelationType}
              />
            )} */}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={updateCharacterMutation.isPending}>
              {updateCharacterMutation.isPending ? "保存中..." : "保存更改"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
