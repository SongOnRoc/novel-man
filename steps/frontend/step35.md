## 步骤 35: 抽象通用值设置Popover组件

**目标**: 将特定于“写作目标”的 `Popover` 组件重构为一个通用的、可复用的 `ValueSettingPopover` 组件，以适应未来可能出现的类似需求（如设置章节目标、书籍数量目标等）。

### 1. 创建通用组件 `ValueSettingPopover`

为了提高代码的复用性，我们创建了一个新的通用组件，它可以处理任何需要通过弹窗来设置数值的场景。

**文件**: `frontend/src/components/common/ValueSettingPopover.tsx`
**操作**: 创建文件

```tsx
"use client";

import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ValueSettingPopoverProps {
  currentValue: number;
  onValueChange: (newValue: number) => void;
  trigger: ReactNode;
  label: string;
  placeholder?: string;
  unit?: string;
}

export function ValueSettingPopover({
  currentValue,
  onValueChange,
  trigger,
  label,
  placeholder,
  unit,
}: ValueSettingPopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(currentValue.toString());

  useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue]);

  const handleSetValue = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      onValueChange(newValue);
      setIsPopoverOpen(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="value-input" className="text-sm font-medium">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <Input
              id="value-input"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="h-8"
              placeholder={placeholder}
            />
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            <Button size="sm" onClick={handleSetValue} className="h-8">
              设置
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**代码详解**:
1.  该组件接收 `trigger` (一个React节点) 作为触发器，使其非常灵活。
2.  通过 `label`, `placeholder`, `unit` 等 props，可以完全自定义弹窗内的文本和单位。
3.  `currentValue` 和 `onValueChange` 负责与父组件进行状态同步。

### 2. 在 `EditorToolbar` 中使用通用组件

我们更新了 `EditorToolbar`，用这个新的通用组件替换了之前的特定实现。

**文件**: `frontend/src/components/editor/EditorToolbar.tsx`
**操作**: 修改

```diff
- import { WritingGoalPopover } from "./WritingGoalPopover";
+ import { ValueSettingPopover } from "@/components/common/ValueSettingPopover";
...
-            {onTargetCountChange && (
-              <WritingGoalPopover
-                targetCount={targetCount}
-                onTargetCountChange={onTargetCountChange}
-              />
-            )}
+            {onTargetCountChange && (
+              <ValueSettingPopover
+                currentValue={targetCount}
+                onValueChange={onTargetCountChange}
+                label="设置目标字数"
+                placeholder="例如: 2000"
+                unit="字"
+                trigger={
+                  <Button variant="ghost" size="icon" className="h-6 w-6">
+                    <Target className="h-4 w-4" />
+                    <span className="sr-only">设置写作目标</span>
+                  </Button>
+                }
+              />
+            )}
```

**代码详解**:
1.  `EditorToolbar` 的职责变得更加清晰：它只负责提供特定于“写作目标”的配置（如标签、单位、触发器图标），而将弹窗的具体实现委托给 `ValueSettingPopover`。
2.  这种抽象使得代码更易于维护，并为未来的功能扩展奠定了良好的基础。

**结果**:
我们成功地将一个特定功能的 UI 组件抽象成了一个高度可复用的通用组件，提升了代码库的质量和灵活性。