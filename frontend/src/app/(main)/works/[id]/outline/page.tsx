"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle, Globe } from "lucide-react";
import { useWork } from "@/hooks/work/useWorks";
import { useWorkWorldview } from "@/hooks/work/useWorkWorldview";
import { useWorldview } from "@/hooks/worldbuilding/useWorldview";
import { WorldviewItem } from "@/types/core";

export default function OutlinePage() {
  const router = useRouter();
  const params = useParams();
  const workId = Number(params.id);

  const { data: work, isLoading: isWorkLoading } = useWork(workId);
  const {
    items: associatedItems,
    associateItems,
    dissociateItem,
    isLoading: isWorldviewLoading,
  } = useWorkWorldview(workId);
  const { items: allItems, isLoadingItems } = useWorldview();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssociate = async (itemId: number) => {
    await associateItems([itemId]);
  };

  const handleDissociate = async (itemId: number) => {
    await dissociateItem(itemId);
  };

  if (isWorkLoading) return <div>正在加载作品信息...</div>;
  if (!work) return <div>未找到该作品。</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{work.title}</h1>
            <p className="text-muted-foreground">管理作品关联的世界观</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            <Globe className="mr-2 h-5 w-5 inline-block" />
            关联的世界观条目
          </CardTitle>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                从库中添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>从世界观库中选择</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {(allItems || []).map((item: WorldviewItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAssociate(item.id);
                        setIsModalOpen(false);
                      }}
                    >
                      添加
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isWorldviewLoading ? (
            <p>加载中...</p>
          ) : (
            <ul className="space-y-2">
              {(associatedItems || []).map(
                (item: { worldviewItemId: number }) => (
                  <li
                    key={item.worldviewItemId}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {
                        (allItems || []).find(
                          (i: WorldviewItem) => i.id === item.worldviewItemId,
                        )?.name
                      }
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDissociate(item.worldviewItemId)}
                    >
                      移除
                    </Button>
                  </li>
                ),
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
