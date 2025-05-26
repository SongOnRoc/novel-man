"use client";
import { copyToClipboard, toastUnavailable } from "@/lib/utils";
import { ChevronLeft, Cloud, Copy, List, Redo, Settings, Sparkles, SpellCheck, Trash2, Undo } from "lucide-react"; // Added Trash2
import { useRouter } from "next/navigation";
import type { EditorInstance } from "novel";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner"; // Import toast
import { useDebouncedCallback } from "use-debounce";

import { AiToolboxDialogContent } from "@/components/dialogs/ai-toolbox-dialog";
import { OutlineDialogContent } from "@/components/dialogs/outline-dialog";
import { SettingsDialogContent } from "@/components/dialogs/settings-dialog";
import { TypoCheckDialogContent } from "@/components/dialogs/typo-check-dialog";
import TailwindAdvancedEditor from "@/components/tailwind/advanced-editor";
import { Button } from "@/components/tailwind/ui/button";
import LoadingCircle from "@/components/tailwind/ui/icons/loading-circle";

const SaveStatus = ({
  status,
  wordCount,
}: {
  status: "saved" | "saving" | "error";
  wordCount: number;
}) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {status === "saving" ? (
        <>
          <LoadingCircle dimensions="h-4 w-4" />
          <span>保存中...</span>
        </>
      ) : status === "error" ? (
        <span className="text-destructive">保存失败</span>
      ) : (
        <span>已保存</span>
      )}
      <span>|</span>
      <span>{wordCount}字</span>
    </div>
  );
};

export default function Page() {
  const router = useRouter();
  const [isTypoCheckOpen, setIsTypoCheckOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [_displayTitle, setDisplayTitle] = useState(""); // 用于保存标题状态

  const editorRef = useRef<{ getEditor: () => EditorInstance | null }>(null);

  const saveTitle = (newTitle: string) => {
    const titleToSave = newTitle.trim(); // Trim whitespace
    window.localStorage.setItem("novel-title", titleToSave);
    setSaveStatus("saved");

    // 检查是否是灵感记录，如果是则自动保存到草稿
    const isInspiration = window.localStorage.getItem("is-inspiration");
    if (isInspiration && titleToSave) {
      saveToDrafts(titleToSave, editorRef.current?.getEditor()?.getText() || "");
    }

    // If the title becomes empty, ensure the h1's innerHTML is also cleared
    // to help with CSS :empty selector, and update displayTitle state.
    if (titleRef.current && titleToSave === "") {
      titleRef.current.innerHTML = "";
    }
    // Keep the displayTitle state consistent with what's being saved.
    // This ensures that if the user clears the title, the state reflects that,
    // allowing the :empty CSS pseudo-class to potentially work.
    setDisplayTitle(titleToSave);
  };

  const saveToDrafts = (title: string, content: string) => {
    // 简单的草稿保存逻辑，实际项目中应该保存到数据库
    const drafts = JSON.parse(localStorage.getItem("drafts") || "[]");
    const draftId = Date.now().toString();
    const newDraft = {
      id: draftId,
      title: title,
      content: content,
      wordCount: content.length,
      updatedAt: new Date().toLocaleString(),
      volume: "第一卷：初见",
    };

    drafts.unshift(newDraft);
    localStorage.setItem("drafts", JSON.stringify(drafts));

    // 清除灵感标记
    localStorage.removeItem("is-inspiration");
  };

  const debouncedTitleUpdate = useDebouncedCallback(saveTitle, 500);

  // Helper to update placeholder class based on title content
  const updatePlaceholderVisibility = (element: HTMLElement | null, title: string) => {
    if (element) {
      if (title.trim() === "") {
        element.classList.add("title-is-empty");
      } else {
        element.classList.remove("title-is-empty");
      }
    }
  };

  useEffect(() => {
    const savedTitle = window.localStorage.getItem("novel-title");
    const initialTitle = savedTitle || "";

    if (titleRef.current) {
      titleRef.current.textContent = initialTitle;
    }
    setDisplayTitle(initialTitle);
    updatePlaceholderVisibility(titleRef.current, initialTitle); // Set initial class

    const timer = setTimeout(() => {
      const content = window.localStorage.getItem("novel-text-length");
      if (content) {
        setWordCount(Number.parseInt(content));
      }

      // 检查是否有草稿内容需要加载
      const draftContent = window.localStorage.getItem("novel-content");
      const draftId = window.localStorage.getItem("current-draft-id");

      if (draftContent && draftId) {
        // 如果有草稿内容，加载到编辑器中
        const editor = editorRef.current?.getEditor();
        if (editor) {
          // 将纯文本内容转换为段落格式
          const paragraphs = draftContent
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => `<p>${p}</p>`)
            .join("");
          editor.commands.setContent(paragraphs || "<p></p>");
        }
        // 清除草稿加载标记
        window.localStorage.removeItem("novel-content");
        window.localStorage.removeItem("current-draft-id");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [wordCount, setWordCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [isAiToolboxOpen, setIsAiToolboxOpen] = useState(false);

  const handleClearContent = () => {
    // Add confirmation dialog
    if (window.confirm("确定要清空所有内容吗？此操作将清除所有记录，若误触请点击取消。")) {
      // Clear title
      if (titleRef.current) {
        titleRef.current.textContent = "";
        saveTitle(""); // Save empty title and update state
        updatePlaceholderVisibility(titleRef.current, ""); // Update placeholder visibility
      }

      // Clear editor content
      const editor = editorRef.current?.getEditor();
      if (editor) {
        editor.commands.clearContent(true); // Clear content and trigger save/update
        // clearContent(true) should trigger onUpdate -> saveContent -> onWordCountChange
        // Manually set state for immediate UI feedback
        setWordCount(0);
        setSaveStatus("saved"); // Assume saved state after clearing
        // Ensure local storage length is updated too
        window.localStorage.setItem("novel-text-length", "0");
      }
      toast.error("内容已清空"); // Notify user
    }
    // If user cancels, do nothing.
  };

  return (
    // Removed the local 'theme' state class from this div.
    // Styling is now applied globally to the <html> element.
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10">
        <div className="flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/drafts")}>
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* <Button variant="ghost" size="icon" onClick={() => setIsTypoCheckOpen(true)}> */}
            <Button variant="ghost" size="icon" onClick={() => toastUnavailable()}>
              <SpellCheck className="h-5 w-5 text-muted-foreground" />
            </Button>

            {/* <Button variant="ghost" size="icon" onClick={() => setIsOutlineOpen(true)}> */}
            <Button variant="ghost" size="icon" onClick={() => toastUnavailable()}>
              <List className="h-5 w-5 text-muted-foreground" />
            </Button>

            <Button variant="ghost" size="icon" onClick={toastUnavailable}>
              <Cloud className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>

          <Button variant="ghost" className="text-primary font-semibold" onClick={toastUnavailable}>
            下一步
          </Button>
        </div>
        <div className="flex h-10 items-center justify-between px-4 text-sm text-gray-500">
          <button
            type="button"
            className="flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 cursor-pointer hover:bg-secondary-foreground"
            onClick={() => router.push("/drafts?tab=drafts")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/drafts?tab=drafts");
              }
            }}
            aria-label="查看卷章列表"
          >
            <span>第一卷：初见</span>
            <ChevronLeft className="h-4 w-4 rotate-180 transform" />
          </button>
          <SaveStatus status={saveStatus} wordCount={wordCount} />
        </div>
      </header>

      <main id="main-content-area" className="flex-1 overflow-y-auto p-4">
        <div className="mb-2">
          <h1
            ref={titleRef}
            className="font-medium outline-none page-main-title"
            data-placeholder="第1章 踏花归去马蹄香" // Added data-placeholder
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => {
              const currentText = e.currentTarget.textContent || "";
              setSaveStatus("saving");
              updatePlaceholderVisibility(e.currentTarget as HTMLElement, currentText);
              debouncedTitleUpdate(currentText);
            }}
            onBlur={(e) => {
              const currentText = e.currentTarget.textContent || "";
              updatePlaceholderVisibility(e.currentTarget as HTMLElement, currentText);
              saveTitle(currentText); // Ensure save on blur
            }}
          >
            {/* Content is primarily managed by textContent and contentEditable. */}
            {/* displayTitle state is used for React's rendering cycle and consistency. */}
            {/* Initial content is set by useEffect. */}
          </h1>
        </div>

        <div className="min-h-[60vh]">
          <TailwindAdvancedEditor
            ref={editorRef}
            onSaveStatusChange={(status) => {
              setSaveStatus(status === "Saved" ? "saved" : "saving");
            }}
            onWordCountChange={setWordCount}
          />
        </div>
      </main>

      <footer className="flex h-auto items-center justify-center p-4 sticky bottom-0 z-10 border-t">
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editorRef.current?.getEditor()?.commands.undo()}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Undo className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editorRef.current?.getEditor()?.commands.redo()}
            className="text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <Redo className="h-5 w-5" />
          </Button>

          <Button
            className="flex items-center rounded-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 px-5 py-2.5 text-white shadow-md hover:shadow-lg transition-shadow"
            onClick={() => setIsAiToolboxOpen(true)}
          >
            <Sparkles className="h-4 w-2.5" /> AI工具箱
          </Button>

          {/* Helper function to handle copying content to clipboard */}
          {(() => {
            const handleCopyContent = () => {
              const title = titleRef.current?.textContent || "";
              let content = editorRef.current?.getEditor()?.getText() || "";

              // Replace multiple newlines with a single newline
              content = content.replace(/\n+/g, "\n");

              // Construct the text to copy
              // If title exists, add a newline between title and content.
              // If content is empty or starts with a newline, this handles it gracefully.
              const textToCopy = title ? `${title.trim()}\n${content.trim()}` : content.trim();

              copyToClipboard(textToCopy);
            };

            return (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="ml-2 h-8 w-16 flex items-center border border-border hover:bg-muted text-muted-foreground"
              >
                <Copy className="h-4 w-2.5" /> 复制
              </Button>
            );
          })()}

          {/* Clear Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearContent}
            className="ml-2 h-8 w-16 flex items-center border border-border hover:bg-destructive/10 text-destructive hover:border-destructive" // Adjusted style for clear action
          >
            <Trash2 className="h-4 w-2.5" /> 清空
          </Button>
        </div>
      </footer>

      {isAiToolboxOpen && (
        <AiToolboxDialogContent
          editor={editorRef.current?.getEditor() || null}
          onClose={() => setIsAiToolboxOpen(false)}
        />
      )}
      {isSettingsOpen && <SettingsDialogContent onClose={() => setIsSettingsOpen(false)} />}
      {isTypoCheckOpen && <TypoCheckDialogContent onClose={() => setIsTypoCheckOpen(false)} />}
      {isOutlineOpen && <OutlineDialogContent onClose={() => setIsOutlineOpen(false)} />}
    </div>
  );
}
