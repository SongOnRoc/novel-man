"use client";

import { type FC, useState, useCallback } from "react";
import {
  SettingsIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "lucide-react";
import { useMediaQuery } from "react-responsive";

import { Thread } from "@/components/assistant-ui/thread";
import {
  ThreadList,
  type ThreadListProps,
} from "@/components/assistant-ui/thread-list";
import {
  AssistantRuntimeProvider,
  useChatRuntimeContext,
} from "@/components/assistant-ui/assistant-runtime-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";
import { type RuntimeConfig } from "@/lib/ai/runtime";

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

const AIAssistantShellContent: FC<Omit<AIAssistantShellProps, "config">> = ({
  showThreadList = true,
  compact = false,
  onSettingsClick,
  className,
  headerExtra,
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
            sidebarOpen ? "w-64" : "w-0"
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
      <div className="aui-assistant-main flex flex-1 flex-col min-w-0">
        {/* 头部工具栏 */}
        <div className="aui-assistant-header flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
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
                  <Button variant="ghost" size="sm">
                    <PanelLeftOpenIcon className="h-4 w-4 mr-2" />
                    会话列表
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72p-0">
                  <SheetHeader className="p-4border-b">
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

            {headerExtra}
          </div>

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
      <AIAssistantShellContent {...rest} />
    </AssistantRuntimeProvider>
  );
};

// =============================================================================
// Exports
// =============================================================================

export type { RuntimeConfig };
