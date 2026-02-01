"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Settings2,
  Check,
  ChevronsUpDown,
  History,
  ChevronLeft,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AISettingsDialog } from "./AISettingsDialog";
import { useAIModels, AIModel } from "@/hooks/ai/useAIModels";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import {
  AssistantRuntimeProvider,
  useChatRuntimeContext,
} from "@/components/assistant-ui/assistant-runtime-provider";
import type { RuntimeConfig } from "@/lib/ai/runtime";

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
      <div className="flex items-center justify-between p-2 border-b border-border/10 bg-background/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
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
                className="h-7 text-xs bg-primary/5 border-0 rounded-lg px-2 focus:ring-0 focus:ring-offset-0 justify-between font-normal hover:bg-primary/10 hover:text-foreground min-w-[140px]"
              >
                <div className="flex items-center truncate">
                  <Bot className="h-3.5 w-3.5 mr-1.5 opacity-70 shrink-0" />
                  <span className="truncate max-w-[100px]">
                    {selectedModel
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
                        onSelect={(currentValue) => {
                          setSelectedModel(
                            currentValue === selectedModel ? "" : model.value
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

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center h-7 w-7 rounded-lg bg-primary/5 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors duration-200"
          title="AI 设置"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {currentSessionId ? (
          <Thread />
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
  const [selectedModel, setSelectedModel] = useState("gpt-3.5-turbo");
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

  const handleSaveSettings = (key: string, url: string) => {
    setApiKey(key);
    setBaseUrl(url);
    localStorage.setItem("ai_api_key", key);
    localStorage.setItem("ai_base_url", url);
  };

  const { models } = useAIModels(apiKey, baseUrl);
  const modelOptions: AIModel[] = models;

  // If selected model is not in options, select first one
  useEffect(() => {
    if (modelOptions.length > 0) {
      if (!modelOptions.find((m: AIModel) => m.value === selectedModel)) {
        setSelectedModel(modelOptions[0].value);
      }
    } else {
      setSelectedModel("");
    }
  }, [modelOptions, selectedModel]);

  // 构建 runtime 配置
  const runtimeConfig: RuntimeConfig = {
    model: selectedModel,
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
