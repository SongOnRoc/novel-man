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

## 第16步（补充）：添加专注模式和编辑器增强功能

为了完善编辑器功能，我们需要添加专注模式和其他编辑器增强功能，满足需求文档中的"专注模式（全屏写作界面，减少干扰元素）"和"快速导航（章节内定位、书签）"功能要求。

**执行命令**：
```
pnpm add @tiptap/react @tiptap/extension-underline @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-document @tiptap/extension-highlight
```

**执行目的**：
安装Tiptap编辑器及其扩展。我们选择这些包是因为：

1. **@tiptap/react**：Tiptap的React绑定，提供React组件和Hooks
2. **@tiptap/starter-kit**：包含基本功能的预配置包，如段落、标题、列表等
3. **@tiptap/extension-underline**：添加下划线功能
4. **@tiptap/extension-placeholder**：为编辑器添加占位符文本
5. **@tiptap/extension-text-align**：文本对齐功能
6. **@tiptap/extension-document**：自定义文档结构，用于章节内定位
7. **@tiptap/extension-highlight**：用于实现书签位置高亮显示

**替代方案**：
- **Draft.js**：Facebook开发的编辑器框架，但API不如Tiptap直观，且定制性较差
- **Quill**：轻量级编辑器，但扩展性不如Tiptap
- **CKEditor**：功能全面但较重，不适合轻量级应用
- **自定义ContentEditable**：开发成本高，需要处理很多边缘情况

**创建文件**：
首先，我们需要创建编辑器相关的类型定义：

```
mkdir -p src/types/editor
touch src/types/editor/index.ts
```

```typescript
// 编辑器内容类型
export interface EditorContent {
  title: string;
  content: string;
}

// 书签类型
export interface Bookmark {
  id: string;
  position: number; // 在文档中的位置（字符偏移量）
  label: string; // 书签标签
  createdAt: string; // 创建时间
}

// 编辑器主题类型
export type EditorTheme = 'default' | 'sepia' | 'dark' | 'minimal';

// 编辑器设置类型
export interface EditorSettings {
  theme: EditorTheme;
  fontSize: number;
  lineSpacing: number;
  showWordCount: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number; // 单位：秒
}

// 默认编辑器设置
export const defaultEditorSettings: EditorSettings = {
  theme: 'default',
  fontSize: 16,
  lineSpacing: 1.5,
  showWordCount: true,
  enableAutoSave: true,
  autoSaveInterval: 30,
};
```

接下来，我们需要创建书签管理相关的Hook和组件：

```
mkdir -p src/components/editor
mkdir -p src/hooks/editor
mkdir -p src/lib/editor
touch src/hooks/editor/useBookmarks.ts
touch src/lib/editor/BookmarkExtension.ts
touch src/components/editor/BookmarkManager.tsx
touch src/components/editor/EditorSettings.tsx
touch src/components/editor/FocusMode.tsx
touch src/components/editor/EditorToolbar.tsx
touch src/components/editor/TiptapEditor.tsx
```

**创建文件**：`src/lib/editor/BookmarkExtension.ts`

```typescript
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

// 创建自定义书签扩展
export const BookmarkExtension = Extension.create({
  name: 'bookmark',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('bookmark'),
        props: {
          // 在这里我们可以添加自定义的DOM处理器
          decorations: (state) => {
            // 这里可以添加书签的可视化表示
            // 但实际的书签管理将在外部进行
            return null;
          },
        },
      }),
    ];
  },
});
```

**创建文件**：`src/hooks/editor/useBookmarks.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { Bookmark } from '@/types/editor';
import { Editor } from '@tiptap/react';

// 书签管理Hook
export function useBookmarks(editor: Editor | null, chapterId: string) {
  // 书签列表
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  
  // 从本地存储加载书签
  useEffect(() => {
    if (!chapterId) return;
    
    try {
      const savedBookmarks = localStorage.getItem(`bookmarks-${chapterId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('加载书签失败:', error);
    }
  }, [chapterId]);
  
  // 保存书签到本地存储
  const saveBookmarksToStorage = useCallback((bookmarksList: Bookmark[]) => {
    if (!chapterId) return;
    
    try {
      localStorage.setItem(`bookmarks-${chapterId}`, JSON.stringify(bookmarksList));
    } catch (error) {
      console.error('保存书签失败:', error);
    }
  }, [chapterId]);
  
  // 添加书签
  const addBookmark = useCallback((label: string = '未命名书签') => {
    if (!editor) return;
    
    // 获取当前光标位置
    const { from } = editor.state.selection;
    
    // 创建新书签
    const newBookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      position: from,
      label,
      createdAt: new Date().toISOString(),
    };
    
    // 更新书签列表
    const updatedBookmarks = [...bookmarks, newBookmark];
    setBookmarks(updatedBookmarks);
    saveBookmarksToStorage(updatedBookmarks);
    
    // 可以在这里添加一个可视化指示器，比如高亮当前位置
    editor.commands.setTextSelection(from);
    
    return newBookmark;
  }, [editor, bookmarks, saveBookmarksToStorage]);
  
  // 删除书签
  const removeBookmark = useCallback((bookmarkId: string) => {
    const updatedBookmarks = bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    setBookmarks(updatedBookmarks);
    saveBookmarksToStorage(updatedBookmarks);
  }, [bookmarks, saveBookmarksToStorage]);
  
  // 更新书签标签
  const updateBookmarkLabel = useCallback((bookmarkId: string, newLabel: string) => {
    const updatedBookmarks = bookmarks.map(bookmark => 
      bookmark.id === bookmarkId ? { ...bookmark, label: newLabel } : bookmark
    );
    setBookmarks(updatedBookmarks);
    saveBookmarksToStorage(updatedBookmarks);
  }, [bookmarks, saveBookmarksToStorage]);
  
  // 跳转到书签位置
  const jumpToBookmark = useCallback((bookmarkId: string) => {
    if (!editor) return;
    
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;
    
    // 设置光标位置并滚动到视图
    editor.commands.setTextSelection(bookmark.position);
    
    // 使用DOM API滚动到选中位置
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.startContainer.parentElement?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 0);
    
    // 临时高亮当前位置
    const bookmarkClass = 'bookmark-highlight';
    editor.commands.setMark('highlight');
    
    // 2秒后移除高亮
    setTimeout(() => {
      editor.commands.unsetMark('highlight');
    }, 2000);
  }, [editor, bookmarks]);
  
  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkLabel,
    jumpToBookmark
  };
}
```

**创建文件**：`src/components/editor/FocusMode.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface FocusModeProps {
  editorContainerId: string;
}

export function FocusMode({ editorContainerId }: FocusModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 切换全屏模式
  const toggleFullscreen = () => {
    const editorContainer = document.getElementById(editorContainerId);
    if (!editorContainer) return;

    if (!isFullscreen) {
      // 进入全屏模式
      if (editorContainer.requestFullscreen) {
        editorContainer.requestFullscreen();
      }
    } else {
      // 退出全屏模式
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFullscreen}
      className="gap-1"
      title={isFullscreen ? '退出专注模式' : '进入专注模式'}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">退出专注模式</span>
        </>
      ) : (
        <>
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">专注模式</span>
        </>
      )}
    </Button>
  );
}
```

**创建文件**：`src/components/editor/BookmarkManager.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Bookmark, Edit, Trash2, BookmarkPlus } from 'lucide-react';
import { Bookmark as BookmarkType } from '@/types/editor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Editor } from '@tiptap/react';

interface BookmarkManagerProps {
  editor: Editor | null;
  bookmarks: BookmarkType[];
  addBookmark: (label?: string) => void;
  removeBookmark: (id: string) => void;
  updateBookmarkLabel: (id: string, label: string) => void;
  jumpToBookmark: (id: string) => void;
}

export function BookmarkManager({
  editor,
  bookmarks,
  addBookmark,
  removeBookmark,
  updateBookmarkLabel,
  jumpToBookmark,
}: BookmarkManagerProps) {
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  
  // 处理添加书签
  const handleAddBookmark = () => {
    if (!editor) return;
    
    const label = newBookmarkLabel.trim() || '未命名书签';
    addBookmark(label);
    setNewBookmarkLabel('');
  };
  
  // 开始编辑书签
  const startEditing = (bookmark: BookmarkType) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
  };
  
  // 保存书签编辑
  const saveEditing = () => {
    if (editingId && editLabel.trim()) {
      updateBookmarkLabel(editingId, editLabel.trim());
    }
    setEditingId(null);
  };
  
  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          书签管理
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>书签管理</DrawerTitle>
            <DrawerDescription>
              在章节中添加书签，方便快速导航和定位
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {/* 添加新书签 */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="输入书签名称"
                value={newBookmarkLabel}
                onChange={(e) => setNewBookmarkLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddBookmark();
                  }
                }}
              />
              <Button onClick={handleAddBookmark}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                添加
              </Button>
            </div>
            
            {/* 书签列表 */}
            <ScrollArea className="h-[300px] pr-4">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无书签，请添加新书签
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      {editingId === bookmark.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditing();
                              if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <Button size="sm" onClick={saveEditing}>保存</Button>
                          <Button size="sm" variant="ghost" onClick={cancelEditing}>取消</Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start font-normal"
                            onClick={() => jumpToBookmark(bookmark.id)}
                          >
                            <Bookmark className="h-4 w-4 mr-2" />
                            {bookmark.label}
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(bookmark)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeBookmark(bookmark.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

**创建文件**：`src/components/editor/EditorSettings.tsx`

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Settings2 } from 'lucide-react';
import { EditorSettings as EditorSettingsType, EditorTheme, defaultEditorSettings } from '@/types/editor';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface EditorSettingsProps {
  settings: EditorSettingsType;
  onSettingsChange: (settings: EditorSettingsType) => void;
}

export function EditorSettings({ settings, onSettingsChange }: EditorSettingsProps) {
  const [localSettings, setLocalSettings] = useState<EditorSettingsType>(settings);
  
  // 应用设置
  const applySettings = () => {
    onSettingsChange(localSettings);
  };
  
  // 重置为默认设置
  const resetToDefaults = () => {
    setLocalSettings(defaultEditorSettings);
  };
  
  // 更新单个设置项
  const updateSetting = <K extends keyof EditorSettingsType>(
    key: K,
    value: EditorSettingsType[K]
  ) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          编辑器设置
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>编辑器设置</DrawerTitle>
            <DrawerDescription>
              自定义编辑器外观和行为
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-6">
            {/* 主题设置 */}
            <div className="space-y-2">
              <Label>编辑器主题</Label>
              <RadioGroup
                value={localSettings.theme}
                onValueChange={(value) => updateSetting('theme', value as EditorTheme)}
                className="flex flex-wrap gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="theme-default" />
                  <Label htmlFor="theme-default">默认</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sepia" id="theme-sepia" />
                  <Label htmlFor="theme-sepia">护眼</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">暗色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="theme-minimal" />
                  <Label htmlFor="theme-minimal">简约</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* 字体大小设置 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>字体大小</Label>
                <span>{localSettings.fontSize}px</span>
              </div>
              <Slider
                value={[localSettings.fontSize]}
                min={12}
                max={24}
                step={1}
                onValueChange={(value) => updateSetting('fontSize', value[0])}
              />
            </div>
            
            {/* 行间距设置 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>行间距</Label>
                <span>{localSettings.lineSpacing}</span>
              </div>
              <Slider
                value={[localSettings.lineSpacing * 10]}
                min={10}
                max={30}
                step={1}
                onValueChange={(value) => updateSetting('lineSpacing', value[0] / 10)}
              />
            </div>
            
            {/* 显示字数统计 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-word-count">显示字数统计</Label>
              <Switch
                id="show-word-count"
                checked={localSettings.showWordCount}
                onCheckedChange={(checked) => updateSetting('showWordCount', checked)}
              />
            </div>
            
            {/* 自动保存设置 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-autosave">启用自动保存</Label>
                <Switch
                  id="enable-autosave"
                  checked={localSettings.enableAutoSave}
                  onCheckedChange={(checked) => updateSetting('enableAutoSave', checked)}
                />
              </div>
              
              {localSettings.enableAutoSave && (
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <Label>自动保存间隔</Label>
                    <span>{localSettings.autoSaveInterval}秒</span>
                  </div>
                  <Slider
                    value={[localSettings.autoSaveInterval]}
                    min={5}
                    max={300}
                    step={5}
                    onValueChange={(value) => updateSetting('autoSaveInterval', value[0])}
                  />
                </div>
              )}
            </div>
          </div>
          
          <DrawerFooter className="flex-row justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              恢复默认
            </Button>
            <div className="space-x-2">
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
              <Button onClick={applySettings}>应用设置</Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

**创建文件**：`src/components/editor/EditorToolbar.tsx`

```tsx
'use client';

import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo,
  Redo,
  Save,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { BookmarkManager } from './BookmarkManager';
import { EditorSettings } from './EditorSettings';
import { FocusMode } from './FocusMode';
import { useBookmarks } from '@/hooks/editor/useBookmarks';
import { EditorSettings as EditorSettingsType, defaultEditorSettings } from '@/types/editor';
import { useState, useEffect } from 'react';

interface EditorToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
  isSaving?: boolean;
  wordCount?: number;
  chapterId?: string;
  editorContainerId: string;
}

export function EditorToolbar({
  editor,
  onSave,
  isSaving = false,
  wordCount = 0,
  chapterId = 'temp',
  editorContainerId,
}: EditorToolbarProps) {
  // 编辑器设置
  const [settings, setSettings] = useState<EditorSettingsType>(() => {
    // 尝试从本地存储加载设置
    try {
      const savedSettings = localStorage.getItem('editor-settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings;
    } catch (error) {
      console.error('加载编辑器设置失败:', error);
      return defaultEditorSettings;
    }
  });
  
  // 使用书签Hook
  const {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkLabel,
    jumpToBookmark,
  } = useBookmarks(editor, chapterId);
  
  // 应用编辑器设置
  useEffect(() => {
    if (!editor) return;
    
    // 应用字体大小和行间距
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--editor-line-height', `${settings.lineSpacing}`);
    
    // 应用主题
    const editorElement = document.querySelector('.ProseMirror');
    if (editorElement) {
      // 移除所有主题类
      editorElement.classList.remove('theme-default', 'theme-sepia', 'theme-dark', 'theme-minimal');
      // 添加当前主题类
      editorElement.classList.add(`theme-${settings.theme}`);
    }
    
    // 保存设置到本地存储
    localStorage.setItem('editor-settings', JSON.stringify(settings));
  }, [editor, settings]);
  
  // 如果没有编辑器实例，不渲染工具栏
  if (!editor) {
    return null;
  }
  
  return (
    <div className="border-b p-1 sticky top-0 bg-background z-10">
      <div className="flex flex-wrap items-center gap-1">
        {/* 格式控制 */}
        <div className="flex items-center">
          <Toggle
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="加粗"
            size="sm"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="斜体"
            size="sm"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="下划线"
            size="sm"
          >
            <Underline className="h-4 w-4" />
          </Toggle>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* 对齐方式 */}
        <div className="flex items-center">
          <Toggle
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="左对齐"
            size="sm"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="居中对齐"
            size="sm"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="右对齐"
            size="sm"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: 'justify' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('justify').run()}
            aria-label="两端对齐"
            size="sm"
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* 标题 */}
        <div className="flex items-center">
          <Toggle
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            aria-label="一级标题"
            size="sm"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="二级标题"
            size="sm"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('heading', { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            aria-label="三级标题"
            size="sm"
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* 列表 */}
        <div className="flex items-center">
          <Toggle
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="无序列表"
            size="sm"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="有序列表"
            size="sm"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>
        
        <Separator orientation="vertical" className="mx-1 h-6" />
        
        {/* 撤销/重做 */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="撤销"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="重做"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1" />
        
        {/* 章节内查找按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (editor) {
              // 使用浏览器的查找功能
              if (document.execCommand('find')) {
                document.execCommand('find');
              } else {
                // 如果浏览器不支持execCommand，提示用户使用Ctrl+F
                alert('请使用键盘快捷键 Ctrl+F 进行查找');
              }
            }
          }}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          查找
        </Button>
        
        {/* 专注模式按钮 */}
        <FocusMode editorContainerId={editorContainerId} />
        
        {/* 书签管理按钮 */}
        <BookmarkManager
          editor={editor}
          bookmarks={bookmarks}
          addBookmark={addBookmark}
          removeBookmark={removeBookmark}
          updateBookmarkLabel={updateBookmarkLabel}
          jumpToBookmark={jumpToBookmark}
        />
        
        {/* 编辑器设置 */}
        <EditorSettings
          settings={settings}
          onSettingsChange={setSettings}
        />
        
        {/* 保存按钮 */}
        {onSave && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? '保存中...' : '保存'}
          </Button>
        )}
        
        {/* 字数统计 */}
        {settings.showWordCount && (
          <div className="text-xs text-muted-foreground px-2">
            {wordCount} 字
          </div>
        )}
      </div>
    </div>
  );
}
```

**创建文件**：`src/components/editor/TiptapEditor.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Document from '@tiptap/extension-document';
import Highlight from '@tiptap/extension-highlight';
import { EditorToolbar } from './EditorToolbar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EditorContent as EditorContentType, EditorSettings, defaultEditorSettings } from '@/types/editor';
import { BookmarkExtension } from '@/lib/editor/BookmarkExtension';

// Tiptap编辑器属性
interface TiptapEditorProps {
  initialContent?: EditorContentType; // 初始内容
  onSave?: (content: EditorContentType) => void; // 保存回调
  placeholder?: string; // 占位文本
  autoFocus?: boolean; // 是否自动聚焦
  chapterId?: string; // 章节ID，用于书签管理
  containerId?: string; // 容器ID，用于专注模式
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

// 自定义Document扩展，支持章节内定位
const CustomDocument = Document.extend({
  addKeyboardShortcuts() {
    return {
      // 添加快捷键，Ctrl+G跳转到指定行
      'Mod-g': () => {
        const line = prompt('请输入要跳转的行号:');
        if (line) {
          const lineNumber = parseInt(line, 10);
          if (!isNaN(lineNumber) && lineNumber > 0) {
            this.editor.commands.focus();
            
            // 获取文档的所有段落
            const paragraphs = this.editor.state.doc.content.content;
            
            // 如果行号超出范围，跳转到最后一行
            const targetLine = Math.min(lineNumber - 1, paragraphs.length - 1);
            
            if (targetLine >= 0) {
              // 获取目标段落的位置
              let pos = 0;
              for (let i = 0; i < targetLine; i++) {
                pos += paragraphs[i].nodeSize;
              }
              
              // 设置光标位置
              this.editor.commands.setTextSelection(pos + 1);
              
              // 滚动到视图
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.startContainer.parentElement?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
              }
              
              return true;
            }
          }
        }
        return false;
      },
    };
  },
});

// Tiptap编辑器组件
export function TiptapEditor({
  initialContent = { title: '', content: '' },
  onSave,
  placeholder = '开始您的创作...',
  autoFocus = false,
  chapterId = 'temp',
  containerId = 'editor-container',
}: TiptapEditorProps) {
  // 标题状态
  const [title, setTitle] = useState(initialContent.title);
  // 保存状态
  const [isSaving, setIsSaving] = useState(false);
  // 字数状态
  const [wordCount, setWordCount] = useState(0);
  // 编辑器设置
  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('editor-settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings;
    } catch (error) {
      console.error('加载编辑器设置失败:', error);
      return defaultEditorSettings;
    }
  });

  // 初始化编辑器
  const editor = useEditor({
    extensions: [
      CustomDocument,
      StarterKit.configure({
        document: false, // 使用我们的自定义Document扩展
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      BookmarkExtension,
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
    if (!editor) return { title, content: '' };
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

  // 自动保存（根据设置的间隔）
  useEffect(() => {
    if (!editor || !onSave || !settings.enableAutoSave) return;

    const autoSaveInterval = setInterval(() => {
      const content = getCurrentContent();
      if (content.title || content.content !== '<p></p>') {
        console.log('自动保存...');
        onSave(content);
      }
    }, settings.autoSaveInterval * 1000);

    return () => clearInterval(autoSaveInterval);
  }, [editor, getCurrentContent, onSave, settings.enableAutoSave, settings.autoSaveInterval]);

  // 初始化字数统计
  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getHTML()));
    }
  }, [editor]);

  // 应用编辑器设置的CSS变量
  useEffect(() => {
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
    document.documentElement.style.setProperty('--editor-line-height', `${settings.lineSpacing}`);
  }, [settings]);

  return (
    <div id={containerId} className="flex flex-col border rounded-md shadow-sm">
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
        chapterId={chapterId}
        editorContainerId={containerId}
      />

      {/* 内容编辑区 */}
      <div className={`prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px] theme-${settings.theme}`}>
        <EditorContent editor={editor} className="min-h-[300px] outline-none" />
      </div>

      {/* 编辑器样式 */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 300px;
          outline: none;
          font-size: var(--editor-font-size, 16px);
          line-height: var(--editor-line-height, 1.5);
        }
        
        /* 主题样式 */
        .theme-default {
          background-color: white;
          color: #333;
        }
        
        .theme-sepia {
          background-color: #f4f1ea;
          color: #5f4b32;
        }
        
        .theme-dark {
          background-color: #222;
          color: #eee;
        }
        
        .theme-minimal {
          background-color: white;
          color: #333;
          font-family: monospace;
        }
        
        /* 书签高亮样式 */
        .ProseMirror mark {
          background-color: rgba(255, 220, 0, 0.4);
          border-bottom: 2px solid #ffdc00;
          padding: 2px 0;
        }
        
        /* 专注模式样式 */
        #${containerId}:fullscreen {
          background-color: var(--background);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }
        
        #${containerId}:fullscreen .ProseMirror {
          flex: 1;
          max-width: 65ch;
          margin: 0 auto;
          width: 100%;
        }
        
        /* 在专注模式下隐藏某些元素 */
        #${containerId}:fullscreen .hide-in-focus-mode {
          display: none;
        }
      `}</style>
    </div>
  );
}
```

**更新文件**：`src/app/(main)/chapters/[id]/edit/page.tsx`

```tsx
// 在TiptapEditor组件中添加containerId属性
<TiptapEditor
  initialContent={editorContent}
  onSave={handleSave}
  placeholder="开始编写您的章节内容..."
  autoFocus
  chapterId={chapterId}
  containerId={`editor-${chapterId}`} // 使用唯一的容器ID
/>

// 在底部添加键盘快捷键提示
<div className="text-xs text-muted-foreground">
  <p>提示：按下 Ctrl+G 可以跳转到指定行；使用书签管理器可以在重要位置添加书签。</p>
</div>
```

**执行目的**：
通过上述代码，我们实现了以下功能：

1. **书签管理功能**：
   - 在编辑器中添加、编辑和删除书签
   - 使用书签快速导航到文档中的特定位置
   - 书签数据保存在本地存储中，与特定章节关联

2. **章节内定位功能**：
   - 通过Ctrl+G快捷键跳转到指定行
   - 通过自定义Document扩展实现精确定位
   - 添加章节内查找功能，便于搜索特定内容

3. **编辑器主题选择**：
   - 提供默认、护眼、暗色和简约四种主题
   - 主题设置保存在本地存储中，下次打开自动应用

4. **专注模式**：
   - 提供全屏写作界面，减少干扰元素
   - 优化全屏模式下的编辑器布局
   - 简单的切换按钮，方便进入和退出专注模式

5. **编辑器个性化设置**：
   - 可调整字体大小和行间距
   - 可配置是否显示字数统计
   - 可自定义自动保存行为和间隔

这些功能极大地提升了编辑器的可用性，使作家能够更高效地管理和导航长篇章节内容，符合需求文档中提到的"快速导航（章节内定位、书签）"和"专注模式UI"功能要求。

**替代方案**：
- **使用第三方编辑器**：如Slate.js或Lexical，但集成成本高，且可能不如Tiptap灵活
- **使用原生HTML编辑器**：功能有限，难以实现高级功能
- **使用Markdown编辑器**：虽然简单，但对非技术用户不友好
- **使用iframe嵌入Google Docs**：依赖第三方服务，可能有网络和权限问题

理解了吗？
