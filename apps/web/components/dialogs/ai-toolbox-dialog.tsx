"use client";
import useLocalStorage from "@/hooks/use-local-storage";
import { APP_THEME_COLORS } from "@/lib/theme-config";
import { copyToClipboard } from "@/lib/utils";
import type { Editor as TiptapEditor } from "@tiptap/core";
import {
  ArrowDownWideNarrow,
  ArrowUp,
  BookOpen,
  CheckCheck,
  Copy,
  Edit,
  Feather,
  //   Globe,
  Heading1, // Added Heading1 icon
  PencilLine,
  PencilRuler,
  Smile,
  X,
} from "lucide-react";
import { addAIHighlight, getPrevText } from "novel";
import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { POLISH_STYLES } from "../../lib/prompts";
import { Button } from "../tailwind/ui/button";
import { Command, CommandInput } from "../tailwind/ui/command";
import CrazySpinner from "../tailwind/ui/icons/crazy-spinner";
import Magic from "../tailwind/ui/icons/magic";
import { ScrollArea } from "../tailwind/ui/scroll-area";

const aiTools = [
  { name: "扩写", icon: PencilLine, option: "longer" },
  { name: "改写", icon: PencilRuler, option: "improve" },
  { name: "缩写", icon: ArrowDownWideNarrow, option: "shorter" }, // Add shorter
  { name: "纠错", icon: CheckCheck, option: "fix" }, // Add fix
  // { name: "自定义描写", icon: PenTool, option: "zap" }, // 'zap' will be handled by the input field
  { name: "续写", icon: Edit, option: "continue" }, // Map to 'continue'
  { name: "生成标题", icon: Heading1, option: "generate_title" }, // Added Generate Title
  // Keep other tools for potential future implementation, but without 'option' for now
  { name: "AI起名", icon: Smile },
  { name: "卡文锦囊", icon: Feather },
  { name: "开书灵感", icon: BookOpen },
  //   { name: "AI助手", icon: Globe }, // This could potentially be the 'zap' command trigger? Or a general chat?
];

// Define props type
interface CompleteOptions {
  body: {
    option: string;
    command?: string;
  };
}

interface AiToolboxDialogContentProps {
  editor: TiptapEditor; // Use the correctly imported type
  onClose: () => void;
}

export function AiToolboxDialogContent({ editor, onClose }: AiToolboxDialogContentProps) {
  const [inputValue, setInputValue] = useState(""); // For general custom commands
  const [continuationInputValue, setContinuationInputValue] = useState(""); // For story continuation input
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInputtingForContinue, setIsInputtingForContinue] = useState(false);
  const [contextForContinue, setContextForContinue] = useState("");
  const [showPolishOptions, setShowPolishOptions] = useState(false); // New state for polish options
  const [polishContextText, setPolishContextText] = useState(""); // Store text for polishing
  const [_currentOperation, setCurrentOperation] = useState<string | null>(null); // Track the current operation

  // 滚动到选中文本的函数
  const scrollToSelection = () => {
    const mainContentArea = document.getElementById("main-content-area");
    if (!mainContentArea || !editor?.state.selection || editor.state.selection.empty) return;

    try {
      const { from } = editor.state.selection;
      const domRef = editor.view.domAtPos(from);
      let elementToScroll = domRef.node;

      if (elementToScroll.nodeType === Node.TEXT_NODE) {
        elementToScroll = elementToScroll.parentElement;
      }

      if (elementToScroll instanceof HTMLElement) {
        const elementRect = elementToScroll.getBoundingClientRect();
        const mainRect = mainContentArea.getBoundingClientRect();

        // 计算需要滚动的位置
        const scrollTop = mainContentArea.scrollTop + (elementRect.top - mainRect.top);

        // 确保有足够的底部空间来滚动
        const viewportHeight = mainContentArea.clientHeight;
        mainContentArea.style.paddingBottom = `${viewportHeight}px`;

        // 执行滚动
        requestAnimationFrame(() => {
          mainContentArea.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: "smooth",
          });

          // 添加延时滚动以处理可能的布局变化
          setTimeout(() => {
            mainContentArea.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: "smooth",
            });
          }, 100);
        });
      }
    } catch (e) {
      console.error("Error in scrollToSelection:", e);
    }
  };
  const [_isVisible, _setIsVisible] = useState(true); // 添加可见性状态
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedBg] = useLocalStorage<string>("novel__background-color", "white");
  const [aiHighlightEnabled] = useLocalStorage<boolean>("novel__ai-highlight-enabled", true);
  const [customPolishStyle, setCustomPolishStyle] = useState(""); // State for custom polish style input

  const complete = async (text: string, options?: CompleteOptions) => {
    setIsLoading(true);
    setCompletion("");
    setCurrentOperation(options?.body.option || null); // Set current operation
    // Don't clear input value here, let the user decide
    // setInputValue("");

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      if (aiHighlightEnabled) {
        addAIHighlight(editor); // Highlight the text being processed
      }
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          ...options?.body,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        toast.error("请求失败, 服务器繁忙,请稍后重试");
        editor.chain().unsetHighlight().run();
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          try {
            const chunk = JSON.parse(line);
            const content = chunk.choices[0]?.delta?.content || "";
            setCompletion((prev) => prev + content);
          } catch (e) {
            console.error("Error parsing stream data:", e, line);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("AI request failed:", err);
        toast.error("请求失败, 服务器繁忙,请稍后重试");
        editor.chain().unsetHighlight().run();
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      // Keep highlight until user interacts (replace/discard)
    }
  };

  const handleToolClick = (option: string) => {
    let text = "";
    const { from, empty } = editor.state.selection;
    const editorInstance = editor;

    if (!editorInstance) {
      toast.error("编辑器实例未找到。");
      return;
    }

    // 执行滚动
    scrollToSelection();

    if (option === "improve") {
      if (empty) {
        toast.error("请先选中文本以进行改写");
        return;
      }
      try {
        const slice = editor.state.selection.content();
        text = editor.storage.markdown.serializer.serialize(slice.content);
      } catch (_e) {
        toast.error("获取选中文本失败。");
        return;
      }
      if (!text) {
        toast.error("选中文本内容为空。");
        return;
      }
      setPolishContextText(text);
      setShowPolishOptions(true);
      setCompletion(""); // Clear previous completion
      return; // Don't call complete yet, show style options
    }

    if (option === "generate_title") {
      // For "generate_title", get the entire document content
      try {
        text = editorInstance.getText(); // Get plain text content
      } catch (_e) {
        toast.error("获取编辑器内容失败。");
        return;
      }
      if (!text || text.trim().length < 10) {
        // Require some minimum content
        toast.error("编辑器内容太少，无法生成标题。");
        return;
      }
      // No need to set context or show options, directly call complete
      complete(text, { body: { option } });
      return; // Exit after handling
    }

    if (option === "continue") {
      // For "continue", we always get preceding text, selection is not mandatory for context.
      try {
        const previousTextWithHtml = getPrevText(editor, from); // Use 'from' for context
        if (!previousTextWithHtml) {
          toast.error("未能获取到前文内容以进行续写。");
          return;
        }
        let plainText = "";
        if (typeof document !== "undefined") {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = previousTextWithHtml;
          plainText = tempDiv.textContent || tempDiv.innerText || "";
        } else {
          plainText = previousTextWithHtml
            .replace(/<[^>]*>/g, "")
            .replace(/\s+/g, " ")
            .trim();
        }

        if (!plainText || plainText.trim() === "") {
          toast.error("未能获取到有效的前文内容以进行续写。请确保光标前有足够的文本。");
          return;
        }
        setContextForContinue(plainText.trim());
        setIsInputtingForContinue(true); // Show input for continuation
        setContinuationInputValue(""); // Clear previous continuation input
        setCompletion(""); // Clear any previous completion
        return; // Don't call complete yet
      } catch (error) {
        console.error("Failed to get previous text for 'continue' action:", error);
        toast.error("获取前文内容时发生错误，请重试。");
        return;
      }
    } else {
      // For other tools (excluding generate_title and continue), selected text is usually required
      if (empty) {
        toast.error("请先选中文本");
        return;
      }
      try {
        const slice = editor.state.selection.content();
        text = editor.storage.markdown.serializer.serialize(slice.content);
      } catch (_e) {
        toast.error("获取选中文本失败。");
        return;
      }
      if (!text) {
        toast.error("选中文本内容为空。");
        return;
      }
    }

    complete(text, { body: { option } });
  };

  const handlePolishSubmit = (style: string) => {
    setShowPolishOptions(false);
    complete(polishContextText, { body: { option: "improve", command: style } });
  };

  const handleContinueSubmit = () => {
    complete(contextForContinue, {
      body: { option: "continue", command: continuationInputValue },
    });
    // setIsInputtingForContinue(false); // Keep it true to see loading/completion
    // setContinuationInputValue(""); // Clear after successful submission or if user cancels
  };

  const handleCustomPolishSubmit = () => {
    if (!customPolishStyle.trim()) {
      toast.error("请输入自定义改写风格");
      return;
    }
    setShowPolishOptions(false); // Hide options after submission
    complete(polishContextText, { body: { option: "improve", command: customPolishStyle } });
    // Optionally clear the input after submission, or keep it if user might reuse
    // setCustomPolishStyle("");
  };

  const handleCustomSubmit = () => {
    const slice = editor.state.selection.content();
    const text = editor.storage.markdown.serializer.serialize(slice.content);

    if (!inputValue) {
      toast.error("请输入自定义指令");
      return;
    }

    // Use selected text if available, otherwise prompt might be empty if user only provides command
    const prompt = text || "";
    const command = inputValue;

    complete(prompt, {
      body: { option: "zap", command: command },
    });
  };

  const hasCompletion = completion.length > 0;

  const handleCloseDialog = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsInputtingForContinue(false);
    setContinuationInputValue("");
    setContextForContinue("");
    setInputValue("");
    setCompletion(""); // Clear completion on close
    setShowPolishOptions(false); // Clear polish options on close
    setPolishContextText(""); // Clear polish context text
    setCustomPolishStyle(""); // Clear custom polish style input
    editor.chain().unsetHighlight().run(); // Ensure highlight is removed
    onClose();
  };

  const handleDiscardCompletion = () => {
    editor.chain().unsetHighlight().run();
    setCompletion("");
    setCurrentOperation(null); // Reset current operation
    // If discarding a continuation, allow re-input or go back
    // For now, just clears completion. If it was a continuation, the input field will reappear.
    // If it was a general tool, the tool buttons will reappear.
    // If it was a polish, the polish options should reappear or go back to tools
    if (polishContextText) {
      // If polishContextText is set, it means we were in polish mode
      setShowPolishOptions(true); // Re-show polish options
    }
  };

  // Effect to clear continuation input when dialog is closed externally or completion is done
  useEffect(() => {
    if (!isLoading && hasCompletion && isInputtingForContinue) {
      // If a continuation was successful and has completion,
      // we might want to clear the input or keep it for further refinement.
      // For now, let's clear it.
      // setContinuationInputValue("");
      // setIsInputtingForContinue(false); // Or keep it true if user might want to retry with different input
    }
  }, [isLoading, hasCompletion, isInputtingForContinue]);

  // Effect to handle dialog open and scroll position
  useEffect(() => {
    // 组件挂载时执行滚动
    scrollToSelection();

    return () => {
      const mainContentArea = document.getElementById("main-content-area");
      if (mainContentArea) {
        mainContentArea.style.paddingBottom = "";
      }
    };
  }, [editor]); // 当 editor 改变时重新执行

  // 单独处理 padding
  useEffect(() => {
    const adjustPadding = () => {
      const mainContentArea = document.getElementById("main-content-area");
      const toolboxHeight = document.querySelector(".ai-toolbox-command")?.clientHeight || 0;

      if (mainContentArea && toolboxHeight > 0) {
        mainContentArea.style.paddingBottom = `${toolboxHeight + 16}px`;
      }
    };

    // 初始调整和延时调整
    adjustPadding();
    const timeoutId = setTimeout(adjustPadding, 100);

    return () => {
      clearTimeout(timeoutId);
      const mainContentArea = document.getElementById("main-content-area");
      if (mainContentArea) {
        mainContentArea.style.paddingBottom = "";
      }
    };
  }, []); // 只在组件挂载时执行一次

  return (
    <Command
      className={`app-dialog-theme fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full h-auto px-4 pt-4 pb-0 rounded-t-lg shadow-xl z-50 border-[color:var(--app-divider-border)] ${APP_THEME_COLORS.find((tc) => tc.value === selectedBg)?.applyClass || "bg-white"}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-12">
          {" "}
          {/* Increased width for back button */}
          {(isInputtingForContinue || showPolishOptions) && !isLoading && !hasCompletion && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsInputtingForContinue(false);
                setContinuationInputValue("");
                setContextForContinue("");
                setShowPolishOptions(false);
                setPolishContextText("");
              }}
              className="p-1 text-xs"
            >
              返回
            </Button>
          )}
        </div>
        <h2 className="text-sm font-semibold text-[color:var(--app-title-color)] text-center">
          {isInputtingForContinue && !isLoading && !hasCompletion
            ? "请输入后续剧情简述"
            : showPolishOptions && !isLoading && !hasCompletion
              ? "选择改写风格"
              : "AI工具箱"}
        </h2>
        <button
          type="button"
          onClick={handleCloseDialog}
          className="p-1 rounded-full hover:bg-[color:var(--app-hover-bg)]"
        >
          <X className="h-5 w-5 text-[color:var(--app-icon-color)]" />
        </button>
      </div>

      {/* Completion Result Area */}
      {hasCompletion && !isLoading && (
        <div className="flex flex-col mb-12">
          <ScrollArea className="p-2 px-4 max-h-[200px] border border-border rounded-md overflow-y-auto bg-[color:var(--app-card-bg)]">
            <div className="prose prose-sm dark:prose-invert max-w-full">
              <Markdown>{completion}</Markdown>
            </div>
          </ScrollArea>
          <div className="flex justify-end space-x-2 px-2 pt-2 pb-0">
            {/* Common Buttons */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardCompletion}
              className="bg-transparent text-[color:var(--app-text-color)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-title-color)]"
            >
              <X className="h-4 w-4 mr-1" />
              放弃
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                editor.chain().insertContentAt(editor.state.selection.to, `${completion}`).unsetHighlight().run();
                handleCloseDialog();
              }}
              className="bg-transparent text-[color:var(--app-text-color)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-title-color)]"
            >
              <ArrowDownWideNarrow className="h-4 w-4 mr-1" />
              插入
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                editor.chain().deleteSelection().insertContent(completion).unsetHighlight().run();
                handleCloseDialog();
              }}
              className="bg-transparent text-[color:var(--app-text-color)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-title-color)]"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              替换
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const normalizedText = completion.replace(/\n+/g, "\n");
                copyToClipboard(normalizedText);
              }}
              className="bg-transparent text-[color:var(--app-text-color)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-title-color)]"
            >
              <Copy className="h-4 w-4 mr-1" />
              复制
            </Button>

            {/* Conditional Buttons based on operation */}
            {/* {currentOperation !== "generate_title" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    editor.chain().insertContentAt(editor.state.selection.to, `${completion}`).unsetHighlight().run();
                    handleCloseDialog();
                  }}
                  className="bg-transparent text-muted-foreground hover:bg-[color:var(--ai-interactive-hover-bg)] hover:text-foreground"
                >
                  <ArrowDownWideNarrow className="h-4 w-4 mr-1" />
                  插入
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    editor.chain().deleteSelection().insertContent(completion).unsetHighlight().run();
                    handleCloseDialog();
                  }}
                  className="bg-transparent text-muted-foreground hover:bg-[color:var(--ai-interactive-hover-bg)] hover:text-foreground"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  替换
                </Button>
              </>
            )} */}
            {/* Add specific button for applying title if needed later */}
            {/* Example:
            {currentOperation === "generate_title" && (
              <Button variant="outline" size="sm" onClick={handleApplyTitle}>
                 应用标题
              </Button>
            )}
             */}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex h-12 w-full items-center justify-center px-4 text-sm font-medium text-muted-foreground mb-12 text-[color:var(--ai-loading-color)]">
          <Magic className="mr-2 h-4 w-4 shrink-0" />
          思考中
          <div className="ml-2 mt-1">
            <CrazySpinner />
          </div>
        </div>
      )}

      {/* Continuation Input Area */}
      {!isLoading && !hasCompletion && isInputtingForContinue && (
        <div className="relative mb-12">
          <textarea
            value={continuationInputValue}
            onChange={(e) => setContinuationInputValue(e.target.value)}
            placeholder="（选填）将根据输入内容进行续写......"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Stop propagation to prevent Command component from handling Enter key
                // This allows textarea to perform its default action (newline) for Enter.
                // Shift+Enter will also result in a newline by default.
                e.stopPropagation();
              }
            }}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none pr-10" // Added resize-none and styles similar to Shadcn Input/Textarea
            rows={3} // Start with 3 rows
          />
          <Button
            size="icon"
            className="absolute right-2 top-2 h-6 w-6 rounded-full bg-purple-500 hover:bg-purple-900" // Adjusted top position for textarea
            onClick={handleContinueSubmit}
            disabled={isLoading}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Tool Buttons Area (Hide when loading, showing completion, or inputting for continue) */}
      {!isLoading && !hasCompletion && !isInputtingForContinue && !showPolishOptions && (
        <div className="flex flex-wrap justify-center mb-4">
          {" "}
          {/* Added mb-4 for spacing before custom input */}
          {aiTools.map((tool) => (
            <button
              type="button"
              key={tool.name}
              onClick={() => tool.option && handleToolClick(tool.option)}
              disabled={!tool.option || isLoading}
              className="flex flex-col items-center mx-1.5 my-1 p-2 rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              title={tool.name}
            >
              <tool.icon className="h-6 w-6 text-[color:var(--app-button-color)]" />
              <span className="text-xs text-muted-foreground mt-1.5 text-center overflow-hidden text-ellipsis block whitespace-nowrap w-14">
                {tool.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Polish Style Options Area */}
      {!isLoading && !hasCompletion && showPolishOptions && (
        <div className="flex flex-wrap justify-center mb-4">
          {POLISH_STYLES.map((style) => (
            <Button
              key={style.style}
              variant="outline"
              size="sm"
              onClick={() => handlePolishSubmit(style.style)}
              className="m-1 bg-transparent text-[color:var(--app-text-color)] hover:bg-[color:var(--app-hover-bg)] hover:text-[color:var(--app-title-color)]"
            >
              {style.name}
            </Button>
          ))}
          {/* Custom Polish Style Input */}
          <div className="mt-4 flex w-full items-center space-x-2">
            {" "}
            {/* Ensure full width */}
            <input
              type="text"
              placeholder="或输入自定义风格..."
              value={customPolishStyle}
              onChange={(e) => setCustomPolishStyle(e.target.value)}
              className="flex mb-8 h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1" // Basic input styling from Shadcn
              onKeyDown={(e) => {
                // Submit on Enter key press (if not Shift+Enter)
                if (e.key === "Enter" && !e.shiftKey && customPolishStyle.trim()) {
                  e.preventDefault(); // Prevent default Enter behavior (like newline in some contexts)
                  handleCustomPolishSubmit();
                }
              }}
              disabled={isLoading} // Disable input while loading
            />
            <Button
              size="sm"
              onClick={handleCustomPolishSubmit}
              disabled={!customPolishStyle.trim() || isLoading} // Disable button if input is empty or loading
              className="mb-8 bg-purple-500 hover:bg-purple-600 text-white px-4" // Added padding for better look
            >
              应用
            </Button>
          </div>
        </div> // Close the container div started at line 541
      )}

      {/* Custom Input Area (Hide when loading, showing completion, or inputting for continue or polish options) */}
      {!isLoading && !hasCompletion && !isInputtingForContinue && !showPolishOptions && (
        <div className="relative mb-12">
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            placeholder={hasCompletion ? "基于结果继续提问..." : "请输入你想咨询的问题..."}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                handleCustomSubmit();
              }
            }}
          />
          <Button
            size="icon"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
            onClick={handleCustomSubmit}
            disabled={isLoading || !inputValue.trim()}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      )}
    </Command>
  );
}
