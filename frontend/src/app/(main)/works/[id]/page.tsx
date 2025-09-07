"use client";

import { ArrowLeft, BookOpen, Download, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteWorkDialog } from "@/features/works/components/DeleteWorkDialog";
import { useWorkById, useDeleteWork } from "@/hooks/work/useWorkService";
import { WorkForClient } from "@/lib/services/work.service";

export default function WorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const workId = Number(params.id);
  const { setBreadcrumb } = useBreadcrumb();
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: work, isLoading } = useWorkById(workId);
  const { mutate: deleteWork, isPending: isDeleting } = useDeleteWork();

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "作品详情");
    }
  }, [work, workId, setBreadcrumb]);

  const handleDelete = () => {
    deleteWork(workId, {
      onSuccess: () => {
        router.push("/works");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!work) {
    return <div>作品未找到。</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title={work.title!}
          description="作品管理"
          actions={
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href={`/works/${work.id}/chapters`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  章节管理
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/works/${work.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑信息
                </Link>
              </Button>
              <Button variant="outline" onClick={() => alert("导出功能待实现")}>
                <Download className="mr-2 h-4 w-4" />
                导出作品
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除作品
              </Button>
            </div>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>作品详情</CardTitle>
            <CardDescription>查看作品的详细信息。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">简介</h3>
                <p className="text-muted-foreground">{work.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <DeleteWorkDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
