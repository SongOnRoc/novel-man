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
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { WorldItemType, worldItemTypeOptions } from "@/types/worldbuilding";
import { useWorks } from "@/hooks/useWorks";

export default function NewWorldItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get("workId");
  const { createWorldItem } = useWorldbuilding();
  const { works } = useWorks();

  // 表单状态
  const [formData, setFormData] = useState({
    workId: workId || "",
    name: "",
    type: "" as WorldItemType,
    description: "",
    details: "",
    tags: "",
    image: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("设定名称不能为空");
      return;
    }

    if (!formData.type) {
      setError("请选择设定类型");
      return;
    }

    if (!formData.description) {
      setError("简短描述不能为空");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 处理标签
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((item) => item.trim())
        : [];

      const worldItem = await createWorldItem({
        workId: formData.workId,
        name: formData.name,
        type: formData.type as WorldItemType,
        description: formData.description,
        details: formData.details || undefined,
        image: formData.image || undefined,
        tags: tagsArray,
        relatedItems: [],
      });

      if (worldItem) {
        router.push(`/tools?work=${formData.workId}`);
      } else {
        setError("创建世界观设定失败");
      }
    } catch (err) {
      setError("创建世界观设定时发生错误");
      console.error("Error creating world item:", err);
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
        <h1 className="text-2xl font-bold">创建世界观设定</h1>
        <div className="w-24"></div> {/* 占位，保持标题居中 */}
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>设定信息</CardTitle>
            <CardDescription>
              请填写世界观设定的基本信息，带 * 的字段为必填项
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
                  {works.map((work) => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">设定名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="输入设定名称"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">设定类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择设定类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {worldItemTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">简短描述 *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="一句话描述该设定的核心特点"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">详细信息</Label>
              <Textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="详细描述该设定的各个方面"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tags">标签（用逗号分隔）</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="如：修真,灵气,宗门"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">图片URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="输入图片链接（可选）"
                />
              </div>
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
              {isSubmitting ? "创建中..." : "创建设定"}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
