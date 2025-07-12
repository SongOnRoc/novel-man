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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Tag, BookOpen } from "lucide-react";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { WorldItem, worldItemTypeOptions } from "@/types/worldbuilding";
import { useWorks } from "@/hooks/useWorks";

export default function WorldItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getWorldItem, deleteWorldItem } = useWorldbuilding();
  const { getWorkNameById } = useWorks();
  const [worldItem, setWorldItem] = useState<WorldItem | null>(null);
  const [workTitle, setWorkTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取世界观设定详情
  useEffect(() => {
    const fetchWorldItem = async () => {
      if (!params.id) return;

      setIsLoading(true);
      try {
        const itemId = Array.isArray(params.id) ? params.id[0] : params.id;
        const result = await getWorldItem(itemId);
        if (result) {
          setWorldItem(result);
        } else {
          setError("未找到世界观设定信息");
        }
      } catch (err) {
        setError("加载世界观设定信息失败");
        console.error("Error fetching world item:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorldItem();
  }, [params.id, getWorldItem]);

  // 当 worldItem 或 getWorkNameById 更新时，更新作品标题
  useEffect(() => {
    if (worldItem) {
      const title = getWorkNameById(worldItem.workId);
      setWorkTitle(title || "");
    }
  }, [worldItem, getWorkNameById]);

  // 处理删除世界观设定
  const handleDelete = async () => {
    if (!worldItem) return;

    if (
      confirm(`确定要删除世界观设定 "${worldItem.name}" 吗？此操作不可撤销。`)
    ) {
      try {
        const success = await deleteWorldItem(worldItem.id);
        if (success) {
          // 返回到工具页面，并选择正确的作品
          router.push(`/tools?work=${worldItem.workId}`);
        } else {
          setError("删除世界观设定失败");
        }
      } catch (err) {
        setError("删除世界观设定时发生错误");
        console.error("Error deleting world item:", err);
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

  if (error || !worldItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-destructive">{error || "未找到世界观设定信息"}</p>
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

  // 获取设定类型标签
  const typeLabel =
    worldItemTypeOptions.find((opt) => opt.value === worldItem.type)?.label ||
    worldItem.type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/tools?work=${worldItem.workId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            编辑设定
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            删除设定
          </Button>
        </div>
      </div>

      {/* 添加作品信息 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>所属作品: {workTitle}</span>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{worldItem.name}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="mt-1">
                    {typeLabel}
                  </Badge>
                </CardDescription>
              </div>
              {worldItem.image && (
                <img
                  src={worldItem.image}
                  alt={worldItem.name}
                  className="h-24 w-24 object-cover rounded-md border"
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{worldItem.description}</p>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">详细信息</h3>
                {worldItem.details ? (
                  <p className="whitespace-pre-line text-sm">
                    {worldItem.details}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无详细信息</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">标签</h3>
                <div className="flex flex-wrap gap-1">
                  {worldItem.tags.length > 0 ? (
                    worldItem.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">暂无标签</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  创建于: {new Date(worldItem.createdAt).toLocaleDateString()}
                </span>
                <span>
                  更新于: {new Date(worldItem.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>相关设定</CardTitle>
            <CardDescription>与此设定相关的其他世界观元素</CardDescription>
          </CardHeader>
          <CardContent>
            {worldItem.relatedItems && worldItem.relatedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p className="text-muted-foreground col-span-full">
                  相关设定功能将在后续版本中实现
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">暂无相关设定</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
