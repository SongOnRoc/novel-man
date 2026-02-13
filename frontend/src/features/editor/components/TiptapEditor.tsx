"use client";

import Document from "@tiptap/extension-document";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import HardBreak from "@tiptap/extension-hard-break";
import { PanelRightClose, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImperativePanelHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import { BookmarkExtension } from "@/lib/editor/BookmarkExtension";
import { FindExtension } from "@/lib/editor/FindExtension";
import {
  EditorContent as EditorContentType,
  EditorSettings,
  defaultEditorSettings,
} from "@/types/editor";

import { EditorToolbar } from "./EditorToolbar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { AIChatInterface } from "@/features/ai/components/chat/AIChatInterface";
import {
  MobileAIContainer,
  type MobileAIMode,
} from "@/features/ai/components/mobile";
import { useDebounce } from "@/hooks/useDebounce";

import { SearchPanel } from "./SearchPanel";
import { SidePanelContainer } from "./SidePanelContainer";

export type SaveStatus = "saved" | "saving" | "error" | "unsaved";

// Tiptap编辑器属性
interface TiptapEditorProps {
  initialContent?: EditorContentType; // 初始内容
  onSave?: (content: EditorContentType & { wordCount: number }) => void; // 保存回调
  placeholder?: string; // 占位文本
  autoFocus?: boolean; // 是否自动聚焦
  contentId?: string; // 内容ID，用于书签等
  workId?: string; // 作品ID，用于设定速查
  containerId?: string; // 容器ID，用于专注模式
  targetCount?: number;
  onTargetCountChange?: (newTarget: number) => void;
  isSaving?: boolean; // 是否正在保存
  onContentUpdate?: (data: {
    title: string;
    content: string;
    wordCount: number;
  }) => void;
  onSelectionChange?: (text: string) => void; // 选中文本回调
  onBack?: () => void; // 返回回调
  onPublish?: () => void; // 发布回调
}

// 统计字数函数
const countWords = (html: string) => {
  const text = html.replace(/<[^>]*>/g, "");
  return text.replace(/\s+/g, "").length;
};

// 自定义硬换行扩展，在换行后添加缩进占位符
const CustomHardBreak = HardBreak.extend({
  addOptions() {
    return {
      keepMarks: false,
      HTMLAttributes: {},
    };
  },

  toDOM() {
    return [
      "span",
      { class: "hard-break-wrapper" },
      ["br"],
      ["span", { class: "indent-spacer" }],
    ];
  },
});

export function TiptapEditor({
  initialContent = { title: "", content: "" },
  onSave,
  placeholder = "开始你的创作...",
  autoFocus = false,
  contentId = "default-editor",
  workId,
  containerId = "editor-container",
  targetCount,
  onTargetCountChange,
  isSaving: isSavingProp = false,
  onContentUpdate,
  onSelectionChange,
  onBack,
  onPublish,
}: TiptapEditorProps) {
  const [title, setTitle] = useState(initialContent.title || "");
  const [content, setContent] = useState(initialContent.content || "");
  const [wordCount, setWordCount] = useState(0);

  // Side Panel States
  // Side Panel States
  const [isAIOpen, setInternalIsAIOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAICollapsed, setIsAICollapsed] = useState(false);
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  // Mobile AI Mode State
  const [mobileAIMode, setMobileAIMode] = useState<MobileAIMode>("floating");
  const [selectedText, setSelectedText] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const router = useRouter();

  // Debounce content and title changes for auto-save
  // Increased to 2000ms to prevent frequent saves (DDoS prevention)
  const debouncedContent = useDebounce(content, 3000);
  const debouncedTitle = useDebounce(title, 3000);

  // Refs for imperative panel resizing
  const aiPanelRef = useRef<ImperativePanelHandle>(null);
  const editorPanelRef = useRef<ImperativePanelHandle>(null);

  // Ref to track last save time for rate limiting
  const lastSaveTime = useRef<number>(0);
  const pendingSaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false); // Track actual save operation status
  const isDirtyRef = useRef(false); // Track if content has changed since last save
  const MIN_SAVE_INTERVAL = 2000; // 2 seconds

  const toggleAI = () => {
    const newState = !isAIOpen;
    setInternalIsAIOpen(newState);
    if (newState) {
      setIsAICollapsed(false);
      // If search is also open, we don't need to close it, they coexist
    }
  };

  const toggleSearch = () => {
    const newState = !isSearchOpen;
    setIsSearchOpen(newState);
    if (newState) {
      setIsSearchCollapsed(false);
    }
  };

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const savedSettings = localStorage.getItem("editor-settings");
      return savedSettings
        ? { ...defaultEditorSettings, ...JSON.parse(savedSettings) }
        : defaultEditorSettings;
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
      return defaultEditorSettings;
    }
  });

  useEffect(() => {
    // Mock fetch settings from server
    const fetchSettings = async () => {
      try {
        // const response = await fetch('/api/settings');
        // const data = await response.json();
        // if (data) setSettings(data);
        console.log("Fetching settings from server...");
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSettingsChange = (newSettings: EditorSettings) => {
    setSettings(newSettings);
    localStorage.setItem("editor-settings", JSON.stringify(newSettings));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        hardBreak: false, // Disable default HardBreak
      }),
      CustomHardBreak, // Use custom HardBreak
      Underline,
      Placeholder.configure({
        placeholder: "没有思路，问问ai试试。",
        includeChildren: true,
        showOnlyCurrent: true,
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
    content: initialContent.content?.replace(/<h1[^>]*>.*?<\/h1>/gi, "") || "",
    autofocus: autoFocus,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const newWordCount = countWords(html);
      setWordCount(newWordCount);
      setContent(html); // Update content state for debounce
      setSaveStatus("saving"); // Mark as saving immediately on change
      isDirtyRef.current = true;

      if (onContentUpdate) {
        onContentUpdate({
          title,
          content: html,
          wordCount: newWordCount,
        });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, " ");
      setSelectedText(text);
      if (onSelectionChange) {
        onSelectionChange(text);
      }
    },
  });

  const getCurrentContent = useCallback(() => {
    if (!editor) return { title, content: "" };
    return {
      title,
      content: editor.getHTML(),
    };
  }, [editor, title]);

  const handleSave = async (currentContent?: {
    title: string;
    content: string;
  }) => {
    if (onSave) {
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTime.current;

      // Clear any existing pending save to avoid multiple queued saves
      if (pendingSaveTimeout.current) {
        clearTimeout(pendingSaveTimeout.current);
        pendingSaveTimeout.current = null;
      }

      // If we are within the rate limit window or currently saving, queue this save
      if (timeSinceLastSave < MIN_SAVE_INTERVAL || isSavingRef.current) {
        console.log("Save rate limited or busy, queuing trailing save...");

        const delay = Math.max(MIN_SAVE_INTERVAL - timeSinceLastSave, 500); // Ensure at least small delay

        pendingSaveTimeout.current = setTimeout(() => {
          handleSave(currentContent);
        }, delay);

        return;
      }

      isSavingRef.current = true;
      setSaveStatus("saving");
      lastSaveTime.current = now;

      try {
        // Add a minimum delay to ensure the spinner is visible
        const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
        const dataToSave = currentContent || getCurrentContent();

        await Promise.all([onSave({ ...dataToSave, wordCount }), minDelay]);

        setSaveStatus("saved");
        isDirtyRef.current = false;
      } catch (error) {
        console.error("保存失败:", error);
        setSaveStatus("unsaved"); // Show 'unsaved' on error
      } finally {
        isSavingRef.current = false;
      }
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (settings.enableAutoSave && isDirtyRef.current) {
      // Trigger save if content changed (tracked by isDirtyRef)
      handleSave({ title: debouncedTitle, content: debouncedContent });
    }
  }, [debouncedContent, debouncedTitle, settings.enableAutoSave]);

  // Sync title changes to saving status
  useEffect(() => {
    if (title !== initialContent.title) {
      setSaveStatus("saving");
    }
  }, [title]);

  useEffect(() => {
    if (editor) {
      setWordCount(countWords(editor.getHTML()));
    }
  }, [editor]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${settings.fontSize}px`
    );
    document.documentElement.style.setProperty(
      "--editor-line-height",
      `${settings.lineSpacing}`
    );
    document.documentElement.style.setProperty(
      "--editor-paragraph-spacing",
      `${settings.paragraphSpacing || 1.5}em`
    );
    document.documentElement.style.setProperty(
      "--editor-paragraph-indent",
      (settings.paragraphIndent ?? true) ? "2em" : "0"
    );
  }, [settings]);

  // Handle Side Panel resizing
  useEffect(() => {
    const panel = aiPanelRef.current;
    if (panel) {
      if (isAIOpen || isSearchOpen) {
        panel.resize(25);
      } else {
        panel.collapse();
      }
    }
  }, [isAIOpen, isSearchOpen]);

  const handleApplySettings = async () => {
    // Mock server sync
    console.log("Syncing settings to server:", settings);
    // In a real app: await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) });
  };

  const handleBack = async () => {
    if (isDirtyRef.current) {
      await handleSave();
    }
    if (onBack) {
      onBack();
    }
  };

  //处理将AI生成内容应用到编辑器
  const handleApplyToEditor = useCallback(
    (text: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      if (from !== to) {
        // 有选中文本：替换选中内容
        editor.chain().focus().deleteSelection().insertContent(text).run();
      } else {
        // 无选中：在光标处插入
        editor.chain().focus().insertContent(text).run();
      }
    },
    [editor]
  );

  const EditorLayout = (
    <div
      id={containerId}
      className={`flex h-full flex-col relative font-sans group/editor theme-${settings.theme} editor-paper transition-colors duration-500`}
    >
      {/* 顶部工具栏 - 移动端和桌面端都使用sticky定位 */}
      <div className="sticky top-0 z-20 border-b border-border/10 editor-paper transition-all duration-300">
        <div className="mx-auto w-full max-w-5xl px-2 sm:px-8 py-2 sm:py-3">
          <EditorToolbar
            editor={editor}
            title={title}
            onSave={() => handleSave()}
            saveStatus={saveStatus}
            wordCount={wordCount}
            contentId={contentId}
            workId={workId}
            editorContainerId={containerId}
            targetCount={targetCount}
            onTargetCountChange={onTargetCountChange}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onApply={handleApplySettings}
            onBack={handleBack}
            onPublish={onPublish}
            onOpenSearch={toggleSearch}
          />
        </div>
      </div>

      {/* 内容编辑区 - 移动端全屏，桌面端纸张模式 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar sm:p-8">
        <div
          id="editor-paper-content"
          className={cn(
            "mx-auto max-w-5xl min-h-[calc(100vh-4rem)] editor-paper",
            "sm:shadow-sm sm:border sm:border-border/40 sm:rounded-xl sm:px-8 sm:py-12",
            "px-4 py-6 transition-all duration-500 ease-out"
          )}
        >
          {/* 标题输入框 - 融入编辑区 */}
          <div
            id="title-input-container"
            className="mb-2 transition-all duration-300"
          >
            {settings.customTitleStyle ? (
              <Input
                value={title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTitle(newTitle);
                  setSaveStatus("unsaved");
                  isDirtyRef.current = true;
                  if (onContentUpdate && editor) {
                    onContentUpdate({
                      title: newTitle,
                      content: editor.getHTML(),
                      wordCount: countWords(editor.getHTML()),
                    });
                  }
                }}
                placeholder="请输入标题"
                className="font-bold border-none px-0 h-auto focus-visible:ring-0 bg-transparent placeholder:text-muted-foreground/40"
                style={{ fontSize: "var(--editor-font-size)" }}
              />
            ) : (
              <div
                className="flex items-end gap-2 font-medium text-foreground/80"
                style={{ fontSize: "var(--editor-font-size)" }}
              >
                <span className="pb-1">第</span>
                <Input
                  value={(() => {
                    const match = title.match(/^第\s*(\S+)\s*章/);
                    return match ? match[1] : "";
                  })()}
                  onChange={(e) => {
                    const newIndex = e.target.value;
                    const nameMatch = title.match(/^第\s*\S+\s*章\s*(.*)$/);
                    const currentName = nameMatch
                      ? nameMatch[1]
                      : title.match(/^第\s*\S+\s*章/)
                        ? ""
                        : title;

                    // If the current title doesn't match the pattern at all, we might want to preserve it as the name
                    // But here we are constructing a new strict format.

                    const newTitle = `第 ${newIndex} 章 ${currentName}`;

                    setTitle(newTitle);
                    setSaveStatus("unsaved");
                    isDirtyRef.current = true;
                    if (onContentUpdate && editor) {
                      onContentUpdate({
                        title: newTitle,
                        content: editor.getHTML(),
                        wordCount: countWords(editor.getHTML()),
                      });
                    }
                  }}
                  className="border-0 border-b border-border/50 rounded-none text-center w-20 bg-transparent focus-visible:ring-0 px-1 h-8"
                />
                <span className="pb-1">章</span>
                <Input
                  value={(() => {
                    const match = title.match(/^第\s*\S+\s*章\s*(.*)$/);
                    return match
                      ? match[1]
                      : title.startsWith("第") && title.includes("章")
                        ? ""
                        : title;
                  })()}
                  onChange={(e) => {
                    const newName = e.target.value;
                    const indexMatch = title.match(/^第\s*(\S+)\s*章/);
                    const currentIndex = indexMatch ? indexMatch[1] : "";

                    const newTitle = `第 ${currentIndex} 章 ${newName}`;

                    setTitle(newTitle);
                    setSaveStatus("unsaved");
                    isDirtyRef.current = true;
                    if (onContentUpdate && editor) {
                      onContentUpdate({
                        title: newTitle,
                        content: editor.getHTML(),
                        wordCount: countWords(editor.getHTML()),
                      });
                    }
                  }}
                  placeholder="章节标题"
                  className="border-0 border-b border-border/50 rounded-none flex-1 bg-transparent focus-visible:ring-0 px-1 h-8"
                />
              </div>
            )}
          </div>

          <EditorContent
            editor={editor}
            className="outline-none prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-foreground/90 prose-p:my-4 prose-p:text-lg"
          />
        </div>
      </div>

      {/* 移动端搜索抽屉 */}
      {!isDesktop && (
        <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <SheetContent
            side="bottom"
            className={cn(
              "h-[80vh] p-0 rounded-t-[2rem] border-t-0 shadow-2xl editor-paper",
              `theme-${settings.theme}`
            )}
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <SheetTitle className="font-medium text-base">
                  查找与替换
                </SheetTitle>
                <SheetDescription className="sr-only">
                  搜索和替换文档内容
                </SheetDescription>
              </div>
              <div className="flex-1 overflow-hidden">
                <SearchPanel
                  editor={editor}
                  workId={workId}
                  isOpen={true}
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                  onClose={() => setIsSearchOpen(false)}
                  embedded={true}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Mobile AI Assistant - New Dual-Mode Architecture */}
      {!isDesktop && (
        <MobileAIContainer
          selectedText={selectedText}
          onApplyToEditor={handleApplyToEditor}
          workId={workId ? parseInt(workId, 10) : undefined}
          initialMode={mobileAIMode}
          onModeChange={setMobileAIMode}
          isVisible={true}
          theme={settings.theme}
        />
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full group/panels"
        >
          <ResizablePanel
            ref={editorPanelRef}
            defaultSize={isAIOpen || isSearchOpen ? 75 : 100}
            minSize={50}
            className="transition-[flex] duration-500 ease-in-out data-[panel-group-direction=vertical]:transition-[flex]"
          >
            <div className="relative h-full w-full">
              {EditorLayout}
              {/* PC端 AI 悬浮按钮 */}
              <div className="absolute bottom-8 right-8 z-50">
                <Button
                  variant="default"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300",
                    isAIOpen
                      ? "bg-background text-foreground border border-border/40 hover:bg-muted"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 ring-4 ring-primary/10"
                  )}
                  onClick={toggleAI}
                  title={isAIOpen ? "关闭 AI 助手" : "打开 AI 助手"}
                >
                  {isAIOpen ? (
                    <PanelRightClose className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle
            withHandle={false}
            className={cn(
              "bg-transparent hover:bg-transparent w-4 -ml-2 z-50 flex items-center justify-center transition-all focus:outline-none",
              !isAIOpen && !isSearchOpen && "hidden"
            )}
          >
            <div className="h-16 w-1 rounded-full bg-primary/10 hover:bg-primary/30 transition-colors backdrop-blur-sm" />
          </ResizableHandle>

          <ResizablePanel
            ref={aiPanelRef}
            collapsible={true}
            collapsedSize={0}
            defaultSize={0}
            minSize={20}
            maxSize={45}
            onCollapse={() => {
              setInternalIsAIOpen(false);
              setIsSearchOpen(false);
            }}
            className={cn(
              "transition-[flex] duration-500 ease-in-out shadow-2xl z-40 theme-" +
                settings.theme,
              !isAIOpen && !isSearchOpen && "border-none",
              "overflow-visible" // Allow button to stick out
            )}
          >
            <div className="h-full w-full flex flex-col relative overflow-visible">
              {/* Search Panel */}
              <SearchPanel
                editor={editor}
                workId={workId}
                isOpen={isSearchOpen}
                isCollapsed={isSearchCollapsed}
                onToggleCollapse={() =>
                  setIsSearchCollapsed(!isSearchCollapsed)
                }
                onClose={() => setIsSearchOpen(false)}
              />

              {/* AI Panel */}
              <SidePanelContainer
                title="AI 写作助手"
                icon={<Sparkles className="h-4 w-4" />}
                isOpen={isAIOpen}
                isCollapsed={isAICollapsed}
                onToggleCollapse={() => setIsAICollapsed(!isAICollapsed)}
                onClose={() => setInternalIsAIOpen(false)}
                className={cn(isSearchOpen && "border-t")}
              >
                <AIChatInterface
                  workId={workId ? parseInt(workId, 10) : undefined}
                  selectedText={selectedText}
                  onApplyToEditor={handleApplyToEditor}
                  className="h-full border-none bg-transparent"
                  hideBorder={true}
                />
              </SidePanelContainer>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* 编辑器样式 */}
        <style jsx global>{`
          .ProseMirror {
            min-height: 600px;
            outline: none;
            font-size: var(--editor-font-size, 18px);
            line-height: var(--editor-line-height, 1.8);
            color: var(--foreground);
          }

          /* Force override prose line-height */
          .ProseMirror p {
            line-height: var(--editor-line-height, 1.8) !important;
          }

          /* 主题样式 - 定义 CSS 变量以供子组件使用 */
          .theme-default {
            /* 使用默认变量，无需重写 */
          }

          .theme-sepia {
            --background: #e8e6e1;
            --foreground: #5f4b32;
            --muted: #dcd9d4;
            --muted-foreground: #8c7b66;
            --border: #dcd9d4;
            --input: #dcd9d4;
            --card: #f4f1ea;
            --card-foreground: #5f4b32;
            --primary: #8c7b66;
            --primary-foreground: #f4f1ea;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-sepia .ProseMirror {
            color: var(--foreground);
          }

          .theme-dark {
            --background: #0a0a0a;
            --foreground: #e5e5e5;
            --muted: #262626;
            --muted-foreground: #a0a0a0;
            --border: #262626;
            --input: #262626;
            --card: #1a1a1a;
            --card-foreground: #e0e0e0;
            --primary: #e0e0e0;
            --primary-foreground: #1a1a1a;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-dark .ProseMirror {
            color: var(--foreground);
          }

          .theme-minimal {
            --background: #f3f4f6;
            --foreground: #111827;
            --muted: #e5e7eb;
            --muted-foreground: #6b7280;
            --border: #e5e5e5;
            --card: #ffffff;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-green {
            --background: #d0dcb8;
            --foreground: #3a4a3a;
            --muted: #c0ccb0;
            --muted-foreground: #6b7d6b;
            --border: #c0ccb0;
            --input: #c0ccb0;
            --card: #e3edcd;
            --card-foreground: #3a4a3a;
            --primary: #5c7a5c;
            --primary-foreground: #e3edcd;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-green .ProseMirror {
            color: var(--foreground);
          }

          .theme-parchment {
            --background: #e6d5b5;
            --foreground: #4a3b2a;
            --muted: #dccbb0;
            --muted-foreground: #8c7b66;
            --border: #dccbb0;
            --input: #dccbb0;
            --card: #f5e6c8;
            --card-foreground: #4a3b2a;
            --primary: #6b5a45;
            --primary-foreground: #f5e6c8;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-parchment .ProseMirror {
            color: var(--foreground);
          }

          .theme-blue {
            --background: #c8d8e6;
            --foreground: #2a3b4a;
            --muted: #b8c8d6;
            --muted-foreground: #5c6b7a;
            --border: #b8c8d6;
            --input: #b8c8d6;
            --card: #dbe9f5;
            --card-foreground: #2a3b4a;
            --primary: #4a5b6b;
            --primary-foreground: #dbe9f5;

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-blue .ProseMirror {
            color: var(--foreground);
          }

          .theme-custom {
            --background: ${settings.customTheme?.backgroundColor || "#f3f4f6"};
            --foreground: #111827;
            --muted: #e5e7eb;
            --muted-foreground: #6b7280;
            --border: #e5e5e5;
            --card: ${settings.customTheme?.mainColor || "#ffffff"};

            background-color: var(--background);
            color: var(--foreground);
          }

          .theme-custom .ProseMirror {
            color: var(--foreground);
          }

          /* 书签高亮样式 */
          .ProseMirror mark {
            background-color: rgba(255, 220, 0, 0.3);
            border-bottom: 2px solid #ffdc00;
            padding: 2px 0;
            border-radius: 2px;
          }

          /* 查找高亮样式 */
          .find-highlight {
            background-color: rgba(255, 255, 0, 0.5);
            color: inherit;
            border-radius: 2px;
            padding: 0 2px;
          }

          .find-highlight.active {
            background-color: #ff9900;
            color: white;
            box-shadow: 0 0 0 2px #ff9900;
          }

          /* 专注模式样式 */
          #${containerId}:fullscreen {
            background-color: var(--background);
            padding: 0;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          #${containerId}:fullscreen .ProseMirror {
            max-width: 900px;
            margin: 0 auto;
            padding: 6rem 3rem;
          }

          .ProseMirror p,
          .ProseMirror div[data-type="paragraph"] {
            display: block !important;
            position: relative; /* For absolute placeholder */
            line-height: var(--editor-line-height, 1.8) !important;
            text-indent: var(--editor-paragraph-indent, 2em) !important;
            margin-top: var(--editor-paragraph-spacing, 1.5em) !important;
            margin-bottom: var(--editor-paragraph-spacing, 1.5em) !important;
          }

          /* Hard break indentation spacer */
          .indent-spacer {
            display: inline-block;
            width: var(--editor-paragraph-indent, 0);
            height: 0; /* Invisible but takes width */
          }

          /* Ensure hard break wrapper behaves correctly */
          .hard-break-wrapper {
            display: inline;
          }

          .ProseMirror p.is-empty::before {
            color: var(--muted-foreground);
            content: attr(data-placeholder);
            pointer-events: none;
            position: absolute;
            left: var(--editor-paragraph-indent, 2em);
            top: 0;
            white-space: nowrap;
            text-indent: 0; /* Prevent double indentation (inherited + left) */
          }

          .ProseMirror h1,
          .ProseMirror h2,
          .ProseMirror h3 {
            margin-top: 2em;
            margin-bottom: 1em;
            line-height: 1.3;
          }

          .editor-paper {
            background-color: var(--card);
          }

          /* 自定义滚动条样式 */
          .custom-scrollbar::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            display: none;
          }

          .custom-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
        `}</style>
      </>
    );
  }

  // Mobile layout
  return (
    <>
      {EditorLayout}
      {/* 编辑器样式 */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 500px;
          outline: none;
          font-size: var(--editor-font-size, 18px);
          line-height: var(--editor-line-height, 1.8);
          color: var(--foreground);
        }

        /* Force override prose line-height */
        .ProseMirror p {
          line-height: var(--editor-line-height, 1.8) !important;
        }

        /* 主题样式 - 定义 CSS 变量以供子组件使用 */
        .theme-default {
          /* 使用默认变量，无需重写 */
        }

        .theme-sepia {
          --background: #e8e6e1;
          --foreground: #5f4b32;
          --muted: #dcd9d4;
          --muted-foreground: #8c7b66;
          --border: #dcd9d4;
          --input: #dcd9d4;
          --card: #f4f1ea;
          --card-foreground: #5f4b32;
          --primary: #8c7b66;
          --primary-foreground: #f4f1ea;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-sepia .ProseMirror {
          color: var(--foreground);
        }

        .theme-dark {
          --background: #0a0a0a;
          --foreground: #e5e5e5;
          --muted: #262626;
          --muted-foreground: #a0a0a0;
          --border: #262626;
          --input: #262626;
          --card: #1a1a1a;
          --card-foreground: #e0e0e0;
          --primary: #e0e0e0;
          --primary-foreground: #1a1a1a;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-dark .ProseMirror {
          color: var(--foreground);
        }

        .theme-minimal {
          --background: #f3f4f6;
          --foreground: #111827;
          --muted: #e5e7eb;
          --muted-foreground: #6b7280;
          --border: #e5e5e5;
          --card: #ffffff;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-green {
          --background: #d0dcb8;
          --foreground: #3a4a3a;
          --muted: #c0ccb0;
          --muted-foreground: #6b7d6b;
          --border: #c0ccb0;
          --input: #c0ccb0;
          --card: #e3edcd;
          --card-foreground: #3a4a3a;
          --primary: #5c7a5c;
          --primary-foreground: #e3edcd;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-green .ProseMirror {
          color: var(--foreground);
        }

        .theme-parchment {
          --background: #e6d5b5;
          --foreground: #4a3b2a;
          --muted: #dccbb0;
          --muted-foreground: #8c7b66;
          --border: #dccbb0;
          --input: #dccbb0;
          --card: #f5e6c8;
          --card-foreground: #4a3b2a;
          --primary: #6b5a45;
          --primary-foreground: #f5e6c8;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-parchment .ProseMirror {
          color: var(--foreground);
        }

        .theme-blue {
          --background: #c8d8e6;
          --foreground: #2a3b4a;
          --muted: #b8c8d6;
          --muted-foreground: #5c6b7a;
          --border: #b8c8d6;
          --input: #b8c8d6;
          --card: #dbe9f5;
          --card-foreground: #2a3b4a;
          --primary: #4a5b6b;
          --primary-foreground: #dbe9f5;

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-blue .ProseMirror {
          color: var(--foreground);
        }

        .theme-custom {
          --background: ${settings.customTheme?.backgroundColor || "#f3f4f6"};
          --foreground: #111827;
          --muted: #e5e7eb;
          --muted-foreground: #6b7280;
          --border: #e5e5e5;
          --card: ${settings.customTheme?.mainColor || "#ffffff"};

          background-color: var(--background);
          color: var(--foreground);
        }

        .theme-custom .ProseMirror {
          color: var(--foreground);
        }

        /* 书签高亮样式 */
        .ProseMirror mark {
          background-color: rgba(255, 220, 0, 0.3);
          border-bottom: 2px solid #ffdc00;
          padding: 2px 0;
          border-radius: 2px;
        }

        /* 查找高亮样式 */
        .find-highlight {
          background-color: rgba(255, 255, 0, 0.5);
          color: inherit;
          border-radius: 2px;
          padding: 0 2px;
        }

        .find-highlight.active {
          background-color: #ff9900;
          color: white;
          box-shadow: 0 0 0 2px #ff9900;
        }

        /* 专注模式样式 */
        #${containerId}:fullscreen {
          background-color: var(--background);
          padding: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        #${containerId}:fullscreen .ProseMirror {
          max-width: 900px;
          margin: 0 auto;
          padding: 6rem 3rem;
        }

        .ProseMirror p,
        .ProseMirror div[data-type="paragraph"] {
          display: block !important;
          position: relative; /* For absolute placeholder */
          line-height: var(--editor-line-height, 1.8) !important;
          text-indent: var(--editor-paragraph-indent, 2em) !important;
          margin-top: var(--editor-paragraph-spacing, 1.5em) !important;
          margin-bottom: var(--editor-paragraph-spacing, 1.5em) !important;
        }

        /* Hard break indentation spacer */
        .indent-spacer {
          display: inline-block;
          width: var(--editor-paragraph-indent, 0);
          height: 0; /* Invisible but takes width */
        }

        /* Ensure hard break wrapper behaves correctly */
        .hard-break-wrapper {
          display: inline;
        }

        .ProseMirror p.is-empty::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          pointer-events: none;
          position: absolute;
          left: var(--editor-paragraph-indent, 2em);
          top: 0;
          white-space: nowrap;
          text-indent: 0; /* Prevent double indentation (inherited + left) */
        }

        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          margin-top: 2em;
          margin-bottom: 1em;
          line-height: 1.3;
        }

        .editor-paper {
          background-color: var(--card);
        }

        /* 自定义滚动条样式 */
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
          display: none;
        }

        .custom-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
      `}</style>
    </>
  );
}
