"use client";

import { Editor } from "@tiptap/react";
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
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { BookmarkManager } from "./BookmarkManager";
import { EditorSettings } from "./EditorSettings";
import { FocusMode } from "./FocusMode";
import { useBookmarks } from "@/hooks/editor/useBookmarks";
import {
  EditorSettings as EditorSettingsType,
  defaultEditorSettings,
} from "@/types/editor";
import { useState, useEffect } from "react";
import { FindReplace } from "./FindReplace";
import { SettingsLookup } from "@/components/common/lookup/SettingsLookup";
import { Progress } from "@/components/ui/progress";
import { ValueSettingPopover } from "@/components/common/ValueSettingPopover";

interface EditorToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
  isSaving?: boolean;
  wordCount?: number;
  contentId?: string;
  workId?: string;
  editorContainerId: string;
  targetCount?: number;
  onTargetCountChange?: (newTarget: number) => void;
}

export function EditorToolbar({
  editor,
  onSave,
  isSaving = false,
  wordCount = 0,
  contentId = "temp",
  workId,
  editorContainerId,
  targetCount = 0,
  onTargetCountChange,
}: EditorToolbarProps) {
  // 编辑器设置
  const [settings, setSettings] = useState<EditorSettingsType>(() => {
    // 尝试从本地存储加载设置
    try {
      const savedSettings = localStorage.getItem("editor-settings");
      return savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings;
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
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
  } = useBookmarks(editor, contentId);

  // 应用编辑器设置
  useEffect(() => {
    if (!editor) return;

    // 应用字体大小和行间距
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${settings.fontSize}px`
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      `${settings.lineSpacing}`
    );

    // 应用主题
    const editorElement = document.querySelector(".ProseMirror");
    if (editorElement) {
      // 移除所有主题类
      editorElement.classList.remove(
        "theme-default",
        "theme-sepia",
        "theme-dark",
        "theme-minimal"
      );
      // 添加当前主题类
      editorElement.classList.add(`theme-${settings.theme}`);
    }

    // 保存设置到本地存储
    localStorage.setItem("editor-settings", JSON.stringify(settings));
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
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="加粗"
            size="sm"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="斜体"
            size="sm"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("underline")}
            onPressedChange={() =>
              editor.chain().focus().toggleUnderline().run()
            }
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
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("left").run()
            }
            aria-label="左对齐"
            size="sm"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("center").run()
            }
            aria-label="居中对齐"
            size="sm"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("right").run()
            }
            aria-label="右对齐"
            size="sm"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() =>
              editor.chain().focus().setTextAlign("justify").run()
            }
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
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="一级标题"
            size="sm"
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="二级标题"
            size="sm"
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
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
            pressed={editor.isActive("bulletList")}
            onPressedChange={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            aria-label="无序列表"
            size="sm"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={editor.isActive("orderedList")}
            onPressedChange={() =>
              editor.chain().focus().toggleOrderedList().run()
            }
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

        {/* 查找与替换 */}
        <FindReplace editor={editor} />

        {/* 设定速查按钮 */}
        {workId && <SettingsLookup workId={workId} />}

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
        <EditorSettings settings={settings} onSettingsChange={setSettings} />

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
            {isSaving ? "保存中..." : "保存"}
          </Button>
        )}

        {/* 字数统计 */}
        {settings.showWordCount && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <div className="min-w-[100px]">
              {targetCount > 0 ? (
                <div className="flex flex-col items-center gap-1">
                  <span>
                    {wordCount} / {targetCount} 字
                  </span>
                  <Progress
                    value={(wordCount / targetCount) * 100}
                    className="h-1"
                  />
                </div>
              ) : (
                <span>{wordCount} 字</span>
              )}
            </div>
            {onTargetCountChange && (
              <ValueSettingPopover
                currentValue={targetCount}
                onValueChange={onTargetCountChange}
                label="设置目标字数"
                placeholder="例如: 2000"
                unit="字"
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Target className="h-4 w-4" />
                    <span className="sr-only">设置写作目标</span>
                  </Button>
                }
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
