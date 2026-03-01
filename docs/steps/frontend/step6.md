## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能

## 第6步：修改全局CSS文件

接下来，我们需要修改全局CSS文件，设置基础样式和主题颜色。对于小说管理系统，合适的颜色方案和排版样式对用户体验至关重要，尤其是在长时间阅读和写作的场景中。

**修改文件**：`src/app/globals.css`
```css
/* 导入Tailwind CSS和动画库 */
@import "tailwindcss";
@import "tw-animate-css";

/* 定义深色模式的自定义变体 */
@custom-variant dark (&:is(.dark *));

/* 定义主题变量映射，这些变量会被内联到CSS中 */
@theme inline {
  /* 基础背景和前景色映射 */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  
  /* 字体族映射，使用之前在layout.tsx中定义的字体变量 */
  --font-sans: var(--font-inter), var(--font-noto-sans-sc), system-ui, sans-serif;
  --font-mono: var(--font-inter), var(--font-noto-sans-sc), monospace;
  
  /* 侧边栏相关颜色映射 */
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  
  /* 图表颜色映射，用于数据可视化 */
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  
  /* UI元素颜色映射 */
  --color-ring: var(--ring);           /* 聚焦轮廓颜色 */
  --color-input: var(--input);         /* 输入框边框颜色 */
  --color-border: var(--border);       /* 边框颜色 */
  --color-destructive: var(--destructive); /* 危险操作颜色 */
  
  /* 强调和次要颜色映射 */
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  
  /* 弹出框和卡片颜色映射 */
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  
  /* 圆角大小映射，提供不同尺寸的圆角 */
  --radius-sm: calc(var(--radius) - 4px);  /* 小圆角 */
  --radius-md: calc(var(--radius) - 2px);  /* 中圆角 */
  --radius-lg: var(--radius);              /* 大圆角 */
  --radius-xl: calc(var(--radius) + 4px);  /* 特大圆角 */
  
  /* 小说管理系统特定变量映射 */
  --color-editor-bg: var(--editor-bg);             /* 编辑器背景色 */
  --color-editor-text: var(--editor-text);         /* 编辑器文本色 */
  --color-editor-border: var(--editor-border);     /* 编辑器边框色 */
  --color-editor-toolbar: var(--editor-toolbar);   /* 编辑器工具栏背景色 */
  --color-editor-toolbar-text: var(--editor-toolbar-text); /* 编辑器工具栏文本色 */
  --color-editor-selection: var(--editor-selection); /* 编辑器文本选择色 */
  --color-editor-placeholder: var(--editor-placeholder); /* 编辑器占位符文本色 */
}

/* 浅色模式（默认）变量定义 */
:root {
  /* 基础UI设置 */
  --radius: 0.625rem;  /* 默认圆角大小 */
  
  /* 卡片颜色 - 用于内容块 */
  --card: oklch(1 0 0);  /* 纯白色背景 */
  --card-foreground: oklch(0.141 0.005 285.823);  /* 深色文本 */
  
  /* 弹出框颜色 - 用于对话框、下拉菜单等 */
  --popover: oklch(1 0 0);  /* 纯白色背景 */
  --popover-foreground: oklch(0.141 0.005 285.823);  /* 深色文本 */
  
  /* 主要颜色 - 用于强调和主要按钮 */
  --primary: oklch(0.21 0.006 285.885);  /* 深蓝色 */
  --primary-foreground: oklch(0.985 0 0);  /* 几乎白色文本 */
  
  /* 次要颜色 - 用于次要按钮和元素 */
  --secondary: oklch(0.967 0.001 286.375);  /* 非常浅的灰色 */
  --secondary-foreground: oklch(0.21 0.006 285.885);  /* 深色文本 */
  
  /* 柔和颜色 - 用于不太重要的元素 */
  --muted: oklch(0.967 0.001 286.375);  /* 与次要颜色相同的浅灰色 */
  --muted-foreground: oklch(0.552 0.016 285.938);  /* 中等灰色文本 */
  
  /* 强调颜色 - 用于高亮元素 */
  --accent: oklch(0.967 0.001 286.375);  /* 与次要颜色相同的浅灰色 */
  --accent-foreground: oklch(0.21 0.006 285.885);  /* 深色文本 */
  
  /* 危险操作颜色 - 用于删除按钮等 */
  --destructive: oklch(0.577 0.245 27.325);  /* 红色 */
  
  /* 边框和输入框颜色 */
  --border: oklch(0.92 0.004 286.32);  /* 浅灰色边框 */
  --input: oklch(0.92 0.004 286.32);  /* 与边框相同的浅灰色 */
  --ring: oklch(0.705 0.015 286.067);  /* 聚焦时的轮廓颜色 */
  
  /* 图表颜色 - 用于数据可视化 */
  --chart-1: oklch(0.646 0.222 41.116);  /* 橙色 */
  --chart-2: oklch(0.6 0.118 184.704);   /* 青色 */
  --chart-3: oklch(0.398 0.07 227.392);  /* 蓝色 */
  --chart-4: oklch(0.828 0.189 84.429);  /* 黄色 */
  --chart-5: oklch(0.769 0.188 70.08);   /* 金色 */
  
  /* 侧边栏颜色 */
  --sidebar: oklch(0.985 0 0);  /* 几乎白色背景 */
  --sidebar-foreground: oklch(0.141 0.005 285.823);  /* 深色文本 */
  --sidebar-primary: oklch(0.21 0.006 285.885);  /* 深蓝色 */
  --sidebar-primary-foreground: oklch(0.985 0 0);  /* 几乎白色文本 */
  --sidebar-accent: oklch(0.967 0.001 286.375);  /* 浅灰色 */
  --sidebar-accent-foreground: oklch(0.21 0.006 285.885);  /* 深色文本 */
  --sidebar-border: oklch(0.92 0.004 286.32);  /* 浅灰色边框 */
  --sidebar-ring: oklch(0.705 0.015 286.067);  /* 聚焦时的轮廓颜色 */
  
  /* 全局背景和前景色 */
  --background: oklch(1 0 0);  /* 纯白色背景 */
  --foreground: oklch(0.141 0.005 285.823);  /* 深色文本 */
  
  /* 小说编辑器相关变量 - 浅色模式 */
  --editor-bg: oklch(0.995 0 0);  /* 略微灰白的背景，比纯白柔和 */
  --editor-text: oklch(0.141 0.005 285.823);  /* 深色文本，易于阅读 */
  --editor-border: oklch(0.92 0.004 286.32);  /* 浅灰色边框 */
  --editor-toolbar: oklch(0.967 0.001 286.375);  /* 浅灰色工具栏背景 */
  --editor-toolbar-text: oklch(0.21 0.006 285.885);  /* 深色工具栏文本 */
  --editor-selection: oklch(0.705 0.015 286.067 / 30%);  /* 半透明的选择背景 */
  --editor-placeholder: oklch(0.552 0.016 285.938);  /* 中等灰色占位符文本 */
}

/* 深色模式变量定义 */
.dark {
  /* 全局背景和前景色 - 深色模式 */
  --background: oklch(0.141 0.005 285.823);  /* 深色背景 */
  --foreground: oklch(0.985 0 0);  /* 浅色文本 */
  
  /* 卡片颜色 - 深色模式 */
  --card: oklch(0.21 0.006 285.885);  /* 比背景稍浅的深色 */
  --card-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  
  /* 弹出框颜色 - 深色模式 */
  --popover: oklch(0.21 0.006 285.885);  /* 与卡片相同的深色 */
  --popover-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  
  /* 主要颜色 - 深色模式 */
  --primary: oklch(0.92 0.004 286.32);  /* 浅色主色调 */
  --primary-foreground: oklch(0.21 0.006 285.885);  /* 深色文本 */
  
  /* 次要颜色 - 深色模式 */
  --secondary: oklch(0.274 0.006 286.033);  /* 深灰色 */
  --secondary-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  
  /* 柔和颜色 - 深色模式 */
  --muted: oklch(0.274 0.006 286.033);  /* 与次要颜色相同的深灰色 */
  --muted-foreground: oklch(0.705 0.015 286.067);  /* 中等亮度的灰色文本 */
  
  /* 强调颜色 - 深色模式 */
  --accent: oklch(0.274 0.006 286.033);  /* 与次要颜色相同的深灰色 */
  --accent-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  
  /* 危险操作颜色 - 深色模式 */
  --destructive: oklch(0.704 0.191 22.216);  /* 更亮的红色 */
  
  /* 边框和输入框颜色 - 深色模式 */
  --border: oklch(1 0 0 / 10%);  /* 半透明白色边框 */
  --input: oklch(1 0 0 / 15%);  /* 稍微不透明的白色输入框 */
  --ring: oklch(0.552 0.016 285.938);  /* 聚焦时的轮廓颜色 */
  
  /* 图表颜色 - 深色模式 */
  --chart-1: oklch(0.488 0.243 264.376);  /* 紫色 */
  --chart-2: oklch(0.696 0.17 162.48);    /* 青绿色 */
  --chart-3: oklch(0.769 0.188 70.08);    /* 金色 */
  --chart-4: oklch(0.627 0.265 303.9);    /* 品红色 */
  --chart-5: oklch(0.645 0.246 16.439);   /* 橙红色 */
  
  /* 侧边栏颜色 - 深色模式 */
  --sidebar: oklch(0.21 0.006 285.885);  /* 深色背景 */
  --sidebar-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  --sidebar-primary: oklch(0.488 0.243 264.376);  /* 紫色主色调 */
  --sidebar-primary-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  --sidebar-accent: oklch(0.274 0.006 286.033);  /* 深灰色强调 */
  --sidebar-accent-foreground: oklch(0.985 0 0);  /* 浅色文本 */
  --sidebar-border: oklch(1 0 0 / 10%);  /* 半透明白色边框 */
  --sidebar-ring: oklch(0.552 0.016 285.938);  /* 聚焦时的轮廓颜色 */
  
  /* 小说编辑器相关变量 - 深色模式 */
  --editor-bg: oklch(0.18 0.005 285.823);  /* 比普通背景稍亮的深色，减少眼睛疲劳 */
  --editor-text: oklch(0.985 0 0);  /* 浅色文本，在深色背景上易读 */
  --editor-border: oklch(1 0 0 / 15%);  /* 半透明白色边框 */
  --editor-toolbar: oklch(0.21 0.006 285.885);  /* 深色工具栏背景 */
  --editor-toolbar-text: oklch(0.985 0 0);  /* 浅色工具栏文本 */
  --editor-selection: oklch(0.488 0.243 264.376 / 30%);  /* 半透明紫色选择背景 */
  --editor-placeholder: oklch(0.705 0.015 286.067);  /* 中等亮度的灰色占位符文本 */
}

/* 基础样式层 */
@layer base {
  * {
    /* 为所有元素应用统一的边框颜色和轮廓样式 */
    @apply border-border outline-ring/50;
  }
  body {
    /* 为body元素应用背景色和文本颜色 */
    @apply bg-background text-foreground;
  }
}

/* 隐藏滚动条但保留滚动功能 - 提供更干净的界面 */
.hide-scrollbar::-webkit-scrollbar {
  display: none;  /* 对WebKit浏览器（Chrome、Safari）隐藏滚动条 */
}

.hide-scrollbar {
  -ms-overflow-style: none;  /* 对IE和Edge隐藏滚动条 */
  scrollbar-width: none;     /* 对Firefox隐藏滚动条 */
}

/* 小说编辑器相关样式 */
.novel-editor {
  /* 编辑器主体样式 */
  @apply rounded-md border border-editor-border bg-editor-bg text-editor-text p-4 min-h-[300px] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors;
  /* 
    rounded-md: 中等圆角
    border: 添加边框
    border-editor-border: 使用编辑器边框颜色
    bg-editor-bg: 使用编辑器背景色
    text-editor-text: 使用编辑器文本色
    p-4: 内边距（padding）为4个单位
    min-h-[300px]: 最小高度300像素
    focus:outline-none: 聚焦时移除默认轮廓
    focus:ring-2: 聚焦时添加2像素宽的轮廓环
    focus:ring-ring: 聚焦时使用定义的轮廓环颜色
    focus:border-transparent: 聚焦时边框透明
    transition-colors: 颜色变化时添加过渡效果
  */
}

.novel-editor-toolbar {
  /* 编辑器工具栏样式 */
  @apply flex items-center gap-2 p-2 bg-editor-toolbar text-editor-toolbar-text rounded-t-md border border-editor-border border-b-0;
  /* 
    flex: 使用弹性布局
    items-center: 垂直居中对齐项目
    gap-2: 项目间间隔为2个单位
    p-2: 内边距为2个单位
    bg-editor-toolbar: 使用编辑器工具栏背景色
    text-editor-toolbar-text: 使用编辑器工具栏文本色
    rounded-t-md: 顶部中等圆角
    border: 添加边框
    border-editor-border: 使用编辑器边框颜色
    border-b-0: 移除底部边框
  */
}

.novel-editor ::selection {
  /* 编辑器中文本选择样式 */
  @apply bg-editor-selection;
  /* 
    bg-editor-selection: 使用编辑器选择背景色
  */
}

.novel-editor-placeholder {
  /* 编辑器占位符样式 */
  @apply text-editor-placeholder italic;
  /* 
    text-editor-placeholder: 使用编辑器占位符文本色
    italic: 斜体显示
  */
}

/* 章节列表样式 */
.chapter-list {
  /* 章节列表容器样式 */
  @apply space-y-2 my-4;
  /* 
    space-y-2: 子元素垂直间距为2个单位
    my-4: 上下外边距（margin）为4个单位
  */
}

.chapter-item {
  /* 章节项样式 */
  @apply flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors cursor-pointer;
  /* 
    flex: 使用弹性布局
    items-center: 垂直居中对齐
    justify-between: 水平两端对齐
    p-3: 内边距为3个单位
    rounded-md: 中等圆角
    border: 添加边框
    border-border: 使用定义的边框颜色
    hover:bg-muted/50: 悬停时背景色为柔和色的50%透明度
    transition-colors: 颜色变化时添加过渡效果
    cursor-pointer: 鼠标指针样式为手型
  */
}

.chapter-item.active {
  /* 当前选中章节样式 */
  @apply bg-primary/10 border-primary;
  /* 
    bg-primary/10: 背景色为主色调的10%透明度
    border-primary: 边框颜色为主色调
  */
}

/* 草稿样式 */
.draft-badge {
  /* 草稿标签样式 */
  @apply inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80;
  /* 
    inline-flex: 内联弹性布局
    items-center: 垂直居中对齐
    rounded-full: 完全圆角（胶囊形状）
    border: 添加边框
    px-2.5: 水平内边距为2.5个单位
    py-0.5: 垂直内边距为0.5个单位
    text-xs: 超小文本大小
    font-semibold: 半粗体字重
    transition-colors: 颜色变化时添加过渡效果
    focus:outline-none: 聚焦时移除默认轮廓
    focus:ring-2: 聚焦时添加2像素宽的轮廓环
    focus:ring-ring: 聚焦时使用定义的轮廓环颜色
    focus:ring-offset-2: 聚焦时轮廓环偏移2像素
    border-transparent: 透明边框
    bg-secondary: 背景色为次要色
    text-secondary-foreground: 文本颜色为次要前景色
    hover:bg-secondary/80: 悬停时背景色为次要色的80%透明度
  */
}
```

**代码解释**：

1. **保留原有结构**：
   - 保留了`@import`指令、`@custom-variant`、`@theme inline`等原有结构
   - 保留了OKLCH颜色格式和变量映射方式

2. **添加小说管理系统特定变量**：
   - 添加了编辑器相关的颜色变量：背景、文本、边框、工具栏、选择区域、占位符等
   - 这些变量在浅色和深色模式下都有对应的值

3. **添加滚动条隐藏样式**：
   - 添加了`.hide-scrollbar`类来隐藏滚动条但保留功能
   - 这对于提供干净的阅读界面很有帮助

4. **添加小说编辑器相关样式**：
   - `.novel-editor`：编辑器主体样式
   - `.novel-editor-toolbar`：编辑器工具栏样式
   - `.novel-editor ::selection`：文本选择样式
   - `.novel-editor-placeholder`：占位符样式

5. **添加章节列表样式**：
   - `.chapter-list`：章节列表容器样式
   - `.chapter-item`：章节项样式
   - `.chapter-item.active`：当前选中章节样式

6. **添加草稿样式**：
   - `.draft-badge`：草稿标签样式，用于标识草稿状态

这些修改保持了当前项目的风格和结构，同时添加了小说管理系统所需的特定样式和变量。编辑器和章节管理是小说系统的核心功能，因此我们为这些组件添加了专门的样式定义。
