"use client";

import { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { EditorToolbar } from "./EditorToolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIFloatingButton } from "@/components/ai-assistant/AIFloatingButton";

// 编辑器内容类型
export interface EditorContent {
  title: string;
  content: string;
}

// Tiptap编辑器属性
interface TiptapEditorProps {
  initialContent?: EditorContent; // 初始内容
  onSave?: (content: EditorContent) => void; // 保存回调
  placeholder?: string; // 占位文本
  autoFocus?: boolean; // 是否自动聚焦
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
        types: ["heading", "paragraph"],
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

  // ai助手功能函数
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
