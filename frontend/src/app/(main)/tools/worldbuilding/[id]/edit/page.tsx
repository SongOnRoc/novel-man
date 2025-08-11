"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useWorldview } from "@/hooks/worldbuilding/useWorldview";

export default function EditWorldItemPage() {
  const router = useRouter();
  const params = useParams();
  const { getItem, updateItem } = useWorldview();
  const itemId = params.id
    ? parseInt(Array.isArray(params.id) ? params.id[0] : params.id, 10)
    : null;

  const { item, itemError } = getItem(itemId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      setError("无效的条目ID。");
      return;
    }

    if (!name.trim()) {
      setError("条目名称不能为空。");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateItem(itemId, { name, description });
      router.push(`/tools/worldbuilding/${itemId}`);
    } catch (err) {
      setError("更新条目失败。");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (itemError) return <div>加载失败...</div>;
  if (!item) return <div>加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">编辑世界观条目</h1>
        <div className="w-24"></div>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>条目信息</CardTitle>
            <CardDescription>修改世界观条目的详细信息。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">条目名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">条目描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
