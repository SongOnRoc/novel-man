"use client";

import { BookOpen, Download, Edit, Trash2, Users, Globe, Settings, PenTool } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteWorkDialog } from "@/features/works/components/DeleteWorkDialog";
import { useWorkById, useDeleteWork } from "@/hooks/work/useWorkService";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { GlobalLoading } from "@/components/common/GlobalLoading";

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
    return <GlobalLoading />;
  }

  if (!work) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">作品未找到</h2>
          <Button variant="link" onClick={() => router.push("/works")}>
            返回作品列表
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-500">
      {/* Hero Header (Apple Music Style) */}
      <div className="relative -mx-4 -mt-4 mb-8 overflow-hidden bg-background md:-mx-8 md:-mt-8">
        {/* Blurred Background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-3xl dark:opacity-20"
          style={{ backgroundImage: `url(${work.coverImageUrl || "/placeholder-cover.jpg"})` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-background" />

        <div className="relative z-10 flex flex-col gap-8 p-8 md:flex-row md:items-end md:p-12">
          {/* Cover Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-48 w-36 flex-shrink-0 overflow-hidden rounded-lg shadow-2xl md:h-64 md:w-48"
          >
             <Image
                src={work.coverImageUrl || ""}
                alt={work.title || "Work Cover"}
                fallbackText={work.title || "Work"}
                className="h-full w-full object-cover"
                priority
              />
          </motion.div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                {work.title}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground line-clamp-2">
                {work.description || "暂无简介"}
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap gap-3"
            >
              <Button asChild size="lg" className="rounded-full shadow-lg shadow-primary/20">
                <Link href={`/works/${work.id}/chapters`}>
                  <PenTool className="mr-2 h-4 w-4" />
                  开始写作
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full bg-background/50 backdrop-blur-sm" asChild>
                <Link href={`/works/${work.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑信息
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Grid (Tabs Replacement) */}
      <div className="px-4 md:px-8">
        <h2 className="mb-6 text-xl font-semibold tracking-tight">创作中心</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <NavCard
            title="章节管理"
            description="管理目录，撰写正文"
            icon={BookOpen}
            href={`/works/${work.id}/chapters`}
            color="text-blue-500"
            delay={0.3}
          />
          <NavCard
            title="角色库"
            description="设定角色，建立关系"
            icon={Users}
            href={`/works/${work.id}/characters`} // Assuming this route exists or will exist
            color="text-purple-500"
            delay={0.4}
          />
          <NavCard
            title="世界观"
            description="构建宏大的世界背景"
            icon={Globe}
            href={`/works/${work.id}/world`} // Assuming this route exists or will exist
            color="text-emerald-500"
            delay={0.5}
          />
          <NavCard
            title="作品设置"
            description="修改元数据，导出作品"
            icon={Settings}
            href={`/works/${work.id}/edit`}
            color="text-orange-500"
            delay={0.6}
          />
        </div>
      </div>

      <DeleteWorkDialog
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

function NavCard({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color,
  delay 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  href: string; 
  color: string;
  delay: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4 }}
        className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className={cn("mb-4 inline-flex rounded-xl bg-muted p-3 transition-colors group-hover:bg-background", color)}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-1 text-lg font-semibold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-5 transition-transform group-hover:scale-150", color.replace("text-", "bg-"))} />
      </motion.div>
    </Link>
  );
}

function WorkDetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-80 w-full animate-pulse bg-muted" />
      <div className="px-8">
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
