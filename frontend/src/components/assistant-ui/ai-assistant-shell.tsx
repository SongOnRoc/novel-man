"use client";

import {
  SettingsIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
} from "lucide-react";
import { type FC, useState, useCallback } from "react";
import { useMediaQuery } from "react-responsive";

import {
  AssistantRuntimeProvider,
  useChatRuntimeContext,
} from "@/components/assistant-ui/assistant-runtime-provider";
import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { type RuntimeConfig } from "@/lib/ai/runtime";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

export interface AIAssistantShellProps {
  /** Runtime配置 */
  config?: RuntimeConfig;
  /** 是否显示线程列表（侧边栏）*/
  showThreadList?: boolean;
  /** 是否紧凑模式（用于悬浮窗/侧边栏场景）*/
  compact?: boolean;
  /** 点击设置按钮的回调 */
  onSettingsClick?: () => void;
  /** 自定义类名 */
  className?: string;
  /** 头部额外元素 */
  headerExtra?: React.ReactNode;
}

// =============================================================================
// Shell Component (without Provider)
// =============================================================================

const AIAssistantShellContent: FC<
  Omit<AIAssistantShellProps, "config"> & { currentModel?: string }
> = ({
  showThreadList = true,
  compact = false,
  onSettingsClick,
  className,
  headerExtra,
  currentModel,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const { switchToSession, createNewSession, currentSessionId } =
    useChatRuntimeContext();

  // 处理会话切换
  const handleSessionSwitch = useCallback(
    (sessionId: string) => {
      switchToSession(sessionId);
      if (isMobile) {
        setMobileSheetOpen(false);
      }
    },
    [switchToSession, isMobile]
  );

  // 处理创建新会话
  const handleCreateSession = useCallback(() => {
    return createNewSession();
  }, [createNewSession]);

  // 关闭移动端抽屉
  const handleMobileSelect = useCallback(() => {
    setMobileSheetOpen(false);
  }, []);

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <div
      className={cn(
        "aui-assistant-shell flex h-full w-full overflow-hidden",
        compact && "aui-assistant-shell-compact",
        className
      )}
    >
      {/*桌面端侧边栏 */}
      {showThreadList && !isMobile && (
        <div
          className={cn(
            "aui-assistant-sidebar border-r border-border transition-all duration-200 ease-in-out",
            sidebarOpen ? "w-[clamp(15rem,24vw,18rem)] min-w-[15rem]" : "w-0 min-w-0"
          )}
        >
          {sidebarOpen && (
            <ThreadList
              onSelect={handleMobileSelect}
              onSessionSwitch={handleSessionSwitch}
              onCreateSession={handleCreateSession}
              compact={compact}
              className="h-full"
            />
          )}
        </div>
      )}

      {/* 主内容区*/}
      <div className="aui-assistant-main flex flex-1 min-w-[22rem] flex-col">
        {/* 头部工具栏 */}
        <div className="aui-assistant-header flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* 侧边栏切换按钮（桌面端）*/}
            {showThreadList && !isMobile && (
              <TooltipIconButton
                tooltip={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? (
                  <PanelLeftCloseIcon className="h-4 w-4" />
                ) : (
                  <PanelLeftOpenIcon className="h-4 w-4" />
                )}
              </TooltipIconButton>
            )}

            {/* 移动端抽屉触发器 */}
            {showThreadList && isMobile && (
              <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2.5">
                    <PanelLeftOpenIcon className="mr-1.5 h-4 w-4" />
                    会话
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle>会话列表</SheetTitle>
                  </SheetHeader>
                  <ThreadList
                    onSelect={handleMobileSelect}
                    onSessionSwitch={handleSessionSwitch}
                    onCreateSession={handleCreateSession}
                    className="h-[calc(100%-60px)]"
                  />
                </SheetContent>
              </Sheet>
            )}

            <div
              className="flex max-w-[12rem] min-w-0 items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[11px] md:max-w-[14rem]"
              title={currentModel || "未配置模型"}
            >
              <span className="shrink-0 text-muted-foreground">模型</span>
              <span className="truncate font-medium text-foreground/90">
                {currentModel || "未配置"}
              </span>
            </div>
            {headerExtra}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateSession}
              className="h-8 gap-1.5 px-2"
              aria-label="新建会话"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden md:inline">新建</span>
            </Button>

            {/* 设置按钮 */}
            {onSettingsClick && (
              <TooltipIconButton
                tooltip="AI 设置"
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
              >
                <SettingsIcon className="h-4 w-4" />
              </TooltipIconButton>
            )}
          </div>
        </div>

        {/* 对话区域 */}
        <div className="aui-assistant-thread flex-1 overflow-hidden">
          {currentSessionId ? (
            <Thread />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// Main Shell Component (with Provider)
// =============================================================================

/**
 * AI Assistant Shell
 *
 * 完整的 AI 助手界面，包含：
 * - 线程列表（侧边栏/移动端抽屉）
 * - 对话区域（Thread）
 * - 输入区域（Composer）
 * - 设置入口
 *
 * @example
 * ```tsx
 * // 完整版（独立页面）
 * <AIAssistantShell
 *   config={{ model: 'gpt-4' }}
 *   onSettingsClick={() => setSettingsOpen(true)}
 * />
 *
 * // 紧凑版（悬浮窗）
 * <AIAssistantShell
 *   compact
 *   showThreadList={false}
 * />
 * ```
 */
export const AIAssistantShell: FC<AIAssistantShellProps> = ({
  config,
  ...rest
}) => {
  return (
    <AssistantRuntimeProvider config={config}>
      <AIAssistantShellContent {...rest} currentModel={config?.model} />
    </AssistantRuntimeProvider>
  );
};

// =============================================================================
// Exports
// =============================================================================

export type { RuntimeConfig };
