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
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorks } from "@/hooks/useWorks";
import { useCharacterRelations } from "@/hooks/character/useCharacterRelations";
import { CharacterRelationManager } from "@/components/character/CharacterRelationManager";
import {
  Character,
  CharacterRelationship,
  RelationshipType,
} from "@/types/character";
import { Separator } from "@/components/ui/separator";

export default function EditCharacterPage() {
  const router = useRouter();
  const params = useParams();
  const characterId = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    characters: allCharacters,
    getCharacter,
    updateCharacter,
  } = useCharacters();
  const { works } = useWorks();
  const { relations, addRelation, deleteRelation, updateRelationType } =
    useCharacterRelations(characterId || "", allCharacters);

  const [formData, setFormData] = useState<Partial<Character>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (characterId) {
      const fetchCharacterData = async () => {
        setIsLoading(true);
        try {
          const characterToEdit = await getCharacter(characterId);
          if (characterToEdit) {
            setFormData(characterToEdit);
          } else {
            setError("未找到要编辑的角色信息");
          }
        } catch (e) {
          setError("加载角色数据失败");
        } finally {
          setIsLoading(false);
        }
      };
      fetchCharacterData();
    }
  }, [characterId, getCharacter]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    setIsSubmitting(true);
    setError(null);

    try {
      const age = formData.age ? parseInt(String(formData.age), 10) : undefined;

      const getArrayFromString = (
        value: string | string[] | undefined
      ): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === "string" && value) {
          return value.split(",").map((item: string) => item.trim());
        }
        return [];
      };

      const personality = getArrayFromString(formData.personality);
      const abilities = getArrayFromString(formData.abilities);

      const updatedCharacterData: Character = {
        ...(formData as Character),
        id: characterId,
        workId: formData.workId || "",
        name: formData.name || "",
        age: isNaN(age as number) ? undefined : age,
        personality,
        abilities,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await updateCharacter(updatedCharacterData);

      if (result) {
        router.push(`/tools/characters/${characterId}`);
      } else {
        setError("更新角色失败");
      }
    } catch (err) {
      setError("更新角色时发生错误");
      console.error("Error updating character:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-8">加载角色数据中...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive p-8">{error}</div>;
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
              <Label htmlFor="workId">所属作品 *</Label>
              <Select
                value={formData.workId || ""}
                onValueChange={(value) => handleSelectChange("workId", value)}
              >
                <SelectTrigger id="workId">
                  <SelectValue placeholder="选择一个作品..." />
                </SelectTrigger>
                <SelectContent>
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.name}
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
                  value={
                    Array.isArray(formData.personality)
                      ? formData.personality.join(", ")
                      : formData.personality || ""
                  }
                  onChange={handleChange}
                  placeholder="如：坚韧,聪慧,重情义"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abilities">能力（用逗号分隔）</Label>
                <Input
                  id="abilities"
                  name="abilities"
                  value={
                    Array.isArray(formData.abilities)
                      ? formData.abilities.join(", ")
                      : formData.abilities || ""
                  }
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
                placeholder="其他需要记录的信息，如角色发展方向、重要剧情点等"
                rows={3}
              />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <Separator />

            {/* Relations Manager */}
            {characterId && (
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
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存更改"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
