"use client";

import { PlusCircle, Globe } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useWorkById, useWorkWorldview } from "@/hooks/work/useWorkService";
import { useWorldviewItems } from "@/hooks/worldbuilding/useWorldviewService";
import { Relationship } from "@/lib/services/relationship.service";
import { Work } from "@/lib/services/work.service";
import {
  WorldviewItem,
  WorldviewItemList,
} from "@/lib/services/worldview.service";

export default function OutlinePage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const workId = Number(params.id);
  const { setBreadcrumb } = useBreadcrumb();

  const { data: work, isLoading: isWorkLoading } = useWorkById(workId);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "作品大纲");
    }
  }, [work, workId, setBreadcrumb]);

  const {
    items: associatedItems,
    associate,
    dissociate,
    isLoading: isWorldviewLoading,
  } = useWorkWorldview(workId);
  const { data: allItemsResponse } = useWorldviewItems({ category_id: 0 }); // TODO: This should be a real category ID
  const allItems = (allItemsResponse?.data as WorldviewItemList)?.data || [];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAssociate = async (itemId: number): Promise<void> => {
    await associate(itemId);
  };

  const handleDissociate = async (relationshipId: number): Promise<void> => {
    await dissociate(relationshipId);
  };

  if (isWorkLoading) return <div>正在加载作品信息...</div>;
  if (!work) return <div>未找到该作品。</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={work.title || "作品大纲"}
        description="管理作品关联的世界观"
      />

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
                {allItems.map((item: WorldviewItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <span>{item.name}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        handleAssociate(item.id!);
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
              {associatedItems.map((item: Relationship) => (
                <li key={item.id} className="flex items-center justify-between">
                  <span>
                    {
                      allItems.find(
                        (i: WorldviewItem) => i.id === item.target_entity_id
                      )?.name
                    }
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDissociate(item.id!)}
                  >
                    移除
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
