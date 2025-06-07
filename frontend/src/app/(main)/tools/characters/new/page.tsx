"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

// 模拟作品数据 - 实际应用中应从API获取
const mockWorks = [
  { id: "work-1", title: "修仙从种田开始" },
  { id: "work-2", title: "都市之全能高手" },
  { id: "work-3", title: "星际穿越之旅" },
];

export default function NewCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get("workId");
  const { createCharacter } = useCharacters();

  // 表单状态
  const [formData, setFormData] = useState({
    workId: workId || "",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workTitle, setWorkTitle] = useState<string>("");

  // 获取作品标题
  useEffect(() => {
    if (formData.workId) {
      const work = mockWorks.find((w) => w.id === formData.workId);
      setWorkTitle(work?.title || "");
    }
  }, [formData.workId]);

  // 处理表单输入变化
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理选择变化
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.workId) {
      setError("请选择作品");
      return;
    }

    if (!formData.name) {
      setError("角色名称不能为空");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 处理多值字段
      const personalityArray = formData.personality
        ? formData.personality.split(",").map((item) => item.trim())
        : [];

      const abilitiesArray = formData.abilities
        ? formData.abilities.split(",").map((item) => item.trim())
        : [];

      // 转换年龄为数字
      const age = formData.age ? parseInt(formData.age, 10) : undefined;

      const character = await createCharacter({
        workId: formData.workId,
        name: formData.name,
        gender: formData.gender as "male" | "female" | "other" | undefined,
        age: isNaN(age as number) ? undefined : age,
        occupation: formData.occupation || undefined,
        personality: personalityArray.length > 0 ? personalityArray : undefined,
        abilities: abilitiesArray.length > 0 ? abilitiesArray : undefined,
        background: formData.background || undefined,
        appearance: formData.appearance || undefined,
        notes: formData.notes || undefined,
      });

      if (character) {
        router.push(`/tools?work=${formData.workId}`);
      } else {
        setError("创建角色失败");
      }
    } catch (err) {
      setError("创建角色时发生错误");
      console.error("Error creating character:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">创建新角色</h1>
        <div className="w-24"></div> {/* 占位，保持标题居中 */}
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>角色信息</CardTitle>
            <CardDescription>
              请填写角色的基本信息，带 * 的字段为必填项
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 作品选择 */}
            <div className="space-y-2">
              <Label htmlFor="workId">所属作品 *</Label>
              <Select
                value={formData.workId}
                onValueChange={(value) => handleSelectChange("workId", value)}
              >
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

            {/* 基本信息 */}
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

            {/* 特性和能力 */}
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

            {/* 详细描述 */}
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
              {isSubmitting ? "创建中..." : "创建角色"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
