"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorContent } from "@/types/editor";
import { useChapter, useUpdateChapter } from "@/hooks/chapter/useChapters";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

// 章节编辑页面组件
export default function ChapterEditPage() {
  // 获取URL参数中的章节ID
  const params = useParams();
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  // 从URL参数中提取章节ID并转换为数字
  const id = Number(params.id as string);

  // 写作目标状态
  const [targetCount, setTargetCount] = useState(2000);

  // 使用 useChapter hook 获取章节数据
  const { data: chapterData, isLoading, error } = useChapter(id);

  // 使用 useUpdateChapter hook 更新章节数据
  const { mutate: updateChapter, isPending: isSaving } = useUpdateChapter();

  // 保存章节
  const handleSave = async (content: EditorContent) => {
    if (!chapterData) return;

    console.log("保存章节:", id, content);
    updateChapter(
      {
        id,
        data: {
          title: content.title,
          content: content.content,
          workId: chapterData.workId,
        },
      },
      {
        onSuccess: () => {
          console.log("章节保存成功");
        },
        onError: (err) => {
          console.error("章节保存失败:", err);
        },
      },
    );
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  // 渲染加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="w-full h-[60vh]" />
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>加载错误</AlertTitle>
        <AlertDescription>
          加载章节数据时发生错误: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">返回</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">编辑章节</h1>
            <p className="text-muted-foreground">
              编辑章节内容，自动保存草稿。
            </p>
          </div>
        </div>
      </div>

      {/* Tiptap编辑器 */}
      {chapterData ? (
        <TiptapEditor
          initialContent={{
            title: chapterData.title,
            content: chapterData.content,
          }}
          onSave={handleSave}
          placeholder="开始编写您的章节内容..."
          autoFocus
          contentId={chapterData.id.toString()}
          workId={chapterData.workId.toString()}
          containerId={`editor-${chapterData.id}`} // 使用唯一的容器ID
          targetCount={targetCount}
          onTargetCountChange={setTargetCount}
          isSaving={isSaving}
        />
      ) : (
        // 如果没有chapter数据，但也没有加载或错误状态，显示一个提示
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>未找到章节</AlertTitle>
          <AlertDescription>
            无法加载章节数据，或指定的章节不存在。
          </AlertDescription>
        </Alert>
      )}

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/chapters">返回章节列表</Link>
        </Button>
        <div className="space-x-2">
          <Button variant="outline" disabled={isSaving}>
            {isSaving ? "保存中..." : "保存为草稿"}
          </Button>
          <Button disabled={isSaving}>
            {isSaving ? "发布中..." : "发布章节"}
          </Button>
        </div>
      </div>

      {/* 添加键盘快捷键提示 */}
      <div className="text-xs text-muted-foreground">
        <p>
          提示：按下 Ctrl+G
          可以跳转到指定行；使用书签管理器可以在重要位置添加书签。
        </p>
      </div>
    </div>
  );
}
