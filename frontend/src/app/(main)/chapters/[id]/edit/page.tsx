"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorContent } from "@/types/editor";
import { mockChapters } from "@/lib/mock/chapters-mock-data";
import { Chapter } from "@/types/work";

// 章节编辑页面组件
export default function ChapterEditPage() {
  // 获取URL参数中的章节ID
  const params = useParams();
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  // 从URL参数中提取章节ID
  const id = params.id as string;

  // 将所有章节相关状态合并到一个对象中
  const [chapterData, setChapterData] = useState<Chapter | null>(null);
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 加载章节数据
  useEffect(() => {
    setIsLoading(true);
    // 从中央mock数据中查找当前章节
    const currentChapter = mockChapters.find((chap) => chap.id === id);

    if (currentChapter) {
      setChapterData(currentChapter);
    } else {
      console.error(`找不到章节: ${id}`);
      // 如果找不到章节，可以重定向或显示错误信息
      // router.push('/chapters');
    }
    setIsLoading(false);
  }, [id]);

  // 保存章节
  const handleSave = async (content: EditorContent) => {
    // 这里将来会调用API保存章节
    console.log("保存章节:", id, content);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 更新中央mock数据
    const chapterIndex = mockChapters.findIndex((chap) => chap.id === id);
    if (chapterIndex !== -1) {
      const updatedChapter = {
        ...mockChapters[chapterIndex],
        title: content.title,
        content: content.content,
        updatedAt: new Date().toISOString().split("T")[0], // 更新修改日期
      };
      mockChapters[chapterIndex] = updatedChapter;
      setChapterData(updatedChapter); // 更新本地状态以反映更改
    }
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

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

      {/* 加载状态 */}
      {isLoading || !chapterData ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              正在加载章节内容...
            </p>
          </div>
        </div>
      ) : (
        /* Tiptap编辑器 - 更新为使用新的编辑器功能 */
        <TiptapEditor
          initialContent={{
            title: chapterData.title,
            content: chapterData.content,
          }}
          onSave={handleSave}
          placeholder="开始编写您的章节内容..."
          autoFocus
          contentId={chapterData.id}
          workId={chapterData.workId}
          containerId={`editor-${chapterData.id}`} // 使用唯一的容器ID
        />
      )}

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/chapters">返回章节列表</Link>
        </Button>
        <div className="space-x-2">
          <Button variant="outline">保存为草稿</Button>
          <Button>发布章节</Button>
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
