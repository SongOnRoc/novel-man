# Step 29: 章节管理功能增强

## 1. 需求背景

本次开发旨在增强章节管理功能，主要包括：
- **新建章节页面**：提供一个表单用于添加新章节。
- **章节预览页面**：展示章节内容，并提供返回编辑和列表页的导航。
- **章节列表功能增强**：将原有的拖拽排序改为更实用的搜索、筛选和排序功能。
- **导出功能**：在预览页面增加导出功能，允许用户将章节内容导出为不同格式（TXT, PNG），并支持不同范围（当前章节、分卷、全书）的导出。
- **样式优化**：根据用户反馈，调整章节预览和编辑器的样式，使标题更突出，并为段落添加首行缩进。

## 2. 实现过程

### 2.1. 新建章节页面

- **文件**: `frontend/src/app/(main)/chapters/new/page.tsx`
- **实现**:
  - 使用 `react-hook-form` 和 `zod` 创建了一个表单，用于输入章节标题、内容、所属分卷等信息。
  - 通过 `useParams` 获取 `workId`，确保新章节与正确的作品关联。
  - 创建了 `mockCreateChapter` 函数 (`frontend/src/lib/mock/chapters-mock-data.ts`) 来模拟数据持久化。

### 2.2. 章节列表功能增强

- **文件**: `frontend/src/components/chapter/ChapterList.tsx`
- **实现**:
  - 移除了原有的拖拽排序逻辑。
  - 添加了状态管理 (`useState`, `useMemo`) 来处理搜索关键词、筛选条件（分卷）和排序方式（章节顺序）。
  - 使用 `Input`、`Select` 和 `Button` 组件构建了交互式 UI，允许用户动态地搜索、筛选和排序章节列表。

### 2.3. 导出功能

#### 2.3.1. `ExportDialog` 组件

- **文件**: `frontend/src/components/common/ExportDialog.tsx`
- **实现**:
  - 创建了一个可复用的对话框组件，用于封装导出选项。
  - 使用 `Dialog`, `Select`, `RadioGroup` 等 `shadcn/ui` 组件构建了 UI，允许用户选择导出格式（TXT, PNG）和范围（当前章节、分卷、全书）。
  - 通过 `onExport` 回调函数将用户的选择传递给父组件进行处理。

#### 2.3.2. 集成到预览页面

- **文件**: `frontend/src/app/(main)/chapters/[id]/preview/page.tsx`
- **实现**:
  - 导入并使用了 `ExportDialog` 组件。
  - 实现了 `handleExport` 函数，该函数根据从 `ExportDialog` 接收到的选项，准备相应的内容和标题。
  - **TXT 导出**: 将文本内容包装在 `Blob` 对象中，并创建一个临时的 `<a>` 标签来触发下载。
  - **PNG 导出**: 使用 `html-to-image` 库将章节内容的 DOM 元素转换为 PNG 图片，然后触发下载。
  - 为了支持按分卷和全书导出，在 `useChapters` hook (`frontend/src/hooks/useChapters.ts`) 中添加了 `getChapterById` 和 `getChaptersByVolume` 两个辅助函数。

### 2.4. 样式优化

- **背景**: 用户反馈章节标题不够突出，且段落没有首行缩进。直接修改全局 CSS (`globals.css`) 导致了全局样式污染。
- **解决方案**:
  - **撤销全局修改**: 恢复了对 `globals.css` 和相关组件的更改。
  - **局部作用域样式**:
    - 在 `frontend/src/app/(main)/chapters/[id]/preview/page.tsx` 和 `frontend/src/components/editor/TiptapEditor.tsx` 中使用了 `<style jsx global>`。
    - 这种方法将样式的作用域限定在当前组件内，避免了对全局样式的干扰。
    - 为 `.prose h1` 和 `.ProseMirror h1` 设置了更大的字体大小和外边距。
    - 为 `.prose p` 和 `.ProseMirror p` 添加了 `text-indent: 2em;` 来实现段落首行缩进。

## 3. 最终代码

### `frontend/src/app/(main)/chapters/[id]/preview/page.tsx`

```tsx
"use client";

import { useRef } from "react";
import { useChapters } from "@/hooks/useChapters";
import { notFound, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toPng } from "html-to-image";
import { ExportDialog, ExportOptions } from "@/components/common/ExportDialog";

export default function ChapterPreviewPage() {
  const params = useParams();
  const chapterId = Array.isArray(params.id) ? params.id[0] : params.id;
  const contentRef = useRef<HTMLDivElement>(null);

  const { chapters, isLoading, getChaptersByVolume, getChapterById } = useChapters();

  if (!chapterId) {
    return notFound();
  }
  const chapter = getChapterById(chapterId);

  const handleExport = (options: ExportOptions) => {
    if (!chapter) return;

    let contentToExport = "";
    let title = "";

    switch (options.range) {
      case "current":
        contentToExport = chapter.content;
        title = chapter.title;
        break;
      case "volume":
        const volumeChapters = getChaptersByVolume(chapter.volumeId);
        title = `分卷-${volumeChapters[0]?.volumeId}`; // Simplified title
        contentToExport = volumeChapters
          .map((c: any) => `## ${c.title}\n\n${c.content}`)
          .join("\n\n---\n\n");
        break;
      case "all":
        title = `全书`;
        contentToExport = chapters
          .map((c: any) => `## ${c.title}\n\n${c.content}`)
          .join("\n\n---\n\n");
        break;
      default:
        return;
    }

    if (options.format === "txt") {
      const blob = new Blob([contentToExport], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (options.format === "png") {
      if (contentRef.current) {
        toPng(contentRef.current, { cacheBust: true })
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.download = `${title}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error("oops, something went wrong!", err);
          });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!chapter) {
    return notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chapters?workId=${chapter.workId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回章节列表
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/chapters/${chapter.id}/edit`}>
              返回编辑
            </Link>
          </Button>
        </div>
        <ExportDialog onExport={handleExport} />
      </div>
      <article ref={contentRef} className="prose dark:prose-invert max-w-none bg-background p-6 rounded-md">
        <h1>{chapter.title}</h1>
        {chapter.content ? (
          <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
        ) : (
          <p className="text-muted-foreground">本章节没有内容。</p>
        )}
      </article>

      <style jsx global>{`
        .prose h1 {
          font-size: 2.25rem; /* text-4xl */
          font-weight: 700;
          margin-bottom: 2rem;
        }
        .prose p {
          text-indent: 2em;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
```

### `frontend/src/components/editor/TiptapEditor.tsx` (部分)

```tsx
// ... imports

export function TiptapEditor({
  // ... props
}) {
  // ... hooks and functions

  return (
    <div id={containerId} className="flex flex-col border rounded-md shadow-sm">
      {/* ... 标题和工具栏 */}
      
      {/* 内容编辑区 */}
      <div
        className={`prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px] theme-${settings.theme}`}
      >
        <EditorContent editor={editor} className="min-h-[300px] outline-none" />
      </div>

      {/* ... AI 按钮 */}

      {/* 编辑器样式 */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
          outline: none;
          font-size: var(--editor-font-size, 16px);
          line-height: var(--editor-line-height, 1.5);
        }
        
        /* ... 其他样式 ... */

        .ProseMirror h1 {
          font-size: 2.25rem !important; /* text-4xl */
          font-weight: 700 !important;
          margin-bottom: 2rem !important;
        }
        .ProseMirror p {
          text-indent: 2em;
          margin-top: 1rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}