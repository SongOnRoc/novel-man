"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Document from "@tiptap/extension-document";
import Highlight from "@tiptap/extension-highlight";
import { EditorToolbar } from "./EditorToolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EditorContent as EditorContentType,
  EditorSettings,
  defaultEditorSettings,
} from "@/types/editor";
import { BookmarkExtension } from "@/lib/editor/BookmarkExtension";
import { AIFloatingButton } from "@/components/ai-assistant/AIFloatingButton";
import { FindExtension } from "@/lib/editor/FindExtension";

// Tiptap编辑器属性
interface TiptapEditorProps {
  initialContent?: EditorContentType; // 初始内容
  onSave?: (content: EditorContentType) => void; // 保存回调
  placeholder?: string; // 占位文本
  autoFocus?: boolean; // 是否自动聚焦
  contentId?: string; // 内容ID，用于书签等
  workId?: string; // 作品ID，用于设定速查
  containerId?: string; // 容器ID，用于专注模式
}

// 计算字数的函数
function countWords(html: string): number {
  if (!html) return 0;

  // 创建临时元素来解析HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // 获取纯文本内容
  const text = temp.textContent || temp.innerText || "";

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
      "Mod-g": () => {
        const line = prompt("请输入要跳转的行号:");
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
                  behavior: "smooth",
                  block: "center",
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
  initialContent = { title: "", content: "" },
  onSave,
  placeholder = "开始您的创作...",
  autoFocus = false,
  contentId = "temp",
  workId,
  containerId = "editor-container",
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
      const savedSettings = localStorage.getItem("editor-settings");
      return savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings;
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
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
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      BookmarkExtension,
      FindExtension,
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

  // ai助手功能函数
  const getSelectedText = () => {
    if (!editor) return "";

    // 检查是否有选中内容
    if (editor.state.selection.empty) {
      return "";
    }

    // 获取选中的文本内容
    const { from, to } = editor.state.selection;

    // 使用编辑器的textBetween方法获取选中的文本
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    return selectedText;
  };

  const applyTextToEditor = (text: string) => {
    // 将生成的文本应用到编辑器
    // 如果有选中内容，则替换选中内容；否则在光标位置插入
    if (editor) {
      if (editor.state.selection.empty) {
        // 没有选中内容，在当前位置插入
        editor.commands.insertContent(text);
      } else {
        // 替换选中内容
        editor.commands.deleteSelection();
        editor.commands.insertContent(text);
      }
    }
  };

  // 自动保存（根据设置的间隔）
  useEffect(() => {
    if (!editor || !onSave || !settings.enableAutoSave) return;

    const autoSaveInterval = setInterval(() => {
      const content = getCurrentContent();
      if (content.title || content.content !== "<p></p>") {
        console.log("自动保存...");
        onSave(content);
      }
    }, settings.autoSaveInterval * 1000);

    return () => clearInterval(autoSaveInterval);
  }, [
    editor,
    getCurrentContent,
    onSave,
    settings.enableAutoSave,
    settings.autoSaveInterval,
  ]);

  // 初始化字数统计
  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getHTML()));
    }
  }, [editor]);

  // 应用编辑器设置的CSS变量
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${settings.fontSize}px`
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      `${settings.lineSpacing}`
    );
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
        contentId={contentId}
        workId={workId}
        editorContainerId={containerId}
      />

      {/* 内容编辑区 */}
      <div
        className={`prose prose-sm dark:prose-invert max-w-none p-4 min-h-[300px] theme-${settings.theme}`}
      >
        <EditorContent editor={editor} className="min-h-[300px] outline-none" />
      </div>

      {/* AI悬浮按钮 */}
      <AIFloatingButton
        getSelectedText={getSelectedText}
        applyTextToEditor={applyTextToEditor}
        context={`标题：${title || "未命名"}`}
      />

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

        /* 查找高亮样式 */
        .find-highlight {
          background-color: yellow;
        }

        .find-highlight.active {
          background-color: orange;
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
