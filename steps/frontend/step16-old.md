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

## 第16步：创建简单的编辑器组件

接下来，我们需要创建一个简单的编辑器组件，用于章节和草稿的编辑。在MVP版本中，我们先实现一个基础的编辑器，后续版本可以扩展更多功能。

**执行命令**：
```
mkdir -p src/components/editor
touch src/components/editor/SimpleEditor.tsx
touch src/components/editor/EditorToolbar.tsx
```

**创建文件**：`src/components/editor/EditorToolbar.tsx`

```tsx
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
  onSave: () => void;
  isSaving: boolean;
  wordCount: number;
}

// 编辑器工具栏组件
export function EditorToolbar({ onSave, isSaving, wordCount }: EditorToolbarProps) {
  // 工具按钮数据
  const tools = [
    { icon: Bold, tooltip: "加粗 (Ctrl+B)" },
    { icon: Italic, tooltip: "斜体 (Ctrl+I)" },
    { icon: Underline, tooltip: "下划线 (Ctrl+U)" },
    { icon: List, tooltip: "无序列表" },
    { icon: ListOrdered, tooltip: "有序列表" },
    { icon: AlignLeft, tooltip: "左对齐" },
    { icon: AlignCenter, tooltip: "居中" },
    { icon: AlignRight, tooltip: "右对齐" },
    { icon: Undo, tooltip: "撤销 (Ctrl+Z)" },
    { icon: Redo, tooltip: "重做 (Ctrl+Y)" },
  ];

  return (
    <div className="novel-editor-toolbar flex items-center justify-between border-b p-2">
      {/* 格式化工具按钮 */}
      <div className="flex flex-wrap gap-1">
        {tools.map((tool, index) => (
          <Tooltip key={index} delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                // 在MVP版本中，这些按钮暂时没有功能
                onClick={() => console.log(`Clicked ${tool.tooltip}`)}
              >
                <tool.icon className="h-4 w-4" />
                <span className="sr-only">{tool.tooltip}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{tool.tooltip}</TooltipContent>
          </Tooltip>
        ))}
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
1. 定义`EditorToolbarProps`接口，描述工具栏的属性
2. 创建`EditorToolbar`组件，包含格式化工具按钮和保存功能
3. 使用`tools`数组定义工具按钮数据，包括图标和提示文本
4. 添加字数统计和保存按钮
5. 在MVP版本中，格式化按钮暂时只记录点击事件，不实际改变文本格式

**创建文件**：`src/components/editor/SimpleEditor.tsx`

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { EditorToolbar } from "./EditorToolbar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 编辑器内容类型
export interface EditorContent {
  title: string;
  content: string;
}

// 简单编辑器属性
interface SimpleEditorProps {
  initialContent?: EditorContent;
  onSave?: (content: EditorContent) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

// 计算字数的函数
function countWords(text: string): number {
  // 中文和英文单词都计算在内
  // 中文按字符计算，英文按空格分隔计算
  if (!text) return 0;
  
  // 移除多余空白字符
  const trimmedText = text.trim();
  if (!trimmedText) return 0;
  
  // 匹配中文字符和英文单词
  const chineseChars = trimmedText.match(/[\u4e00-\u9fa5]/g) || [];
  const englishWords = trimmedText.match(/[a-zA-Z]+/g) || [];
  
  return chineseChars.length + englishWords.length;
}

// 简单编辑器组件
export function SimpleEditor({
  initialContent = { title: "", content: "" },
  onSave,
  placeholder = "开始您的创作...",
  autoFocus = false,
}: SimpleEditorProps) {
  // 编辑器状态
  const [title, setTitle] = useState(initialContent.title);
  const [content, setContent] = useState(initialContent.content);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // 内容输入框引用
  const contentRef = useRef<HTMLTextAreaElement>(null);
  
  // 计算字数
  useEffect(() => {
    setWordCount(countWords(content));
  }, [content]);
  
  // 自动聚焦
  useEffect(() => {
    if (autoFocus && contentRef.current) {
      contentRef.current.focus();
    }
  }, [autoFocus]);
  
  // 保存处理函数
  const handleSave = async () => {
    if (onSave) {
      setIsSaving(true);
      try {
        await onSave({ title, content });
      } finally {
        setIsSaving(false);
      }
    }
  };
  
  // 自动保存（每5秒）
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (onSave && (title || content)) {
        console.log("自动保存...");
        onSave({ title, content });
      }
    }, 5000);
    
    return () => clearInterval(autoSaveInterval);
  }, [title, content, onSave]);

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
        onSave={handleSave}
        isSaving={isSaving}
        wordCount={wordCount}
      />
      
      {/* 内容编辑区 */}
      <Textarea
        ref={contentRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-h-[300px] p-4 rounded-none border-none resize-none focus-visible:ring-0"
      />
    </div>
  );
}
```

**代码详解**：
1. 使用`"use client"`标记为客户端组件，因为需要管理状态和处理用户输入
2. 定义`EditorContent`接口，描述编辑器内容的结构
3. 创建`SimpleEditor`组件，包含标题输入、工具栏和内容编辑区
4. 实现字数统计功能，同时计算中文字符和英文单词
5. 添加自动保存功能，每5秒保存一次
6. 使用`useRef`和`useEffect`实现自动聚焦功能

## 第17步：创建章节编辑页面

接下来，我们需要创建章节编辑页面，让用户能够编辑章节内容。

**执行命令**：
```
mkdir -p src/app/(main)/chapters/[id]/edit
touch src/app/(main)/chapters/[id]/edit/page.tsx
```

**创建文件**：`src/app/(main)/chapters/[id]/edit/page.tsx`

```tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SimpleEditor, EditorContent } from "@/components/editor/SimpleEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// 模拟章节数据
const mockChapters: Record<string, EditorContent> = {
  "1-1": {
    title: "第一章 意外得到仙家传承",
    content: "李青是一个普通的农村青年，从小就对种植有着浓厚的兴趣。他家祖祖辈辈都是种地的，但收成一直平平，生活也过得紧巴巴的。\n\n这一天，李青像往常一样在自家的地里忙活。突然，他的锄头碰到了一个硬物。他以为是石头，便弯腰去捡，却发现那是一个古朴的小盒子。\n\n好奇心驱使下，他打开了盒子，里面是一本泛黄的古书和一颗晶莹剔透的种子。古书上写着《仙农传承》四个大字。\n\n当李青的手触碰到那本书的瞬间，一股奇异的能量涌入他的体内。他惊讶地发现，自己竟然能够感知到周围植物的生命力，甚至能够通过意念影响它们的生长。\n\n这一刻，李青知道自己的人生将彻底改变。他决定按照古书上的指引，将那颗神秘的种子种下，开始了自己的修仙种田之路。",
  },
  "1-2": {
    title: "第二章 初试灵力",
    content: "回到家后，李青迫不及待地翻阅《仙农传承》。书中记载了许多奇特的种植方法和修炼功法，其中最基础的是"引灵入体"，可以吸收天地间的灵气，提升自身修为。\n\n按照书上的指导，李青盘腿而坐，调整呼吸，尝试感知周围的灵气。起初，他什么也没感觉到，但坚持了大约一个小时后，他开始隐约感觉到有微弱的能量围绕着自己流动。\n\n"这就是灵气吗？"李青心中暗想。他按照功法引导这些能量进入体内，顿时感到一股清凉之意流遍全身，疲劳一扫而空。\n\n第二天清晨，李青来到自家的菜园，决定试试自己的新能力。他将手掌贴在一株长势不佳的白菜上，尝试将一丝灵力输入其中。\n\n令他惊讶的是，那株白菜以肉眼可见的速度变得更加翠绿挺拔，叶片也更加厚实。这小小的成功让李青兴奋不已，他决定找一块隐蔽的地方，种下那颗神秘的种子。",
  },
};

// 章节编辑页面组件
export default function ChapterEditPage() {
  const params = useParams();
  const router = useRouter();
  const chapterId = params.id as string;
  
  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState<EditorContent>({
    title: "",
    content: "",
  });
  
  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  
  // 加载章节数据
  useEffect(() => {
    // 模拟API请求延迟
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        // 这里将来会调用API获取章节数据
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const chapter = mockChapters[chapterId];
        if (chapter) {
          setEditorContent(chapter);
        } else {
          console.error(`找不到章节: ${chapterId}`);
          // 如果找不到章节，可以重定向到章节列表
          // router.push('/chapters');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChapter();
  }, [chapterId, router]);
  
  // 保存章节
  const handleSave = async (content: EditorContent) => {
    // 这里将来会调用API保存章节
    console.log("保存章节:", chapterId, content);
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 更新本地数据
    mockChapters[chapterId] = content;
  };
  
  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
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
      
      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-sm text-muted-foreground">正在加载章节内容...</p>
          </div>
        </div>
      ) : (
        /* 编辑器 */
        <SimpleEditor
          initialContent={editorContent}
          onSave={handleSave}
          placeholder="开始编写您的章节内容..."
          autoFocus
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
    </div>
  );
}
```

**代码详解**：
1. 使用`"use client"`标记为客户端组件，因为需要管理状态和处理用户输入
2. 定义模拟章节数据
3. 创建`ChapterEditPage`组件，包含：
   - 页面标题和返回按钮
   - 加载状态显示
   - 编辑器组件
   - 底部操作按钮（返回章节列表、保存为草稿、发布章节）
4. 使用`useParams`钩子获取章节ID
5. 使用`useEffect`加载章节数据
6. 实现保存章节的处理函数

**执行目的**：
创建章节编辑页面，让用户能够：
1. 编辑章节标题和内容
2. 使用简单的编辑工具格式化文本
3. 自动保存编辑内容
4. 将章节保存为草稿或发布

这个页面是小说创作的核心工作区，提供了直观的编辑界面和必要的功能。

**替代方案**：
- **富文本编辑器**：使用如TinyMCE或CKEditor等成熟的富文本编辑器，但可能过于复杂且体积大
- **Markdown编辑器**：使用Markdown语法编辑，但学习曲线较高
- **分屏编辑器**：左侧编辑，右侧预览，但在移动设备上体验不佳
