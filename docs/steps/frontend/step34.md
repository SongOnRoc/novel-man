## 已完成的部分总结

目前我们已经完成了：

1.  在 `Draft` 类型定义中增加了 `targetCount` 字段。
2.  在 `useDrafts` hook 中添加了 `updateDraftTargetCount` 方法。
3.  实现了编辑器工具栏的目标设定和进度显示 UI。
4.  创建了 `Progress` UI 组件并安装了相关依赖。
5.  在编辑器页面中集成了目标字数功能。

## 第 31 步：实现写作目标设定与进度显示

为了增强写作体验，我们为编辑器增加了写作目标设定功能，允许用户为每个草稿设置字数目标，并实时查看进度。

**修改文件**：`frontend/src/types/work/index.ts`

```diff
- export interface Draft extends BaseContent {
-   status: ContentStatus; // 草稿状态
- }
+ export interface Draft extends BaseContent {
+   status: ContentStatus; // 草稿状态
+   targetCount?: number; // 写作目标字数
+ }
```

**代码详解**：
1.  在 `Draft` 接口中添加可选的 `targetCount` 属性，用于存储写作目标。

**修改文件**：`frontend/src/hooks/useDrafts.ts`

```diff
- return {
-   drafts,
-   isLoading,
-   isSaving,
-   deleteDraft,
-   convertDraftToChapter,
-   createDraft,
- };
+  const updateDraftTargetCount = useCallback(
+    async (draftId: string, targetCount: number) => {
+      setDrafts((prev) =>
+        prev.map((d) => (d.id === draftId ? { ...d, targetCount } : d))
+      );
+    },
+    []
+  );
+
+ return {
+   drafts,
+   isLoading,
+   isSaving,
+   deleteDraft,
+   convertDraftToChapter,
+   createDraft,
+   updateDraftTargetCount,
+ };
```

**代码详解**：
1.  在 `useDrafts` hook 中添加 `updateDraftTargetCount` 函数，用于更新草稿的 `targetCount` 状态。

**创建文件**：`frontend/src/components/ui/progress.tsx`

```tsx
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
```

**代码详解**：
1.  创建一个新的 `Progress` 组件，用于可视化显示写作进度。

**执行命令**：
```bash
pnpm dlx shadcn@latest add progress
```

**修改文件**：`frontend/src/components/editor/EditorToolbar.tsx`

```diff
// ... imports
+ import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
+ import { Input } from "@/components/ui/input";
+ import { Progress } from "@/components/ui/progress";

// ... interface
+  targetCount?: number;
+  onTargetCountChange?: (newTarget: number) => void;

// ... component
+  targetCount = 0,
+  onTargetCountChange,
// ...
+  const [targetInput, setTargetInput] = useState(targetCount.toString());
+
+  const handleSetTarget = () => {
+    const newTarget = parseInt(targetInput, 10);
+    if (!isNaN(newTarget) && onTargetCountChange) {
+      onTargetCountChange(newTarget);
+    }
+  };
+
+  useEffect(() => {
+    setTargetInput(targetCount.toString());
+  }, [targetCount]);

// ... render
-         {settings.showWordCount && (
-           <div className="text-xs text-muted-foreground px-2">
-             {wordCount} 字
-           </div>
-         )}
+         {settings.showWordCount && (
+           <Popover>
+             <PopoverTrigger asChild>
+               <div className="text-xs text-muted-foreground px-2 cursor-pointer min-w-[120px]">
+                 {targetCount > 0 ? (
+                   <div className="flex flex-col items-center gap-1">
+                     <span>
+                       {wordCount} / {targetCount} 字
+                     </span>
+                     <Progress value={(wordCount / targetCount) * 100} className="h-1" />
+                   </div>
+                 ) : (
+                   <span>{wordCount} 字</span>
+                 )}
+               </div>
+             </PopoverTrigger>
+             <PopoverContent className="w-48 p-2">
+               <div className="flex flex-col gap-2">
+                 <label htmlFor="target-input" className="text-sm font-medium">
+                   设置目标字数
+                 </label>
+                 <div className="flex items-center gap-2">
+                   <Input
+                     id="target-input"
+                     type="number"
+                     value={targetInput}
+                     onChange={(e) => setTargetInput(e.target.value)}
+                     className="h-8"
+                     placeholder="例如: 2000"
+                   />
+                   <Button size="sm" onClick={handleSetTarget} className="h-8">
+                     设置
+                   </Button>
+                 </div>
+               </div>
+             </PopoverContent>
+           </Popover>
+         )}
```

**代码详解**：
1.  在 `EditorToolbar` 中，将字数统计区域改造为可点击的 `Popover` 触发器。
2.  `Popover` 中包含一个输入框和按钮，用于设置新的字数目标。
3.  当设置了目标后，UI 会显示为 `当前字数 / 目标字数`，并附带一个进度条。

**执行目的**：
本次修改旨在为编辑器增加写作目标功能，帮助用户跟踪和管理他们的写作进度，从而提升写作效率和满足感。

**小结**：
通过对类型、Hook 和 UI 组件的综合修改，我们成功地为编辑器集成了写作目标设定与进度显示功能。这个功能不仅满足了用户的核心需求，也为未来扩展更多写作辅助工具（如写作统计、成就系统等）打下了基础。