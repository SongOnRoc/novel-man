## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局
9. 创建了首页，包括统计卡片、最近作品和快速操作组件
10. 创建了主题切换按钮
11. 创建了作品列表页面
12. 创建了新作品页面
13. 安装了表单处理和验证相关的依赖
14. 创建了章节管理页面
15. 创建了草稿箱页面
16. 集成了Tiptap编辑器并创建了编辑器组件
17. 创建了章节编辑页面

## 第18步：AI写作助手 - 第1部分：基础设置和Hook

在小说创作过程中，作家需要随时获取AI的帮助来提升写作效率。我们需要创建一个灵活、可复用的AI写作助手组件，并采用集中式的hooks管理方式，使其可以在多个页面和编辑环境中重用。

首先，我们需要创建基础的类型定义、模拟数据和Hook，为后续的组件开发提供基础。

**执行命令**：
```
mkdir -p src/types/ai
mkdir -p src/lib
mkdir -p src/hooks/ai
mkdir -p src/hooks
touch src/types/ai/index.ts
touch src/lib/ai-mock-data.ts
touch src/hooks/ai/useAIAssistant.ts
touch src/hooks/index.ts
```

**创建文件**：`src/types/ai/index.ts`

```tsx
// AI辅助类型定义
export type AIPromptType = 
  | "expand" // 扩写
  | "summarize" // 缩写/总结
  | "rewrite" // 改写
  | "plot-idea" // 情节构思
  | "character-design" // 角色设计
  | "world-building" // 世界观构建
  | "dialogue" // 对话生成
  | "text-polish"; // 文本优化

// 提示类型选项数组，用于下拉选择
export const promptTypeOptions = [
  { value: "expand", label: "扩写内容" },
  { value: "summarize", label: "缩写/总结" },
  { value: "rewrite", label: "改写内容" },
  { value: "plot-idea", label: "情节构思" },
  { value: "character-design", label: "角色设计" },
  { value: "world-building", label: "世界观构建" },
  { value: "dialogue", label: "对话生成" },
  { value: "text-polish", label: "文本优化" },
];

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

**创建文件**：`src/lib/ai-mock-data.ts`

```tsx
import { AIPromptType } from "@/types/ai";

// 示例AI回复，实际应用中应通过API调用获取
export const mockAIResponses: Record<AIPromptType, string> = {
  "expand": "他走进那间废弃多年的老屋，立刻被一股霉味和尘埃呛得咳嗽起来。屋内光线昏暗，只有几缕阳光透过布满蛛网的窗户洒进来，在空气中形成几道可见的光柱，无数灰尘在光柱中缓缓飘舞。",
  "summarize": "主角发现家族秘密：老宅壁炉上找到祖父留下的盒子，内含关键线索，揭示家族与古老术法的联系。",
  "rewrite": "他踏入那座被遗忘的宅院，瞬间被岁月的气息包围。光线如同稀有的宝藏，仅从蛛网密布的窗缝中泄露几缕，在尘埃弥漫的空气中划出几道金色的界限。",
  "plot-idea": "在一个被诅咒的世界里，人们的寿命被限制在25岁。主角发现自己拥有延长他人寿命的能力，但每次使用这种能力，就会缩短自己的生命。",
  "character-design": "角色名：林明远\n\n背景：出生于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。他被一位隐居的老者收养，学习了独特的炼丹技术。",
  "world-building": "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。",
  "dialogue": "林逸：「师父说过，修真之路，不在争强好胜，而在明心见性。」\n\n沈月：「那是因为你师父已经站在了金字塔顶端，居高临下地说这种话当然轻松。」",
  "text-polish": "原文：他快速地跑向了大门，心里非常害怕，因为他知道如果被发现的话，后果会很严重。\n\n修改后：\n他的脚步如同秋风扫落叶，贴着墙根悄无声息地向大门掠去。"
};

// 生成AI响应的模拟函数
export async function mockGenerateAIResponse(params: {
  promptType: AIPromptType;
  prompt: string;
  selectedText?: string;
}): Promise<string> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // 根据提示类型返回不同的模拟响应
  const baseResponse = mockAIResponses[params.promptType];
  
  // 如果有选中文本，则生成更具针对性的回复
  if (params.selectedText && ["expand", "summarize", "rewrite"].includes(params.promptType)) {
    const selectedPreview = params.selectedText.slice(0, 20) + (params.selectedText.length > 20 ? "..." : "");
    return `基于您选择的文本「${selectedPreview}」，${baseResponse}`;
  }
  
  return baseResponse;
}
```

**创建文件**：`src/hooks/ai/useAIAssistant.ts`

```tsx
import { useState, useCallback } from 'react';
import { AIPromptType } from '@/types/ai';
import { mockGenerateAIResponse } from '@/lib/ai-mock-data';

/**
 * AI写作助手Hook
 * 提供AI内容生成、响应管理和错误处理功能
 */
export function useAIAssistant() {
  // 加载状态
  const [isLoading, setIsLoading] = useState(false);
  // AI响应内容
  const [response, setResponse] = useState<string>('');
  // 错误信息
  const [error, setError] = useState<string | null>(null);
  // 当前提示类型和内容（用于重新生成）
  const [currentPrompt, setCurrentPrompt] = useState<{
    type: AIPromptType;
    content: string;
    selectedText?: string;
  } | null>(null);
  
  /**
   * 生成AI响应
   */
  const generateResponse = useCallback(async (
    promptType: AIPromptType,
    prompt: string,
    selectedText?: string
  ) => {
    // 设置加载状态和清除错误
    setIsLoading(true);
    setError(null);
    
    // 保存当前提示信息，用于后续重新生成
    setCurrentPrompt({
      type: promptType,
      content: prompt,
      selectedText
    });
    
    try {
      // 在实际应用中，这里应该调用后端API
      // 在MVP版本中，使用模拟数据
      const result = await mockGenerateAIResponse({
        promptType,
        prompt,
        selectedText
      });
      
      // 设置响应结果
      setResponse(result);
      return result;
    } catch (err) {
      // 错误处理
      const errorMessage = err instanceof Error ? err.message : '生成AI回复时发生错误';
      setError(errorMessage);
      console.error("AI生成错误:", err);
      return null;
    } finally {
      // 无论成功或失败，都结束加载状态
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 重新生成响应，使用之前的提示参数
   */
  const regenerateResponse = useCallback(async () => {
    if (!currentPrompt) return null;
    
    return generateResponse(
      currentPrompt.type,
      currentPrompt.content,
      currentPrompt.selectedText
    );
  }, [currentPrompt, generateResponse]);
  
  /**
   * 清除响应和错误状态
   */
  const clearResponse = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);
  
  return {
    isLoading,
    response,
    error,
    generateResponse,
    regenerateResponse,
    clearResponse,
    hasPrompt: !!currentPrompt
  };
}
```

**创建文件**：`src/hooks/index.ts`

```tsx
// 统一导出所有hooks，方便在其他地方导入

// AI相关hooks
export { useAIAssistant } from './ai/useAIAssistant';

// 未来可以添加更多hooks
// 例如：
// export { useWorks } from './works/useWorks';
// export { useChapters } from './chapters/useChapters';
// export { useSettings } from './settings/useSettings';
```

**执行目的**：
1. **类型定义**：创建AI相关的类型定义，提供类型安全和自动补全
2. **模拟数据**：提供测试数据，使我们能在没有后端API的情况下开发前端
3. **Hook封装**：将AI助手的核心逻辑封装在一个自定义Hook中，实现关注点分离
4. **统一导出**：通过index.ts统一导出所有hooks，简化导入路径

这种设计遵循了以下原则：
- **关注点分离**：将数据处理逻辑与UI组件分离
- **可复用性**：Hook可以在多个组件中重用
- **可测试性**：逻辑封装使测试更容易
- **可维护性**：集中管理相关功能，便于后续扩展

**替代方案**：
1. **Context API**：使用React Context全局管理状态，但对于局部使用的功能可能过重
2. **Redux/Zustand**：使用状态管理库，但对于简单功能可能过于复杂
3. **内联逻辑**：直接在组件中编写逻辑，但会导致代码重复和难以维护

## 第18步：AI写作助手 - 第2部分：UI组件

在完成了AI写作助手的基础设置和Hook后，我们需要创建相应的UI组件，以便用户能够与AI助手交互。这些组件需要设计成可复用的形式，以便在不同场景下使用。

**执行命令**：
```
mkdir -p src/components/ai-assistant
touch src/components/ai-assistant/AIPromptForm.tsx
touch src/components/ai-assistant/AIResponse.tsx
touch src/components/ai-assistant/AIFloatingButton.tsx
touch src/components/ai-assistant/AIAssistant.tsx
```

**创建文件**：`src/components/ai-assistant/AIPromptForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AIPromptType, promptTypeOptions } from "@/types/ai";

// 定义AIPromptForm组件的属性类型
interface AIPromptFormProps {
  onSubmit: (promptType: AIPromptType, prompt: string) => void;
  isLoading: boolean;
  selectedText?: string; // 从编辑器选中的文本
  initialPromptType?: AIPromptType; // 初始提示类型
  compact?: boolean; // 是否使用紧凑布局
}

/**
 * AI提示表单组件
 * 允许用户选择AI辅助类型并输入需求
 */
export function AIPromptForm({ 
  onSubmit, 
  isLoading, 
  selectedText, 
  initialPromptType = "plot-idea",
  compact = false 
}: AIPromptFormProps) {
  // 状态管理
  const [promptType, setPromptType] = useState<AIPromptType>(initialPromptType);
  const [prompt, setPrompt] = useState<string>("");
  
  // 根据选中的提示类型生成占位符文本
  const getPlaceholder = () => {
    switch(promptType) {
      case "expand":
        return "请扩写选中的文本，增加更多细节和描述...";
      case "summarize":
        return "请总结选中的文本，保留核心内容...";
      case "rewrite":
        return "请改写选中的文本，使用不同的表达方式...";
      case "plot-idea":
        return "我需要构思一个修仙小说的情节，主角遇到了...";
      case "character-design":
        return "我想创建一个性格复杂的反派角色，他有什么样的背景和动机...";
      case "world-building":
        return "我正在构建一个架空的古代世界，需要设计其社会制度和文化...";
      case "dialogue":
        return "我需要两个角色之间的对话，一个是老师，一个是学生，讨论...";
      case "text-polish":
        return "请帮我优化以下文本，使其更生动、更有文学性...";
      default:
        return "请描述您的需求...";
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() || selectedText) {
      onSubmit(promptType, prompt);
    }
  };

  // 选中文本提示
  const selectedTextHint = selectedText 
    ? `您已选择${selectedText.length}个字符的文本进行${promptTypeOptions.find(opt => opt.value === promptType)?.label || '处理'}` 
    : null;

  return (
    <Card className={compact ? "shadow-none border-0" : ""}>
      <CardContent className={compact ? "p-0" : "pt-6"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 提示类型选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择辅助类型</label>
            <Select
              value={promptType}
              onValueChange={(value) => setPromptType(value as AIPromptType)}
              disabled={isLoading}
            >
              <SelectTrigger className={compact ? "h-8 text-sm" : ""}>
                <SelectValue placeholder="选择提示类型" />
              </SelectTrigger>
              <SelectContent>
                {promptTypeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 选中文本提示 */}
          {selectedTextHint && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {selectedTextHint}
            </div>
          )}

          {/* 提示输入框 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">输入您的需求</label>
            <Textarea
              placeholder={getPlaceholder()}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={compact ? 3 : 6}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <Button 
            type="submit" 
            disabled={isLoading || (!prompt.trim() && !selectedText)}
            className={compact ? "h-8 text-sm" : ""}
          >
            {isLoading ? "生成中..." : "生成内容"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**创建文件**：`src/components/ai-assistant/AIResponse.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Save, RefreshCw, ArrowUpFromLine } from "lucide-react";

// 定义AIResponse组件的属性类型
interface AIResponseProps {
  response: string;
  isLoading: boolean;
  onRegenerate?: () => void;
  onApplyToEditor?: (text: string) => void; // 应用到编辑器的回调
  compact?: boolean; // 是否使用紧凑布局
}

/**
 * AI响应组件
 * 展示AI生成的内容并提供互动功能
 */
export function AIResponse({ 
  response, 
  isLoading, 
  onRegenerate,
  onApplyToEditor,
  compact = false 
}: AIResponseProps) {
  // 状态管理
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // 复制文本到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };
  
  // 保存到草稿
  const saveToDraft = () => {
    // 模拟保存到草稿的功能
    // 实际应用中应该调用API保存到后端
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // 这里只是模拟，实际实现需要与后端API交互
    console.log("保存到草稿:", response);
    
    // 显示成功消息（在实际应用中可以使用Toast通知）
    alert("已保存到草稿箱");
  };

  return (
    <Card className={`${isLoading ? "opacity-70" : ""} ${compact ? "shadow-none border-0" : ""}`}>
      <CardContent className={compact ? "p-0" : "pt-6"}>
        {response ? (
          <div className="prose max-w-none dark:prose-invert">
            <Textarea
              value={response}
              readOnly
              rows={compact ? 6 : 12}
              className="resize-none font-serif text-base leading-relaxed"
            />
          </div>
        ) : (
          <div className={`flex items-center justify-center text-muted-foreground ${compact ? "h-[100px]" : "h-[200px]"}`}>
            {isLoading ? "AI正在生成内容..." : "生成的内容将显示在这里"}
          </div>
        )}
      </CardContent>
      
      {response && (
        <CardFooter className={`flex justify-between ${compact ? "px-0 py-2" : ""}`}>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={copyToClipboard}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制"}
            </Button>
            
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={saveToDraft}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <Save className="h-4 w-4 mr-2" />
              {saved ? "已保存" : "保存到草稿"}
            </Button>
            
            {onApplyToEditor && (
              <Button
                variant="outline"
                size={compact ? "sm" : "default"}
                onClick={() => onApplyToEditor(response)}
                disabled={isLoading}
                className={compact ? "h-8 text-xs" : ""}
              >
                <ArrowUpFromLine className="h-4 w-4 mr-2" />
                应用到编辑器
              </Button>
            )}
          </div>
          
          {onRegenerate && (
            <Button
              variant="ghost"
              size={compact ? "sm" : "default"}
              onClick={onRegenerate}
              disabled={isLoading}
              className={compact ? "h-8 text-xs" : ""}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新生成
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
```

**执行目的**：
创建AI写作助手的两个核心UI组件：
1. `AIPromptForm`：提供用户输入界面，包括提示类型选择和需求描述
2. `AIResponse`：展示AI生成的内容，并提供复制、保存和应用到编辑器等功能

这些组件设计具有以下特点：
1. **可复用性**：通过props配置不同的行为和外观
2. **自适应布局**：支持紧凑模式和标准模式，适应不同使用场景
3. **交互反馈**：提供加载状态、成功反馈等用户体验优化
4. **功能完整**：包含所有必要的交互功能，如复制、保存等

**替代方案**：
1. **使用第三方组件库**：如Ant Design的Form和Card组件，但可能与项目风格不一致
2. **更简单的设计**：减少功能和交互，但用户体验会下降
3. **更复杂的设计**：添加更多高级功能，但会增加复杂度和开发时间

## 第18步：AI写作助手 - 第3部分：集成组件

在完成了基础UI组件后，我们需要创建更高级别的组合组件，包括完整的AI助手和悬浮按钮，以便在不同场景中使用。

**执行命令**：
```
pnpm dlx shadcn@latest add popover
```

**创建文件**：`src/components/ai-assistant/AIFloatingButton.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { useAIAssistant } from "@/hooks";
import { AIPromptType } from "@/types/ai";
import { Sparkles } from "lucide-react";

/**
 * AI悬浮按钮组件的属性类型
 */
interface AIFloatingButtonProps {
  // 获取编辑器当前选中文本的函数
  getSelectedText?: () => string;
  // 将文本应用到编辑器的函数
  applyTextToEditor?: (text: string) => void;
  // 上下文信息，如当前章节、作品等
  context?: string;
}

/**
 * AI悬浮助手按钮组件
 * 提供快速访问AI助手的悬浮按钮，点击后显示小型AI助手面板
 */
export function AIFloatingButton({
  getSelectedText,
  applyTextToEditor,
  context
}: AIFloatingButtonProps) {
  // 控制弹出面板显示状态
  const [isOpen, setIsOpen] = useState(false);
  // 使用AI助手hook
  const { isLoading, response, generateResponse, regenerateResponse } = useAIAssistant();
  
  // 当前选中的文本
  const [selectedText, setSelectedText] = useState<string>("");
  
  // 处理弹出框打开
  const handlePopoverOpen = () => {
    // 如果提供了获取选中文本的函数，则调用它
    if (getSelectedText) {
      const text = getSelectedText();
      setSelectedText(text);
    }
    
    setIsOpen(true);
  };
  
  // 提交AI请求
  const handleSubmit = async (promptType: AIPromptType, prompt: string) => {
    await generateResponse(promptType, prompt, selectedText);
  };
  
  // 应用AI生成的文本到编辑器
  const handleApplyToEditor = (text: string) => {
    if (applyTextToEditor) {
      applyTextToEditor(text);
      setIsOpen(false); // 关闭弹出框
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          onClick={handlePopoverOpen}
          variant="outline" 
          size="icon" 
          className="rounded-full shadow-md fixed bottom-6 right-6 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">AI写作助手</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              关闭
            </Button>
          </div>
          
          <AIPromptForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            selectedText={selectedText}
            initialPromptType={selectedText ? "rewrite" : "plot-idea"}
            compact={true}
          />
          
          <AIResponse
            response={response}
            isLoading={isLoading}
            onRegenerate={regenerateResponse}
            onApplyToEditor={handleApplyToEditor}
            compact={true}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**创建文件**：`src/components/ai-assistant/AIAssistant.tsx`

```tsx
"use client";

import { useState } from "react";
import { AIPromptForm } from "./AIPromptForm";
import { AIResponse } from "./AIResponse";
import { useAIAssistant } from "@/hooks";
import { AIPromptType } from "@/types/ai";

/**
 * 完整AI助手组件的属性类型
 */
interface AIAssistantProps {
  selectedText?: string;
  onApplyText?: (text: string) => void;
  compact?: boolean;
  className?: string;
}

/**
 * 完整的AI助手组件
 * 包含提示表单和响应显示，可在页面中嵌入使用
 */
export function AIAssistant({
  selectedText,
  onApplyText,
  compact = false,
  className = ""
}: AIAssistantProps) {
  const { isLoading, response, generateResponse, regenerateResponse } = useAIAssistant();

  // 处理表单提交
  const handleSubmit = (promptType: AIPromptType, prompt: string) => {
    generateResponse(promptType, prompt, selectedText);
  };

  return (
    <div className={`grid gap-8 ${compact ? "grid-cols-1" : "md:grid-cols-2"} ${className}`}>
      {/* 左侧：提示输入表单 */}
      <div>
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold mb-4`}>您的需求</h2>
        <AIPromptForm 
          onSubmit={handleSubmit} 
          isLoading={isLoading} 
          selectedText={selectedText}
          compact={compact}
        />
      </div>
      
      {/* 右侧：AI响应 */}
      <div>
        <h2 className={`${compact ? "text-lg" : "text-xl"} font-semibold mb-4`}>AI响应</h2>
        <AIResponse 
          response={response} 
          isLoading={isLoading} 
          onRegenerate={regenerateResponse} 
          onApplyToEditor={onApplyText}
          compact={compact}
        />
      </div>
    </div>
  );
}
```

**执行目的**：
创建两个高级别的AI助手组件：
1. `AIFloatingButton`：悬浮按钮形式的AI助手，可以在编辑器等场景中随时调用
2. `AIAssistant`：完整的AI助手组件，可以嵌入到页面中

这些组件具有以下特点：
1. **集成Hook**：直接使用`useAIAssistant`，简化状态管理
2. **场景适应**：悬浮按钮适合在编辑过程中使用，完整组件适合在专门的AI助手页面使用
3. **编辑器集成**：支持获取选中文本和将生成内容应用到编辑器
4. **响应式设计**：在不同屏幕尺寸下有合适的布局

通过这种组件化设计，我们可以在系统的不同部分轻松集成AI写作助手功能，包括：
- 在编辑器页面添加悬浮按钮，随时获取AI帮助
- 在章节管理页面嵌入AI助手，帮助生成章节内容
- 创建专门的AI助手页面，提供更全面的AI写作支持

**替代方案**：
1. **模态对话框**：使用模态框而不是悬浮按钮，但可能打断用户的写作流程
2. **侧边抽屉**：使用侧边抽屉展示AI助手，提供更大的空间但占用屏幕
3. **内联集成**：直接将AI功能嵌入编辑器工具栏，但可能使界面过于复杂

## 第18步：AI写作助手 - 第4部分：页面集成

现在我们已经创建了所有必要的AI写作助手组件，需要将它们集成到系统的不同页面中。我们将创建一个专门的AI助手页面，并将悬浮按钮集成到编辑器页面。

**执行命令**：
```
mkdir -p src/app/\(main\)/tools/ai-assistant
touch src/app/\(main\)/tools/ai-assistant/page.tsx
```

**创建文件**：`src/app/(main)/tools/ai-assistant/page.tsx`

```tsx
"use client";

import { AIAssistant } from "@/components/ai-assistant/AIAssistant";

/**
 * AI写作助手页面
 * 提供完整的AI写作辅助功能
 */
export default function AIAssistantPage() {
  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI写作助手</h1>
        <p className="text-muted-foreground">
          描述您的写作需求，AI将为您提供创意、角色设计、情节构思或文本优化建议。
        </p>
      </div>

      {/* 完整的AI助手组件 */}
      <AIAssistant />
      
      {/* 使用说明 */}
      <div className="bg-muted p-4 rounded-lg mt-8">
        <h3 className="font-medium mb-2">使用提示</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>选择特定的辅助类型可以获得更精准的回复</li>
          <li>详细描述您的需求，包括背景、风格和特定要求</li>
          <li>生成的内容仅供参考，请根据您的创作风格进行调整</li>
          <li>您可以将满意的内容保存到草稿箱，方便后续编辑</li>
          <li>在编辑器中，您也可以通过右下角的悬浮按钮随时使用AI助手</li>
        </ul>
      </div>
    </div>
  );
}
```

**修改文件**：`src/components/editor/TiptapEditor.tsx`

现在我们需要修改之前创建的Tiptap编辑器组件，集成AI悬浮按钮。假设我们已经创建了这个文件，我们需要添加以下代码：

```tsx
// 在return语句的最外层div中添加AIFloatingButton组件
return (
  <div className="flex flex-col border rounded-md shadow-sm">
    {/* 标题输入 */}
    <div className="p-4 border-b">
      <Label htmlFor="title" className="sr-only">
        标题
      </Label>
      <Input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="输入标题..."
        className="border-none text-xl font-semibold focus-visible:ring-0 px-0"
      />
    </div>

    {/* 工具栏 */}
    <EditorToolbar
      editor={editor}
      onSave={handleSave}
      isSaving={isSaving}
      wordCount={wordCount}
    />

    {/* 内容编辑区 */}
    <div className="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px]">
      <EditorContent editor={editor} className="min-h-[300px] outline-none" />
    </div>

    {/* AI悬浮按钮 */}
    <AIFloatingButton 
      getSelectedText={getSelectedText} 
      applyTextToEditor={applyTextToEditor}
      context={`标题：${title || '未命名'}`}
    />

    {/* 编辑器样式 */}
    <style jsx global>{`
      .ProseMirror {
        min-height: 300px;
        outline: none;
      }
      .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        float: left;
        color: #adb5bd;
        pointer-events: none;
        height: 0;
      }
    `}</style>
  </div>
);
```

**执行目的**：
1. **创建专门的AI助手页面**：提供完整的AI写作辅助功能，包括使用说明
2. **集成AI悬浮按钮到编辑器**：让用户在写作过程中随时获取AI帮助

这种集成方式具有以下优势：
1. **无缝体验**：用户可以在不离开编辑器的情况下获取AI帮助
2. **上下文感知**：AI助手可以获取当前选中的文本，提供更相关的帮助
3. **直接应用**：生成的内容可以直接应用到编辑器中，无需复制粘贴
4. **多场景支持**：既有专门的AI助手页面，也有嵌入式的快速访问方式

**替代方案**：
1. **编辑器工具栏集成**：将AI功能直接添加到编辑器工具栏，但可能使工具栏过于复杂
2. **侧边面板**：使用可折叠的侧边面板展示AI助手，提供更多空间但可能影响编辑区域
3. **快捷键触发**：通过快捷键组合触发AI助手，但对新用户不够直观

通过这种方式，我们成功地将AI写作助手集成到了小说管理系统中，使其成为一个可在多个场景下使用的核心功能组件。
