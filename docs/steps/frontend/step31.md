## 已完成的部分总结[必须]

目前我们已经完成了：

1.  **基础框架搭建**：使用 Next.js, TypeScript, 和 Tailwind CSS 构建了项目骨架。
2.  **核心UI组件**：集成了 shadcn/ui，并创建了如按钮、卡片、输入框等基础 UI 元素。
3.  **布局与导航**：实现了主应用布局，包括侧边栏和用户导航。
4.  **作品与章节管理**：构建了作品和章节的列表展示、创建、编辑和删除等核心 CRUD 功能。
5.  **富文本编辑器**：集成了 Tiptap 编辑器，支持基础的文本格式化、书签和查找替换功能。
6.  **草稿箱功能**：实现了草稿的创建、管理和转换。
7.  **基础AI助手**：实现了初版的 AI 助手，包含一个下拉菜单用于选择功能。

## 第 31 步：重构并超越 AI 写作助手 UI 及交互 [必须]

为了**提升用户体验**并**增强功能性**，我们根据最新的用户反馈和设计参考，对现有的 AI 写作助手进行一次全面的重构。目标是打造一个功能更强大、交互更流畅、设计更现代的 AI 助手。

**修改文件**：`frontend/src/types/ai/index.ts`

```ts
// AI辅助类型定义
export type AIPromptType =
  | "expand" // 扩写
  | "rewrite" // 改写
  | "summarize" // 缩写
  | "correct" // 纠错
  | "continue" // 续写
  | "custom"; // 自定义

// AI生成请求参数
export interface AIGenerateParams {
  promptType: AIPromptType;
  prompt: string;
  selectedText?: string; // 编辑器中选中的文本
  context?: string; // 上下文信息，如章节标题、作品信息等
}

// AI响应结果
export interface AIResponse {
  content: string;
  metadata?: {
    tokens?: number;
    processingTime?: number;
  };
}
```

**代码详解**：

1.  更新 `AIPromptType`，添加了 `correct` (纠错) 和 `continue` (续写) 两种新的快捷操作类型，并加入了 `custom` 用于自定义输入。
2.  移除了不再需要的 `promptTypeOptions` 和 `writingStyleOptions` 数组，因为 UI 将从下拉菜单改为快捷按钮。
3.  简化了 `AIGenerateParams` 接口，移除了 `writingStyle`，使参数更聚焦于核心功能。

**修改文件**：`frontend/src/components/ai-assistant/AIPromptForm.tsx`

```tsx
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  PenSquare,
  Scaling,
  Check,
  BookText,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AIPromptType, AIGenerateParams } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AIPromptFormProps {
  onSubmit: (params: AIGenerateParams) => void;
  isLoading: boolean;
  selectedText?: string;
  compact?: boolean;
}

type QuickAction = {
  type: AIPromptType;
  label: string;
  icon: LucideIcon;
  requiresSelection: boolean;
};

const quickActions: QuickAction[] = [
  { type: "expand", label: "扩写", icon: Sparkles, requiresSelection: true },
  { type: "rewrite", label: "改写", icon: PenSquare, requiresSelection: true },
  { type: "summarize", label: "缩写", icon: Scaling, requiresSelection: true },
  { type: "correct", label: "纠错", icon: Check, requiresSelection: true },
  { type: "continue", label: "续写", icon: BookText, requiresSelection: false },
];

export function AIPromptForm({
  onSubmit,
  isLoading,
  selectedText,
  compact = false,
}: AIPromptFormProps) {
  const [promptType, setPromptType] = useState<AIPromptType>("custom");
  const [prompt, setPrompt] = useState<string>("");

  const handleQuickAction = (type: AIPromptType) => {
    setPromptType(type);
    const action = quickActions.find((a) => a.type === type);
    if (action?.requiresSelection && !selectedText) {
      return;
    }
    if (type !== "continue") {
      handleSubmit(null, type);
    }
  };

  const getPlaceholder = useMemo(() => {
    switch (promptType) {
      case "continue":
        return "（选填）请输入后续剧情简述...";
      case "expand":
        return "已选择“扩写”，可直接生成或输入补充要求...";
      case "rewrite":
        return "已选择“改写”，可直接生成或输入补充要求...";
      case "summarize":
        return "已选择“缩写”，可直接生成或输入补充要求...";
      case "correct":
        return "已选择“纠错”，可直接生成...";
      default:
        return "请描述您的需求，或选择上方快捷功能...";
    }
  }, [promptType]);

  const handleSubmit = (
    e: React.FormEvent | null,
    typeOverride?: AIPromptType
  ) => {
    e?.preventDefault();
    const finalPromptType = typeOverride || promptType;
    if (prompt.trim() || selectedText || finalPromptType !== "custom") {
      onSubmit({
        promptType: finalPromptType,
        prompt,
        selectedText,
      });
    }
  };

  return (
    <Card className={cn("shadow-none border-0", compact && "p-0")}>
      <CardContent className={cn("pt-6", compact && "p-0")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {quickActions.map(({ type, label, icon: Icon, requiresSelection }) => (
              <Button
                key={type}
                variant={promptType === type ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickAction(type)}
                disabled={isLoading || (requiresSelection && !selectedText)}
                className="flex flex-col h-16"
              >
                <Icon className="h-5 w-5 mb-1" />
                <span>{label}</span>
              </Button>
            ))}
          </div>

          <div className="relative">
            <Textarea
              placeholder={getPlaceholder}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setPromptType("custom");
              }}
              rows={compact ? 4 : 6}
              disabled={isLoading}
              className="resize-none pr-12"
            />
            <Button
              type="submit"
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              disabled={isLoading || (!prompt.trim() && !selectedText)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

**代码详解**：

1.  **移除 `Select`**: 彻底删除了原有的下拉菜单，为新的快捷功能网格让路。
2.  **快捷功能网格**: 使用 `Button` 和 `lucide-react` 图标创建了一个直观的快捷功能入口，替代了旧的下拉菜单。
3.  **动态 Placeholder**: `getPlaceholder` 现在使用 `useMemo` 优化，并能根据选择的快捷功能（特别是“续写”）提供更智能、更具引导性的提示文本。
4.  **交互升级**: 点击快捷按钮会立即更新状态，对于不需要额外输入的操作，甚至可以直接触发提交，大大简化了用户操作路径。

**修改文件**：`frontend/src/hooks/useDrafts.ts`

```ts
import { useState, useEffect, useCallback } from "react";
import { Draft } from "@/types/work";
import {
  mockDrafts,
  mockDeleteDraft,
  mockConvertDraftToChapter,
  mockCreateDraft,
} from "@/lib/mock/chapters-mock-data";

export const useDrafts = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setDrafts(mockDrafts);
    setIsLoading(false);
  }, []);

  const deleteDraft = useCallback(async (draftId: string) => {
    try {
      await mockDeleteDraft(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Failed to delete draft:", error);
    }
  }, []);

  const convertDraftToChapter = useCallback(async (draftId: string) => {
    try {
      await mockConvertDraftToChapter(draftId);
      setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    } catch (error) {
      console.error("Failed to convert draft:", error);
    }
  }, []);

  const createDraft = useCallback(async (content: string) => {
    setIsSaving(true);
    try {
      const newDraft = await mockCreateDraft(content);
      setDrafts((prev) => [newDraft, ...prev]);
      return newDraft;
    } catch (error) {
      console.error("Failed to create draft:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    drafts,
    isLoading,
    isSaving,
    deleteDraft,
    convertDraftToChapter,
    createDraft,
  };
};
```

**代码详解**：

1.  在 `useDrafts` hook 中增加了 `isSaving` 状态，用于跟踪“保存到草稿”操作的异步过程。
2.  `createDraft` 函数现在会管理 `isSaving` 状态，确保在保存期间禁用相关按钮，防止重复提交。

**修改文件**：`frontend/src/components/ai-assistant/AIResponse.tsx`

```tsx
"use client";

import { useState } from "react";
import { useDrafts } from "@/hooks/useDrafts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Clipboard,
  Save,
  RefreshCw,
  ArrowUpFromLine,
  Trash2,
  Replace,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingIndicator } from "./AIAssistant";

interface AIResponseProps {
  response: string;
  isLoading: boolean;
  onRegenerate?: () => void;
  onApplyToEditor?: (text: string) => void;
  onDiscard?: () => void;
  hasSelection?: boolean;
  compact?: boolean;
}

export function AIResponse({
  response,
  isLoading,
  onRegenerate,
  onApplyToEditor,
  onDiscard,
  hasSelection = false,
  compact = false,
}: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const { createDraft, isSaving } = useDrafts();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const saveToDraft = async () => {
    if (!response) return;
    try {
      await createDraft(response);
      alert("已成功保存到草稿箱！");
    } catch (error) {
      console.error("保存草稿失败:", error);
      alert("保存草稿失败，请稍后再试。");
    }
  };

  const ApplyIcon = hasSelection ? Replace : ArrowUpFromLine;
  const applyText = hasSelection ? "替换" : "插入";

  return (
    <Card
      className={cn(
        "flex flex-col h-full",
        isLoading && "opacity-70",
        compact ? "shadow-none border-0" : ""
      )}
    >
      <CardContent className={cn("flex-grow pt-6", compact && "p-0")}>
        {response ? (
          <Textarea
            value={response}
            readOnly
            className="w-full h-full resize-none font-serif text-base leading-relaxed"
          />
        ) : (
          <div
            className={cn(
              "flex items-center justify-center text-muted-foreground h-full",
              compact ? "min-h-[150px]" : "min-h-[250px]"
            )}
          >
            {isLoading ? <LoadingIndicator /> : "生成的内容将显示在这里"}
          </div>
        )}
      </CardContent>

      {response && (
        <CardFooter
          className={cn(
            "flex justify-between items-center pt-4",
            compact && "px-0 py-2"
          )}
        >
          <div className="flex items-center space-x-2">
            {onApplyToEditor && (
              <Button
                onClick={() => onApplyToEditor(response)}
                disabled={isLoading}
                size={compact ? "sm" : "default"}
              >
                <ApplyIcon className="h-4 w-4 mr-2" />
                {applyText}
              </Button>
            )}
            <Button
              variant="outline"
              size={compact ? "sm" : "icon"}
              onClick={saveToDraft}
              disabled={isLoading || isSaving}
            >
              <Save className="h-4 w-4" />
              <span className="sr-only">保存到草稿</span>
            </Button>
            <Button
              variant="outline"
              size={compact ? "sm" : "icon"}
              onClick={copyToClipboard}
              disabled={isLoading}
            >
              <Clipboard className="h-4 w-4" />
              <span className="sr-only">{copied ? "已复制" : "复制"}</span>
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {onDiscard && (
              <Button
                variant="ghost"
                size={compact ? "sm" : "default"}
                onClick={onDiscard}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                放弃
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={onRegenerate}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
```

**代码详解**：

1.  **组合式按钮栏**: 重新设计了底部的操作按钮，将核心操作（插入/替换、保存、复制）和辅助操作（放弃、重新生成）分开，布局更清晰。
2.  **动态“插入/替换”**: `onApplyToEditor` 按钮现在能根据编辑器中是否有选中文本（通过 `hasSelection` prop 判断）动态显示为“插入”或“替换”，并使用不同的图标，交互更智能。
3.  **新增“放弃”功能**: 添加了“放弃”按钮，允许用户清空当前结果，返回初始界面，形成完整的操作闭环。
4.  **优雅加载**: 在加载中且没有响应时，会显示一个优雅的 `LoadingIndicator` 动画，而不是简单的文字提示。

**修改文件**：`frontend/src/hooks/ai/useAIAssistant.ts`

```ts
import { useState, useCallback } from "react";
import { AIGenerateParams } from "@/types/ai";
import { mockGenerateAIResponse } from "@/lib/mock/ai-mock-data";

const MAX_HISTORY_LENGTH = 5;

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<AIGenerateParams | null>(
    null
  );
  const [history, setHistory] = useState<string[]>([]);

  const generateResponse = useCallback(
    async (params: AIGenerateParams) => {
      setIsLoading(true);
      setError(null);
      setCurrentPrompt(params);

      try {
        const result = await mockGenerateAIResponse(params);
        setResponse(result);
        if (typeof result === 'string' && result) {
          setHistory((prev) => [result, ...prev].slice(0, MAX_HISTORY_LENGTH));
        }
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "生成AI回复时发生错误";
        setError(errorMessage);
        console.error("AI生成错误:", err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const regenerateResponse = useCallback(async () => {
    if (!currentPrompt) return null;
    return generateResponse(currentPrompt);
  }, [currentPrompt, generateResponse]);

  const clearResponse = useCallback(() => {
    setResponse("");
    setError(null);
    setCurrentPrompt(null);
  }, []);

  const applyFromHistory = useCallback((text: string) => {
    setResponse(text);
  }, []);

  return {
    isLoading,
    response,
    error,
    history,
    generateResponse,
    regenerateResponse,
    clearResponse,
    applyFromHistory,
    hasPrompt: !!currentPrompt,
  };
}
```

**代码详解**：

1.  **历史记录**: 在 `useAIAssistant` hook 中增加了 `history` 状态，用于存储最近 5 次的 AI 生成结果。
2.  **防止崩溃**: 在 `generateResponse` 函数中，增加了对 `result` 的检查。只有当 `result` 是一个有效的字符串时，才会将其添加到 `history` 数组中。这修复了一个严重的运行时 bug，该 bug 会在 `mockGenerateAIResponse` 返回 `undefined` 时导致应用崩溃。
3.  **功能闭环**: 增加了 `regenerateResponse`（重新生成）、`clearResponse`（清除/放弃）和 `applyFromHistory`（从历史记录应用）等函数，为 `AIAssistant` 组件提供了完整的状态管理逻辑。

**修改文件**：`frontend/src/components/ai-assistant/AIAssistant.tsx`

```tsx
"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, History, Lightbulb } from "lucide-react";
import { useAIAssistant } from "@/hooks/ai/useAIAssistant";
import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  compact?: boolean;
}

interface HistoryTabProps {
  history: string[];
  onSelect: (text: string) => void;
  compact?: boolean;
}

export const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <Loader className="h-5 w-5 animate-spin" />
    <span>AI 思考中...</span>
  </div>
);

const HistoryTab = ({ history, onSelect, compact }: HistoryTabProps) => {
  if (!history || history.length === 0) {
    return (
      <div
        className={cn(
          "text-center text-muted-foreground py-10",
          compact && "py-4"
        )}
      >
        暂无历史记录
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item, index) => (
        <Card
          key={index}
          className="cursor-pointer hover:bg-muted/50"
          onClick={() => onSelect(item)}
        >
          <CardContent className="p-3">
            <p className="truncate text-sm">{item}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export function AIAssistant({
  selectedText,
  onApplyToEditor,
  compact = false,
}: AIAssistantProps) {
  const {
    isLoading,
    response,
    error,
    history,
    generateResponse,
    regenerateResponse,
    clearResponse,
    applyFromHistory,
    hasPrompt,
  } = useAIAssistant();

  const handleApply = (text: string) => {
    onApplyToEditor?.(text);
    clearResponse();
  };

  const handleDiscard = () => {
    clearResponse();
  };

  const handleHistorySelect = (text: string) => {
    applyFromHistory(text);
  };

  const showResponseView = isLoading || response || error;

  return (
    <div className={cn("w-full", compact ? "" : "p-4")}>
      <Tabs defaultValue="prompt" className="w-full">
        <TabsList className={cn("grid w-full grid-cols-2", !showResponseView && "hidden")}>
          <TabsTrigger value="prompt">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI 助手
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            历史记录
          </TabsTrigger>
        </TabsList>
        <TabsContent value="prompt">
          <Card className={cn(compact && "border-0 shadow-none")}>
            {!compact && showResponseView && (
              <CardHeader>
                <CardTitle>AI 助手</CardTitle>
              </CardHeader>
            )}
            <CardContent className={cn(compact && "p-0")}>
              {showResponseView ? (
                <AIResponse
                  response={response}
                  isLoading={isLoading}
                  onRegenerate={regenerateResponse}
                  onApplyToEditor={handleApply}
                  onDiscard={handleDiscard}
                  hasSelection={!!selectedText}
                  compact={compact}
                />
              ) : (
                <AIPromptForm
                  onSubmit={generateResponse}
                  isLoading={isLoading}
                  selectedText={selectedText}
                  compact={compact}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab
            history={history}
            onSelect={handleHistorySelect}
            compact={compact}
          />
        </TabsContent>
      </Tabs>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
```

**代码详解**：

1.  **统一状态管理**: `AIAssistant` 作为核心组件，现在通过 `useAIAssistant` hook 统一管理所有状态，包括加载、响应、错误和历史记录。
2.  **视图切换**: 组件能智能地根据 `isLoading`, `response`, `error` 等状态判断应该显示“提问表单”还是“响应视图”，实现了流畅的单页体验。
3.  **历史记录选项卡**: 新增了“历史记录”选项卡，用户可以方便地查看和复用之前的生成结果。
4.  **组件复用**: `LoadingIndicator` 被提取为一个独立的、可复用的组件，提高了代码的整洁度。
5.  **兼容性**: 通过 `compact` prop，`AIAssistant` 可以在不同上下文（如独立页面和浮动按钮）中以不同密度进行渲染，实现了 UI 的高度复用。

**修改文件**：`frontend/src/components/ai-assistant/AIFloatingButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Sparkles } from "lucide-react";
import { AIAssistant } from "./AIAssistant";

interface AIFloatingButtonProps {
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
}

export function AIFloatingButton({
  selectedText,
  onApplyToEditor,
}: AIFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = (text: string) => {
    onApplyToEditor?.(text);
    setIsOpen(false);
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50"
        >
          <Sparkles className="h-7 w-7" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl p-4">
          <AIAssistant
            selectedText={selectedText}
            onApplyToEditor={handleApply}
            compact={true}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

**代码详解**：

1.  **重构为包装器**: `AIFloatingButton` 不再包含复杂的 UI 逻辑，而是变成了一个围绕 `AIAssistant` 组件的简单包装器。
2.  **UI 一致性**: 通过在 `Drawer` 中渲染 `AIAssistant` 并传入 `compact={true}`，确保了浮动按钮弹出的 AI 助手与独立页面版本在功能和体验上完全一致。
3.  **状态传递**: `onApplyToEditor` 回调函数被正确地传递给 `AIAssistant`，并在应用文本后自动关闭抽屉，交互流程顺畅。

## 结论

通过本次重构，我们成功地将 AI 写作助手从一个基础功能升级为一个现代、高效且功能丰富的核心特性。新的 UI 设计和交互流程不仅解决了旧版本的问题，还引入了历史记录、快捷操作等高级功能，极大地提升了用户体验。同时，通过修复关键的运行时 bug，我们确保了应用的稳定性和可靠性。