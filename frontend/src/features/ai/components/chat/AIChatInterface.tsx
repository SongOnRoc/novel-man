"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Settings2,
  Check,
  ChevronsUpDown,
  History,
  ChevronLeft,
  MessageSquarePlus,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import {
  AssistantRuntimeProvider,
  useChatRuntimeContext,
} from "@/components/assistant-ui/assistant-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getSelectedPromptId } from "@/features/ai/components/prompt-selector/useSelectedPromptStore";
import { useAIModels, AIModel } from "@/hooks/ai/useAIModels";
import type { RuntimeConfig } from "@/lib/ai/runtime";
import { cn } from "@/lib/utils";

import { AISettingsDialog } from "./AISettingsDialog";

const SELECTED_MODEL_CACHE_KEY = "ai_selected_model";

interface AIChatInterfaceProps {
  workId?: number;
  characterIds?: number[];
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
  className?: string;
  hideBorder?: boolean;
}

// =============================================================================
// 内部内容组件（在 Provider 内部使用）
// =============================================================================

interface AIChatInterfaceContentProps {
  className?: string;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  openModelSelect: boolean;
  setOpenModelSelect: (open: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  modelOptions: AIModel[];
  isModelsLoading: boolean;
  selectedText?: string;
  onApplyToEditor?: (text: string) => void;
}

function AIChatInterfaceContent({
  className,
  showSettings,
  setShowSettings,
  showHistory,
  setShowHistory,
  openModelSelect,
  setOpenModelSelect,
  selectedModel,
  setSelectedModel,
  modelOptions,
  isModelsLoading,
  selectedText,
  onApplyToEditor,
}: AIChatInterfaceContentProps) {
  // 从 Context 获取会话管理函数
  const { switchToSession, createNewSession, currentSessionId } =
    useChatRuntimeContext();

  // 处理会话切换
  const handleSessionSwitch = useCallback(
    (sessionId: string) => {
      switchToSession(sessionId);
      setShowHistory(false);
    },
    [switchToSession, setShowHistory]
  );

  // 处理创建新会话
  const handleCreateSession = useCallback(() => {
    const newId = createNewSession();
    setShowHistory(false);
    return newId;
  }, [createNewSession, setShowHistory]);

  return (
    <>
      {/* Header Area */}
      <div className="z-20 flex items-center justify-between gap-1.5 border-b border-border/10 bg-background/40 p-2 backdrop-blur-sm">
        <div className="order-1 flex min-w-0 flex-1 items-center gap-1.5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "flex items-center justify-center h-7 w-7 rounded-lg transition-colors duration-200",
              showHistory
                ? "bg-primary/10 text-primary"
                : "bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary"
            )}
            title={showHistory ? "关闭历史" : "历史会话"}
          >
            <History className="h-4 w-4" />
          </button>

          {/* Model Selector */}
          <Popover open={openModelSelect} onOpenChange={setOpenModelSelect}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                role="combobox"
                aria-expanded={openModelSelect}
                className="h-8 min-w-0 max-w-[72px] justify-between rounded-lg border-0 bg-primary/5 px-1.5 text-xs font-normal hover:bg-primary/10 hover:text-foreground focus:ring-0 focus:ring-offset-0 sm:max-w-[96px] lg:max-w-[120px] xl:max-w-[140px]"
              >
                <div className="flex min-w-0 items-center truncate">
                  <Bot className="h-3.5 w-3.5 mr-1.5 opacity-70 shrink-0" />
                  <span className="truncate">
                    {isModelsLoading
                      ? "加载模型中..."
                      : selectedModel
                        ? modelOptions.find(
                            (model) => model.value === selectedModel
                          )?.label || selectedModel
                        : "请配置模型接口"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[260px] p-0 rounded-2xl shadow-2xl border-border/10 bg-background/80 backdrop-blur-xl overflow-hidden ring-1 ring-black/5 max-h-[320px]"
              side="bottom"
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <Command className="bg-transparent h-full flex flex-col">
                <div className="shrink-0 p-1">
                  <CommandInput
                    placeholder="搜索模型..."
                    className="h-9 text-xs border-none bg-muted/30 rounded-lg px-2 focus:ring-0"
                  />
                </div>
                <CommandList className="flex-1 overflow-y-auto py-1 px-1 scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent">
                  <CommandEmpty className="py-8 text-xs text-center text-muted-foreground/60 flex flex-col items-center gap-2">
                    <Bot className="h-8 w-8 opacity-20" />
                    <span>
                      {modelOptions.length === 0
                        ? "请先在设置中配置模型"
                        : "未找到相关模型"}
                    </span>
                  </CommandEmpty>
                  <CommandGroup>
                    {modelOptions.map((model) => (
                      <CommandItem
                        key={model.value}
                        value={model.value}
                        onSelect={() => {
                          setSelectedModel(model.value);
                          localStorage.setItem(
                            SELECTED_MODEL_CACHE_KEY,
                            model.value
                          );
                          setOpenModelSelect(false);
                        }}
                        className="text-xs py-2.5 px-3 mx-0.5 mb-1 rounded-xl aria-selected:bg-primary/10 aria-selected:text-primary cursor-pointer transition-all duration-200 group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between w-full z-10 relative">
                          <span className="font-medium opacity-80 group-aria-selected:opacity-100 break-words whitespace-normal pr-2">
                            {model.label}
                          </span>
                          {selectedModel === model.value && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            >
                              <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                            </motion.div>
                          )}
                        </div>
                        {selectedModel === model.value && (
                          <motion.div
                            layoutId="activeModel"
                            className="absolute inset-0 bg-primary/5 z-0"
                            initial={false}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                          />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                {modelOptions.length === 0 && (
                  <div className="p-2 border-t border-border/5 bg-muted/20 backdrop-blur-sm shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-9 text-xs justify-center px-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                      onClick={() => {
                        setShowSettings(true);
                        setOpenModelSelect(false);
                      }}
                    >
                      <Settings2 className="mr-2 h-3.5 w-3.5" />
                      配置模型接口
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-1">
          <button
            onClick={handleCreateSession}
            className="flex h-8 items-center justify-center gap-1 rounded-md border border-border/60 bg-primary/5 px-2 text-xs font-medium text-foreground/85 transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
            title="新建会话"
            aria-label="新建会话"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span className="hidden xl:inline">新建</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/5 text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-primary"
            title="AI 设置"
            aria-label="AI 设置"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {currentSessionId ? (
          <Thread
            selectedText={selectedText}
            onApplyToEditor={onApplyToEditor}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-background/60 backdrop-blur-sm z-40"
                onClick={() => setShowHistory(false)}
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-background border-r border-border/10 shadow-2xl z-50 flex flex-col"
              >
                <div className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      历史会话
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full hover:bg-muted"
                      onClick={() => setShowHistory(false)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <ThreadList
                    onSelect={() => setShowHistory(false)}
                    onSessionSwitch={handleSessionSwitch}
                    onCreateSession={handleCreateSession}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// =============================================================================
// 主组件（包含 Provider）
// =============================================================================

export function AIChatInterface({
  workId,
  characterIds,
  selectedText,
  onApplyToEditor,
  className,
  hideBorder = false,
}: AIChatInterfaceProps) {
  const [selectedModel, setSelectedModel] = useState("");
  const [cachedModel, setCachedModel] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [openModelSelect, setOpenModelSelect] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const storedApiKey = localStorage.getItem("ai_api_key");
    const storedBaseUrl = localStorage.getItem("ai_base_url");
    if (storedApiKey) setApiKey(storedApiKey);
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);
  }, []);

  useEffect(() => {
    setCachedModel(localStorage.getItem(SELECTED_MODEL_CACHE_KEY));
  }, []);

  const handleSaveSettings = (key: string, url: string) => {
    setApiKey(key);
    setBaseUrl(url);
    localStorage.setItem("ai_api_key", key);
    localStorage.setItem("ai_base_url", url);
  };

  const { models, isLoading: isModelsLoading } = useAIModels(apiKey, baseUrl);
  const modelOptions: AIModel[] = models;

  // 模型初始化策略：加载中不覆盖；优先缓存；其次首项；空列表提示配置
  useEffect(() => {
    if (isModelsLoading) return;

    if (modelOptions.length === 0) {
      if (selectedModel !== "") {
        setSelectedModel("");
      }
      return;
    }

    if (modelOptions.some((m: AIModel) => m.value === selectedModel)) {
      return;
    }

    if (cachedModel && modelOptions.some((m: AIModel) => m.value === cachedModel)) {
      setSelectedModel(cachedModel);
      return;
    }

    setSelectedModel(modelOptions[0].value);
  }, [modelOptions, selectedModel, cachedModel, isModelsLoading]);

  // 构建 runtime 配置
  const runtimeConfig: RuntimeConfig = {
    model: selectedModel,
    getSelectedPromptId,
    selectedText,
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-full overflow-hidden bg-transparent",
        className
      )}
    >
      <AssistantRuntimeProvider config={runtimeConfig}>
        <AIChatInterfaceContent
          className={className}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          openModelSelect={openModelSelect}
          setOpenModelSelect={setOpenModelSelect}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          modelOptions={modelOptions}
          isModelsLoading={isModelsLoading}
          selectedText={selectedText}
          onApplyToEditor={onApplyToEditor}
        />
      </AssistantRuntimeProvider>

      <AISettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        initialApiKey={apiKey}
        initialBaseUrl={baseUrl}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
