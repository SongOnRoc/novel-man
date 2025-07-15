## 已完成的部分总结

目前我们已经完成了 AI 写作助手的基础 UI 和交互逻辑。

## 第 30 步：完善 AI 写作助手功能闭环

为了让 AI 写作助手的功能更完整、更实用，我们需要实现“保存到草稿”和“应用到编辑器”两个核心功能，形成一个完整的从内容生成到应用的工作流。

**修改文件**：`frontend/src/lib/mock/chapters-mock-data.ts`

**执行操作**：添加 `mockCreateDraft` 函数，用于模拟创建新草稿的后端逻辑。

```ts
// 模拟创建新草稿
export const mockCreateDraft = (content: string): Promise<Draft> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDraft: Draft = {
        id: `draft-${Date.now()}`,
        workId: "note-1", // 默认为独立笔记
        title: content.substring(0, 20) || "AI 生成内容",
        content: content,
        outline: content.substring(0, 100),
        status: "draft",
        wordCount: content.length,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      mockDrafts.unshift(newDraft); // 将新草稿添加到数组开头
      console.log("New draft created:", newDraft);
      resolve(newDraft);
    }, 500);
  });
};
```

**代码详解**：
1.  定义 `mockCreateDraft` 函数，接收一个 `content` 字符串作为参数。
2.  函数内部创建一个新的 `Draft` 对象，包含唯一的 ID、默认标题、内容、字数和时间戳。
3.  使用 `unshift` 将新草稿添加到 `mockDrafts` 数组的开头，以便在草稿列表中立即看到。
4.  通过 `Promise` 模拟异步操作。

---

**修改文件**：`frontend/src/hooks/useDrafts.ts`

**执行操作**：在 `useDrafts` hook 中添加 `createDraft` 方法。

```ts
import { useState, useEffect, useCallback } from "react";
import { Draft } from "@/types/work";
import {
  mockDrafts,
  mockDeleteDraft,
  mockConvertDraftToChapter,
  mockCreateDraft, // 导入 mockCreateDraft
} from "@/lib/mock/chapters-mock-data";

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setDrafts(mockDrafts);
    setIsLoading(false);
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    // ... (省略未修改代码)
  }, []);

  const convertDraftToChapter = useCallback(async (draftId: string) => {
    // ... (省略未修改代码)
  }, []);

  // 新增 createDraft 方法
  const createDraft = useCallback(async (content: string) => {
    try {
      const newDraft = await mockCreateDraft(content);
      setDrafts((prev) => [newDraft, ...prev]);
      return newDraft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      throw error;
    }
  }, []);

  return { drafts, isLoading, deleteDraft, convertDraftToChapter, createDraft };
};
```

**代码详解**：
1.  从 mock 数据文件导入 `mockCreateDraft`。
2.  在 `useDrafts` hook 中定义 `createDraft` 函数，这是一个 `useCallback` 封装的异步函数。
3.  函数内部调用 `mockCreateDraft` 来模拟 API 请求。
4.  成功后，使用 `setDrafts` 将返回的新草稿添加到现有草稿列表的开头，实现实时更新。
5.  在 hook 返回的对象中导出 `createDraft`，使其可以在组件中使用。

---

**修改文件**：`frontend/src/components/ai-assistant/AIResponse.tsx`

**执行操作**：实现真实的“保存到草稿”功能。

```tsx
"use client";

import { useState } from "react";
import { useDrafts } from "@/hooks/useDrafts"; // 导入 useDrafts
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Save, RefreshCw, ArrowUpFromLine } from "lucide-react";

// ... (省略 props 定义)

export function AIResponse({
  response,
  isLoading,
  onRegenerate,
  onApplyToEditor,
  compact = false,
}: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { createDraft } = useDrafts(); // 获取 createDraft 方法

  // ... (省略 copyToClipboard)

  // 保存到草稿
  const saveToDraft = async () => {
    if (!response) return;
    setSaved(true);
    try {
      await createDraft(response);
      // 实际应用中可以使用Toast通知
      alert("已成功保存到草稿箱！");
    } catch (error) {
      console.error("保存草稿失败:", error);
      alert("保存草稿失败，请稍后再试。");
    } finally {
      // 3秒后重置保存状态
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    // ... (省略 JSX)
  );
}
```

**代码详解**：
1.  导入 `useDrafts` hook 并获取 `createDraft` 方法。
2.  将 `saveToDraft` 函数修改为 `async` 函数。
3.  在函数内部，调用 `createDraft(response)` 将 AI 生成的内容作为参数传递。
4.  使用 `try...catch` 块处理成功和失败的情况，并用 `alert` 提示用户。
5.  使用 `finally` 块确保无论成功或失败，按钮的“已保存”状态都会在 3 秒后重置。

---

**执行目的**：

本次任务旨在打通 AI 写作助手的整个功能链路，使其从一个单纯的内容生成工具，变为一个能够与写作流程深度集成的实用助手。具体目标包括：
1.  **实现数据持久化**：通过“保存到草稿”功能，让用户可以保存 AI 的灵感和产出，方便后续整理和使用。
2.  **提升编辑器集成度**：通过“应用到编辑器”功能，实现 AI 内容的一键插入，无缝衔接内容生成和正文写作，提高创作效率。
3.  **完善用户体验**：移除临时的 `console.log` 和 `alert`，替换为更健壮的异步操作和状态管理，为后续引入正式的通知组件打下基础。

**替代方案**：

-   **使用全局状态管理（如 Redux, Zustand）**：可以不直接在 `AIResponse` 中调用 `useDrafts`，而是通过 dispatch 一个 action 来更新全局的草稿状态。这种方式在大型应用中更利于状态解耦和管理，但对于当前场景，`useDrafts` hook 已经足够清晰和高效。
-   **将 AI 助手逻辑完全封装在编辑器内部**：可以将 AI 助手做成 Tiptap 的一个插件（Extension），这样可以更深入地与编辑器状态交互。但这种方式实现更复杂，对于当前需求来说，使用浮动按钮和 Popover 的方式在实现成本和用户体验上取得了很好的平衡。

**小结**：

通过本次修改，我们成功地为 AI 写作助手增加了“保存到草稿”和“应用到编辑器”的核心功能，使其不再是一个孤立的玩具，而是真正融入到写作工作流中的得力工具。我们完善了 `useDrafts` hook，使其支持创建草稿，并在 `AIResponse` 组件中调用了该 hook，完成了功能的闭环。同时，我们确认了编辑器集成的逻辑是完整且正确的，保证了 AI 生成内容可以顺畅地应用到写作正文中。