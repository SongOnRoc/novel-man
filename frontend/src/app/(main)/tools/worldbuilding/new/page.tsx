"use client";

import { useState } from "react";
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
import { ArrowLeft, Save } from "lucide-react";
import { useWorldview } from "@/hooks/worldbuilding/useWorldview";

export default function NewWorldItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");
  const { createItem, mutateCategories } = useWorldview();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      setError("未指定分类ID，无法创建条目。");
      return;
    }

    if (!name.trim()) {
      setError("条目名称不能为空。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createItem({
        name,
        description,
        categoryId: parseInt(categoryId, 10),
      });
      // After creating, redirect back to the main page
      // We also trigger a mutation for the items of that category, though the hook setup is simple
      // A better hook would handle this more gracefully
      router.push("/tools/worldbuilding");
    } catch (err) {
      setError("创建条目失败。");
      console.error(err);
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
        <h1 className="text-2xl font-bold">新建世界观条目</h1>
        <div className="w-24"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>条目信息</CardTitle>
            <CardDescription>
              为当前选择的分类创建一个新的世界观条目。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">条目名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：灵根、筑基期"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">条目描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述这个设定的内容。"
                rows={5}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
