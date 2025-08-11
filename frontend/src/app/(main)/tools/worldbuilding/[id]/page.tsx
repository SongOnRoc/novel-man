"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useWorldview } from "@/hooks/worldbuilding/useWorldview";

export default function WorldItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getItem, deleteItem, mutateCategories } = useWorldview();
  const itemId = params.id
    ? parseInt(Array.isArray(params.id) ? params.id[0] : params.id, 10)
    : null;

  const { item, itemError, mutateItem } = getItem(itemId);

  const handleDelete = async () => {
    if (!item) return;

    if (confirm(`确定要删除条目 "${item.name}" 吗？`)) {
      try {
        await deleteItem(item.id);
        // After deleting, we should go back and refresh the categories/items
        mutateCategories(); // This will trigger a re-fetch of categories, and indirectly items if a category is selected
        router.push("/tools/worldbuilding");
      } catch (err) {
        console.error("删除失败", err);
        alert("删除失败");
      }
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tools/worldbuilding/${item.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{item.name}</CardTitle>
          <CardDescription>
            创建于: {new Date(item.createdAt).toLocaleDateString()} | 更新于:{" "}
            {new Date(item.updatedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{item.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
