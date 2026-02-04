"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, PanInfo, AnimatePresence } from "framer-motion";
import {
  X,
  History,
  Settings2,
  Bot,
  Check,
  ChevronDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { AISettingsDialog } from "../chat/AISettingsDialog";
import {
  AssistantRuntimeProvider,
  useChatRuntimeContext,
} from "@/components/assistant-ui/assistant-runtime-provider";
import type { RuntimeConfig } from "@/lib/ai/runtime";
import { getSelectedPromptId, clearSelectedPrompt } from "@/features/ai/components/prompt-selector/useSelectedPromptStore";
import { useAIModels, type AIModel } from "@/hooks/ai/useAIModels";
import type { EditorTheme } from "@/types/editor";

interface MobileAIImmersiveProps {
  /** Currently selected text from editor */
  selectedText?: string;
  /** Callback when AI content should be applied to editor */
  onApplyToEditor?: (text: string) => void;
  /** Callback to close immersive mode */
  onClose: () => void;
  /** Callback when user swipes down to close */
  onSwipeDown: () => void;
  /** Optional work ID for context */
  workId?: number;
  /** Optional character IDs for context */
  characterIds?: number[];
  /** Current viewport height */
  viewportHeight: number;
  /** Whether keyboard is visible */
  isKeyboardVisible: boolean;
  /** Keyboard height in pixels */
  keyboardHeight: number;
  /** Editor theme for styling */
  theme?: EditorTheme;
}

/**
 * Mobile AI Immersive Mode
 *
 * Full-screen conversation interface with:
 * - Header with history, settings, and close buttons
 * - Scrollable conversation thread
 * - Swipe-down gesture to close (when scrolled to top)
 * - Theme inheritance from editor
 */
interface MobileAIImmersiveContentProps
  extends Omit<MobileAIImmersiveProps, "workId" | "characterIds"> {
  /** Available models list */
  models: AIModel[];
  /** Currently selected model */
  selectedModel: string;
  /** Callback to change selected model */
  onModelChange: (model: string) => void;
}

function MobileAIImmersiveContent({
  selectedText,
  onApplyToEditor,
  onClose,
  onSwipeDown,
  viewportHeight,
  isKeyboardVisible,
  keyboardHeight,
  theme = "default",
  models,
  selectedModel,
  onModelChange,
}: MobileAIImmersiveContentProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelSheet, setShowModelSheet] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [isAtTop, setIsAtTop] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter models based on search query
  const filteredModels = models.filter(
    (model) =>
      model.label.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      model.value.toLowerCase().includes(modelSearchQuery.toLowerCase())
  );

  // Reset search when sheet closes
  useEffect(() => {
    if (!showModelSheet) {
      setModelSearchQuery("");
    }
  }, [showModelSheet]);

  const { switchToSession, createNewSession, currentSessionId } =
    useChatRuntimeContext();

  // Track scroll position to enable swipe-down close only at top
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setIsAtTop(target.scrollTop <= 5);
  }, []);

  // Handle drag end for swipe-down gesture
  const handleDragEnd = (_: any, info: PanInfo) => {
    // Only close if scrolled to top and swiped down with sufficient velocity/distance
    if (isAtTop && (info.velocity.y > 200 || info.offset.y > 100)) {
      onSwipeDown();
    }
  };

  // Calculate content height based on keyboard
  const contentHeight = isKeyboardVisible
    ? viewportHeight - keyboardHeight
    : viewportHeight;

  // Session handlers
  const handleSessionSwitch = useCallback(
    (sessionId: string) => {
      switchToSession(sessionId);
      setShowHistory(false);
    },
    [switchToSession]
  );

  const handleCreateSession = useCallback(() => {
    const newId = createNewSession();
    setShowHistory(false);
    return newId;
  }, [createNewSession]);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      drag={isAtTop ? "y" : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.3 }}
      onDragEnd={handleDragEnd}
      className={cn(
        "fixed inset-0 z-50",
        //使用主题类继承编辑器主题颜色
        `theme-${theme}`,
        "editor-paper",
        "flex flex-col",
        "mobile-immersive"
      )}
      style={{ height: contentHeight }}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-3 h-12 border-b border-foreground/10">
        <div className="flex items-center gap-1">
          {/* History Button */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "touch-target flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "transition-colors",
              showHistory
                ? "bg-foreground/10 text-foreground"
                : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
            )}
            aria-label={showHistory ? "关闭历史" : "历史会话"}
          >
            <History className="h-5 w-5" />
          </button>

          {/* Model Selector Button */}
          <button
            onClick={() => setShowModelSheet(true)}
            className={cn(
              "touch-target flex items-center gap-1.5",
              "h-10 px-3 rounded-full",
              "bg-foreground/5 text-foreground/80",
              "transition-colors",
              "hover:bg-foreground/10"
            )}
            aria-label="选择模型"
          >
            <Bot className="h-4 w-4 shrink-0" />
            <span className="text-sm truncate max-w-[100px]">
              {selectedModel
                ? models.find((m) => m.value === selectedModel)?.label ||
                  selectedModel.split("/").pop()
                : "选择模型"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className={cn(
              "touch-target flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
              "transition-colors"
            )}
            aria-label="AI设置"
          >
            <Settings2 className="h-5 w-5" />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className={cn(
              "touch-target flex items-center justify-center",
              "h-10 w-10 rounded-full",
              "text-foreground/60 hover:text-foreground hover:bg-foreground/5",
              "transition-colors"
            )}
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-hidden relative"
      >
        {currentSessionId ? (
          <Thread
            selectedText={selectedText}
            onApplyToEditor={onApplyToEditor}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground/30 border-t-foreground/70" />
          </div>
        )}

        {/* History Drawer */}
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/10 backdrop-blur-sm z-40"
              onClick={() => setShowHistory(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "absolute inset-y-0 left-0 w-[85%] max-w-[320px] z-50",
                `theme-${theme}`,
                "editor-paper",
                "border-r border-foreground/10 shadow-2xl"
              )}
            >
              <div className="p-4 h-full overflow-y-auto">
                <h3 className="text-sm font-medium text-foreground/60 mb-4">
                  历史会话
                </h3>
                <ThreadList
                  onSelect={() => setShowHistory(false)}
                  onSessionSwitch={handleSessionSwitch}
                  onCreateSession={handleCreateSession}
                />
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Model Selection Bottom Sheet */}
      <AnimatePresence>
        {showModelSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setShowModelSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={cn(
                "fixed bottom-0 inset-x-0 z-[70]",
                `theme-${theme}`,
                "editor-paper",
                "rounded-t-2xl shadow-2xl",
                "max-h-[70vh] flex flex-col"
              )}
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 16px)",
              }}
            >
              {/* Sheet Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-foreground/20" />
              </div>

              {/* Sheet Header with Search */}
              <div className="px-4 pb-3 border-b border-foreground/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">
                    选择模型
                  </h3>
                  <p className="text-sm text-foreground/50">
                    {models.length > 0
                      ? `${filteredModels.length}/${models.length}`
                      : ""}
                  </p>
                </div>
                {/* Search Input */}
                {models.length > 3 && (
                  <div className="mt-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                    <input
                      type="text"
                      value={modelSearchQuery}
                      onChange={(e) => setModelSearchQuery(e.target.value)}
                      placeholder="搜索模型..."
                      className={cn(
                        "w-full pl-9 pr-3 py-2.5 rounded-xl",
                        "bg-foreground/5 text-foreground text-sm",
                        "placeholder:text-foreground/40",
                        "border border-foreground/10",
                        "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                        "transition-colors"
                      )}
                    />
                    {modelSearchQuery && (
                      <button
                        onClick={() => setModelSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Model List */}
              <div className="flex-1 overflow-y-auto p-2">
                {models.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-foreground/50">
                    <Bot className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">未找到可用模型</p>
                    <button
                      onClick={() => {
                        setShowModelSheet(false);
                        setShowSettings(true);
                      }}
                      className="mt-3 text-sm text-primary underline"
                    >
                      去配置 API
                    </button>
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-foreground/50">
                    <Search className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">未找到匹配的模型</p>
                    <button
                      onClick={() => setModelSearchQuery("")}
                      className="mt-3 text-sm text-primary underline"
                    >
                      清除搜索
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredModels.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          onModelChange(model.value);
                          setShowModelSheet(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between",
                          "px-4 py-3 rounded-xl",
                          "text-left transition-colors",
                          selectedModel === model.value
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-foreground/5 text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Bot className="h-5 w-5 shrink-0 opacity-70" />
                          <span className="text-sm font-medium truncate">
                            {model.label}
                          </span>
                        </div>
                        {selectedModel === model.value && (
                          <Check className="h-5 w-5 shrink-0 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sheet Footer */}
              <div className="px-4 py-3 border-t border-foreground/10">
                <button
                  onClick={() => setShowModelSheet(false)}
                  className={cn(
                    "w-full py-3 rounded-xl",
                    "bg-foreground/5 text-foreground",
                    "font-medium text-sm",
                    "transition-colors hover:bg-foreground/10"
                  )}
                >
                  取消
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Dialog */}
      <AISettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialApiKey=""
        initialBaseUrl=""
        onSave={() => {}}
      />
    </motion.div>
  );
}

/**
 * Wrapper with AssistantRuntimeProvider
 */
export function MobileAIImmersive(props: MobileAIImmersiveProps) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");

  useEffect(() => {
    const storedApiKey = localStorage.getItem("ai_api_key");
    const storedBaseUrl = localStorage.getItem("ai_base_url");
    if (storedApiKey) setApiKey(storedApiKey);
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);
  }, []);

  const { models } = useAIModels(apiKey, baseUrl);

  useEffect(() => {
    if (models.length > 0 && !models.find((m) => m.value === selectedModel)) {
      setSelectedModel(models[0].value);
    }
  }, [models, selectedModel]);

  const runtimeConfig: RuntimeConfig = {
    model: selectedModel,
    getSelectedPromptId,
    onMessageSent: clearSelectedPrompt,
  };

  return (
    <AssistantRuntimeProvider config={runtimeConfig}>
      <MobileAIImmersiveContent
        {...props}
        models={models}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </AssistantRuntimeProvider>
  );
}

export default MobileAIImmersive;
