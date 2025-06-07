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

## 第16步（修订）：集成Tiptap编辑器

**执行命令**：
```
cd novel/frontend
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-underline @tiptap/extension-text-align
mkdir -p src/components/editor
touch src/components/editor/TiptapEditor.tsx
touch src/components/editor/EditorToolbar.tsx
```

**执行目的**：
我们安装Tiptap相关依赖并创建编辑器组件文件。选择Tiptap作为编辑器框架是因为：
1. 它提供了真正的富文本编辑体验，适合小说内容的编辑需求
2. 基于ProseMirror，这是一个成熟稳定的编辑器引擎，被许多大型应用使用
3. 模块化设计，可以按需添加功能，保持bundle体积合理
4. 支持协作编辑（对未来版本很重要）
5. 提供良好的React集成

我们安装的包各有特定用途：
- `@tiptap/react`：Tiptap的React组件封装
- `@tiptap/pm`：ProseMirror核心库
- `@tiptap/starter-kit`：基本编辑功能的集合，包括段落、标题、加粗、斜体等
- `@tiptap/extension-placeholder`：为编辑器添加占位文本功能
- `@tiptap/extension-underline`：添加下划线功能（starter-kit中不包含）
- `@tiptap/extension-text-align`：添加文本对齐功能

**替代方案**：
1. **Draft.js**：Facebook开发的React富文本编辑器框架
   - 优点：与React深度集成
   - 缺点：API较复杂，社区更新较慢，不支持协作编辑
   
2. **Slate.js**：完全可定制的框架
   - 优点：极高的灵活性
   - 缺点：需要编写大量代码来实现基本功能，学习曲线陡峭
   
3. **CKEditor或TinyMCE**：成熟的商业编辑器
   - 优点：功能全面，开箱即用
   - 缺点：体积大，定制化困难，商业许可可能有限制
   
4. **Quill**：轻量级编辑器
   - 优点：简单易用，体积小
   - 缺点：扩展性有限，不如Tiptap灵活

Tiptap在这些选项中提供了最好的平衡：功能丰富但不臃肿，易于使用但又高度可扩展，适合小说管理系统从MVP到高级版本的全过程。

**创建文件**：`src/components/editor/EditorToolbar.tsx`

```tsx
import { Editor } from '@tiptap/react';
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Save,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 编辑器工具栏属性
interface EditorToolbarProps {
  editor: Editor | null;  // Tiptap编辑器实例，可能为null（初始化前）
  onSave: () => void;     // 保存回调函数
  isSaving: boolean;      // 是否正在保存
  wordCount: number;      // 字数统计
}

// 编辑器工具栏组件
export function EditorToolbar({ editor, onSave, isSaving, wordCount }: EditorToolbarProps) {
  // 如果编辑器未初始化，返回空工具栏
  if (!editor) {
    return (
      <div className="novel-editor-toolbar flex items-center justify-between border-b p-2">
        <div className="flex flex-wrap gap-1"></div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">0 字</div>
          <Button disabled className="gap-1" size="sm">
            <Save className="h-4 w-4" />
            保存
          </Button>
        </div>
      </div>
    );
  }

  // 工具按钮数据
  const tools = [
    { 
      icon: Bold, 
      tooltip: "加粗 (Ctrl+B)", 
      isActive: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    { 
      icon: Italic, 
      tooltip: "斜体 (Ctrl+I)",
      isActive: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    { 
      icon: Underline, 
      tooltip: "下划线 (Ctrl+U)",
      isActive: editor.isActive('underline'),
      onClick: () => editor.chain().focus().toggleUnderline().run(),
    },
    { 
      icon: List, 
      tooltip: "无序列表",
      isActive: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    { 
      icon: ListOrdered, 
      tooltip: "有序列表",
      isActive: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    { 
      icon: AlignLeft, 
      tooltip: "左对齐",
      isActive: editor.isActive({ textAlign: 'left' }),
      onClick: () => editor.chain().focus().setTextAlign('left').run(),
    },
    { 
      icon: AlignCenter, 
      tooltip: "居中",
      isActive: editor.isActive({ textAlign: 'center' }),
      onClick: () => editor.chain().focus().setTextAlign('center').run(),
    },
    { 
      icon: AlignRight, 
      tooltip: "右对齐",
      isActive: editor.isActive({ textAlign: 'right' }),
      onClick: () => editor.chain().focus().setTextAlign('right').run(),
    },
  ];

  return (
    <div className="novel-editor-toolbar flex items-center justify-between border-b p-2">
      {/* 格式化工具按钮 */}
      <div className="flex flex-wrap gap-1">
        {tools.map((tool, index) => (
          <Tooltip key={index} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant={tool.isActive ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={tool.onClick}
              >
                <tool.icon className="h-4 w-4" />
                <span className="sr-only">{tool.tooltip}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.tooltip}</TooltipContent>
          </Tooltip>
        ))}
        
        {/* 撤销/重做按钮 */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
              <span className="sr-only">撤销</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>撤销 (Ctrl+Z)</TooltipContent>
        </Tooltip>
        
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
              <span className="sr-only">重做</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>重做 (Ctrl+Y)</TooltipContent>
        </Tooltip>
      </div>
      
      {/* 右侧区域：字数统计和保存按钮 */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-muted-foreground">
          {wordCount} 字
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          className="gap-1"
          size="sm"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </div>
  );
}
```

**代码详解**：

1. **接口定义**：
   - `EditorToolbarProps`定义了工具栏需要的属性：编辑器实例、保存回调、保存状态和字数统计
   - 编辑器实例可能为null，这是因为Tiptap编辑器初始化是异步的

2. **空状态处理**：
   - 当编辑器未初始化时，显示一个简化版的工具栏，避免报错
   - 这种防御性编程很重要，确保组件在任何状态下都能正常渲染

3. **工具按钮数据**：
   - 使用数组定义工具按钮，包括图标、提示文本、激活状态和点击处理函数
   - 这种数据驱动的方式使代码更简洁，易于维护和扩展
   - 每个工具都关联到Tiptap的相应命令，如`toggleBold()`、`toggleItalic()`等

4. **按钮状态反馈**：
   - 使用`isActive`检查当前文本是否应用了特定格式
   - 当格式激活时，按钮使用`secondary`变体显示，提供视觉反馈
   - 这种状态反馈对用户体验至关重要，让用户知道当前文本的格式状态

5. **撤销/重做功能**：
   - 单独处理撤销/重做按钮，因为它们需要检查是否可用
   - 使用`editor.can().undo()`和`editor.can().redo()`判断按钮是否应该禁用
   - 这防止用户尝试执行不可能的操作，提升用户体验

6. **辅助功能**：
   - 使用`sr-only`类为屏幕阅读器提供文本，增强可访问性
   - 使用Tooltip组件显示提示，帮助用户了解按钮功能和快捷键

7. **保存功能和字数统计**：
   - 右侧显示字数统计，这对作者很重要
   - 保存按钮在保存过程中显示"保存中..."，并禁用点击，防止重复提交

**创建文件**：`src/components/editor/TiptapEditor.tsx`

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { EditorToolbar } from "./EditorToolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 编辑器内容类型
export interface EditorContent {
  title: string;
  content: string;
}

// Tiptap编辑器属性
interface TiptapEditorProps {
  initialContent?: EditorContent;  // 初始内容
  onSave?: (content: EditorContent) => void;  // 保存回调
  placeholder?: string;  // 占位文本
  autoFocus?: boolean;  // 是否自动聚焦
}

// 计算字数的函数
function countWords(html: string): number {
  if (!html) return 0;
  
  // 创建临时元素来解析HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 获取纯文本内容
  const text = temp.textContent || temp.innerText || '';
  
  // 移除多余空白字符
  const trimmedText = text.trim();
  if (!trimmedText) return 0;
  
  // 匹配中文字符和英文单词
  const chineseChars = trimmedText.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = trimmedText.match(/[a-zA-Z]+/g) || [];
  
  return chineseChars.length + englishWords.length;
}

// Tiptap编辑器组件
export function TiptapEditor({
  initialContent = { title: "", content: "" },
  onSave,
  placeholder = "开始您的创作...",
  autoFocus = false,
}: TiptapEditorProps) {
  // 标题状态
  const [title, setTitle] = useState(initialContent.title);
  // 保存状态
  const [isSaving, setIsSaving] = useState(false);
  // 字数状态
  const [wordCount, setWordCount] = useState(0);
  
  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent.content,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      // 更新字数统计
      setWordCount(countWords(editor.getHTML()));
    },
  });
  
  // 获取当前内容
  const getCurrentContent = useCallback(() => {
    if (!editor) return { title, content: "" };
    return {
      title,
      content: editor.getHTML(),
    };
  }, [editor, title]);
  
  // 保存处理函数
  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        const content = getCurrentContent();
        await onSave(content);
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // 自动保存（每5秒）
  useEffect(() => {
    if (!editor || !onSave) return;
    
    const autoSaveInterval = setInterval(() => {
      const content = getCurrentContent();
      if (content.title || content.content !== "<p></p>") {
        console.log("自动保存...");
        onSave(content);
      }
    }, 5000);
    
    return () => clearInterval(autoSaveInterval);
  }, [editor, getCurrentContent, onSave]);
  
  // 初始化字数统计
  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getHTML()));
    }
  }, [editor]);

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
}
```

**代码详解**：

1. **"use client"指令**：
   - 标记为客户端组件，因为Tiptap需要浏览器环境才能运行
   - 编辑器是典型的需要在客户端渲染的组件，涉及DOM操作和用户交互

2. **接口定义**：
   - `EditorContent`定义了编辑器内容的结构：标题和内容
   - `TiptapEditorProps`定义了组件属性，包括初始内容、保存回调、占位文本和自动聚焦选项

3. **字数统计函数**：
   - `countWords`函数计算HTML内容中的字数
   - 使用DOM API解析HTML并提取纯文本
   - 分别计算中文字符和英文单词，这对小说创作很重要
   - 中文按字符计数，英文按单词计数，符合写作习惯

4. **编辑器初始化**：
   - 使用`useEditor`钩子创建Tiptap编辑器实例
   - 配置扩展：`StarterKit`（基础功能）、`Underline`（下划线）、`Placeholder`（占位文本）、`TextAlign`（文本对齐）
   - 设置`onUpdate`回调更新字数统计，这在用户输入时触发

5. **内容管理**：
   - `getCurrentContent`函数获取当前编辑器内容，使用`useCallback`优化性能
   - `handleSave`函数处理保存操作，设置加载状态并调用保存回调
   - 标题使用单独的`Input`组件管理，而不是编辑器的一部分，使布局更清晰

6. **自动保存功能**：
   - 使用`useEffect`设置定时器，每5秒自动保存一次
   - 只有当内容非空时才触发保存，避免无意义的API调用
   - 在组件卸载时清除定时器，防止内存泄漏

7. **样式处理**：
   - 使用`prose`类为编辑器内容添加排版样式，提升可读性
   - 使用`dark:prose-invert`支持深色模式
   - 添加全局样式处理占位文本和编辑器最小高度

8. **组件结构**：
   - 分为三部分：标题输入、工具栏和内容编辑区
   - 使用边框和阴影创建清晰的视觉边界
   - 标题和工具栏有底部边框分隔，增强视觉层次

**执行目的**：
创建一个功能完善的富文本编辑器，专为小说创作优化。这个编辑器：
1. 提供必要的文本格式化工具（加粗、斜体、列表等）
2. 实时统计字数，这对作者非常重要
3. 自动保存功能，防止内容丢失
4. 支持深色模式，减轻长时间写作的眼睛疲劳
5. 良好的排版和间距，提升阅读和编辑体验

Tiptap编辑器比简单的文本框强大得多，它提供了结构化内容和格式控制，同时保持了良好的用户体验和性能。

您理解这一步骤吗？我们创建了基于Tiptap的富文本编辑器组件，为小说管理系统提供了专业的内容创作工具。
