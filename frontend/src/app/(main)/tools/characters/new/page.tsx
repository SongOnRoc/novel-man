"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateCharacter } from "@/hooks/character/useCharacters";
import { useWorks } from "@/hooks/work/useWorks";
// import { CharacterRelationManager } from "@/components/character/CharacterRelationManager";
import {
  Character,
  // CharacterRelationship,
  // RelationshipType,
} from "@/types/character";
import { Separator } from "@/components/ui/separator";

// A version of CharacterRelationship for temporary state before the main character has an ID.
// import { TempCharacterRelationship } from "@/types/character";

export default function NewCharacterPage() {
  const router = useRouter();
  const createCharacterMutation = useCreateCharacter();
  const { data: worksData } = useWorks();
  const works = worksData?.data || [];

  const [workId, setWorkId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    occupation: "",
    personality: "",
    abilities: "",
    background: "",
    appearance: "",
    notes: "",
  });

  // const [tempRelations, setTempRelations] = useState<
  //   TempCharacterRelationship[]
  // >([]);
  const [error, setError] = useState<string | null>(null);

  // const charactersInSameWork = allCharacters.filter(
  //   (c) => c.work_id && c.work_id.toString() === workId
  // );

  // const handleAddRelation = (targetId: string, type: RelationshipType) => {
  //   // Prevent duplicates
  //   if (tempRelations.some((r) => r.target_id.toString() === targetId)) return;
  //   setTempRelations((prev) => [
  //     ...prev,
  //     { target_id: parseInt(targetId, 10), type },
  //   ]);
  // };

  // const handleDeleteRelation = (relationId: string) => {
  //   // In temp state, we use targetId as a key
  //   setTempRelations((prev) =>
  //     prev.filter((r) => r.target_id.toString() !== relationId)
  //   );
  // };

  // const handleUpdateRelationType = (
  //   relationId: string,
  //   newType: RelationshipType
  // ) => {
  //   // In temp state, we use targetId as a key
  //   setTempRelations((prev) =>
  //     prev.map((r) =>
  //       r.target_id.toString() === relationId ? { ...r, type: newType } : r
  //     )
  //   );
  // };

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

    if (!formData.name) {
      setError("角色名称不能为空");
      return;
    }
    if (!workId) {
      setError("必须选择一个所属作品");
      return;
    }

    setError(null);

    try {
      const newCharacterData = {
        work_id: parseInt(workId, 10),
        name: formData.name,
        gender: formData.gender,
        age: parseInt(formData.age, 10) || 0,
        occupation: formData.occupation,
        personality: formData.personality,
        abilities: formData.abilities,
        background: formData.background,
        appearance: formData.appearance,
        notes: formData.notes,
      };

      const newCharacter =
        await createCharacterMutation.mutateAsync(newCharacterData);

      if (newCharacter) {
        router.push(`/tools/characters/${newCharacter.id}`);
      } else {
        setError("创建角色失败");
      }
    } catch (err) {
      setError("创建角色时发生错误");
      console.error("Error creating character:", err);
    }
  };

  // Adapt tempRelations to fit the CharacterRelationManager's expected prop type
  // const managerRelations: CharacterRelationship[] = tempRelations.map(
  //   (r, i) => ({
  //     id: r.target_id, // Use target_id as a temporary, unique key for the manager
  //     source_id: 0, // Placeholder
  //     target_id: r.target_id,
  //     type: r.type,
  //     description: r.description || "",
  //     work_id: parseInt(workId, 10),
  //     created_at: new Date().toISOString(),
  //     updated_at: new Date().toISOString(),
  //   })
  // );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">创建新角色</h1>
        <div className="w-24"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>角色信息</CardTitle>
            <CardDescription>
              填写角色的基本信息，带 * 的字段为必填项
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
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="输入角色名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">职业/身份</Label>
                <Input
                  id="occupation"
                  name="occupation"
                  value={formData.occupation}
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
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="输入年龄"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <Select
                  value={formData.gender}
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
              <Select value={workId} onValueChange={setWorkId}>
                <SelectTrigger id="workId">
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
                  value={formData.personality}
                  onChange={handleChange}
                  placeholder="如：坚韧,聪慧,重情义"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="abilities">能力（用逗号分隔）</Label>
                <Input
                  id="abilities"
                  name="abilities"
                  value={formData.abilities}
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
                value={formData.background}
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
                value={formData.appearance}
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
                value={formData.notes}
                onChange={handleChange}
                placeholder="其他需要记录的信息，如角色发展方向、重要剧情点等"
                rows={3}
              />
            </div>

            {error && <div className="text-destructive text-sm">{error}</div>}

            <Separator />

            {/* Relations Manager - Temporarily Disabled */}
            {/* {workId && (
              <CharacterRelationManager
                characterId="new-character-placeholder"
                allCharacters={charactersInSameWork}
                relations={managerRelations}
                onAddRelation={handleAddRelation}
                onDeleteRelation={handleDeleteRelation}
                onUpdateRelationType={handleUpdateRelationType}
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
            <Button type="submit" disabled={createCharacterMutation.isPending}>
              {createCharacterMutation.isPending ? "创建中..." : "创建角色"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
