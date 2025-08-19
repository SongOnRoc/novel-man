"use client";

import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWorldviewItem,
  useDeleteWorldviewItem,
} from "@/hooks/worldbuilding/useWorldviewService";
import { WorldviewItem } from "@/lib/services/worldview.service";



export default function WorldItemDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id
    ? parseInt(Array.isArray(params.id) ? params.id[0] : params.id, 10)
    : null;

  const {
    data: itemResponse,
    isLoading,
    error,
  } = useWorldviewItem(itemId!);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteWorldviewItem();

  const item = itemResponse as WorldviewItem;

  const handleDelete = async (): Promise<void> => {
    if (!item) return;

    toast(`确定要删除条目 "${item.name}" 吗？`, {
      action: {
        label: "删除",
        onClick: () =>
          deleteItem(item.id!, {
            onSuccess: () => {
              toast.success("删除成功");
              router.push("/tools/worldbuilding");
            },
            onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
          }),
      },
      cancel: {
        label: "取消",
        onClick: () => {},
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) return <div>加载失败...</div>;
  if (!item) return <div>未找到条目。</div>;

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
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "删除中..." : "删除"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{item.name}</CardTitle>
          <CardDescription>
            创建于: {new Date(item.created_at!).toLocaleDateString()} | 更新于:{" "}
            {new Date(item.updated_at!).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-line">{item.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
