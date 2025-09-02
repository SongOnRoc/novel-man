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
  Expand,
  Shrink,
} from "lucide-react";
import { useState, useEffect } from "react";

import { SettingsLookup } from "@/components/common/SettingsLookup";
import { ValueSettingPopover } from "@/components/common/ValueSettingPopover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { characterLookupSource } from "@/features/characters/character-lookup";
import { worldviewLookupSource } from "@/features/worldview/worldview-lookup";
import { useBookmarks } from "@/hooks/editor/useBookmarks";
import {
  EditorSettings as EditorSettingsType,
  defaultEditorSettings,
} from "@/types/editor";

import { BookmarkManager } from "./BookmarkManager";
import { EditorSettings } from "./EditorSettings";
import { FindReplace } from "./FindReplace";

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
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    const elem = document.getElementById(editorContainerId);
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

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
      `${settings.fontSize}px`,
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      `${settings.lineSpacing}`,
    );

    // 应用主题
    const editorElement = document.querySelector(".ProseMirror");
    if (editorElement) {
      // 移除所有主题类
      editorElement.classList.remove(
        "theme-default",
        "theme-sepia",
        "theme-dark",
        "theme-minimal",
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
    <div className="p-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg bg-background p-2 shadow-md">
        {/* 格式控制 */}
        <div className="flex items-center">
          <Button
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="加粗"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="斜体"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="下划线"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 对齐方式 */}
        <div className="flex items-center">
          <Button
            variant={editor.isActive({ textAlign: "left" }) ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            aria-label="左对齐"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive({ textAlign: "center" }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            aria-label="居中对齐"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive({ textAlign: "right" }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            aria-label="右对齐"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive({ textAlign: "justify" }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            aria-label="两端对齐"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 标题 */}
        <div className="flex items-center">
          <Button
            variant={
              editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            aria-label="一级标题"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="二级标题"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant={
              editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
            }
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            aria-label="三级标题"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* 列表 */}
        <div className="flex items-center">
          <Button
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="无序列表"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="有序列表"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
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
        {workId && (
          <SettingsLookup
            workId={workId}
            sources={[characterLookupSource, worldviewLookupSource]}
          />
        )}

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

        {/* 专注模式按钮 */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullScreen}
          aria-label={isFullScreen ? "退出专注模式" : "进入专注模式"}
        >
          {isFullScreen ? (
            <Shrink className="h-4 w-4" />
          ) : (
            <Expand className="h-4 w-4" />
          )}
        </Button>

        {/* 保存按钮 */}
        {onSave && (
          <Button
            variant="default"
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
