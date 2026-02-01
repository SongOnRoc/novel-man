"use client";

import { type FC, createContext, useContext, useState, useCallback } from "react";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  MessageSquareIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/lib/utils";
import { useChatStore, type ChatSession } from "@/hooks/ai/useChatStore";

// =============================================================================
// Types & Context
// =============================================================================

interface ThreadListContextValue {
  onSelect?: () => void;
  onSessionSwitch?: (sessionId: string) => void;
}

const ThreadListContext = createContext<ThreadListContextValue>({});

interface ThreadListProps {
  /** 选中会话后的回调（用于关闭移动端抽屉等） */
  onSelect?: () => void;
  /** 切换会话的回调（连接到runtime） */
  onSessionSwitch?: (sessionId: string) => void;
  /** 创建新会话的回调 */
  onCreateSession?: () => string;
  /** 是否显示为紧凑模式 */
  compact?: boolean;
  /** 自定义类名 */
  className?: string;
}

// =============================================================================
// Main Component
// =============================================================================

export const ThreadList: FC<ThreadListProps> = ({
  onSelect,
  onSessionSwitch,
  onCreateSession,
  compact = false,
  className,
}) => {
  const { sessions, currentSessionId, createSession, switchSession, deleteSession } = useChatStore();
  
  // 按更新时间降序排序
  const sortedSessions = Object.values(sessions).sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  // 创建新会话
  const handleCreateSession = useCallback(() => {
    const newId = onCreateSession ? onCreateSession() : createSession();
    onSessionSwitch?.(newId);onSelect?.();
    return newId;
  }, [onCreateSession, createSession, onSessionSwitch, onSelect]);

  // 切换会话
  const handleSwitchSession = useCallback((sessionId: string) => {
    if (sessionId === currentSessionId) return;
    switchSession(sessionId);
    onSessionSwitch?.(sessionId);
    onSelect?.();
  }, [currentSessionId, switchSession, onSessionSwitch, onSelect]);

  // 删除会话
  const handleDeleteSession = useCallback((sessionId: string) => {
    const sessionIds = Object.keys(sessions);
    const currentIndex = sessionIds.indexOf(sessionId);
    
    // 如果删除的是当前会话，切换到下一个或上一个
    if (sessionId === currentSessionId) {
      const nextIndex = currentIndex < sessionIds.length - 1 ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex >= 0 && nextIndex < sessionIds.length) {
        const nextSessionId = sessionIds[nextIndex];
        if (nextSessionId !== sessionId) {
          switchSession(nextSessionId);
          onSessionSwitch?.(nextSessionId);
        }
      } else {
        // 没有其他会话了，创建新的
        const newId = handleCreateSession();
        onSessionSwitch?.(newId);
      }
    }
    
    deleteSession(sessionId);
  }, [sessions, currentSessionId, switchSession, deleteSession, handleCreateSession, onSessionSwitch]);

  return (
    <ThreadListContext.Provider value={{ onSelect, onSessionSwitch }}>
      <div
        className={cn(
          "aui-thread-list flex flex-col h-full",
          className
        )}
        data-aui-thread-list
      >
        {/* 新建会话按钮 */}
        <div className="p-2 border-b border-border">
          <Button
            onClick={handleCreateSession}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 hover:bg-muted",
              compact && "px-2"
            )}
          >
            <PlusIcon className="h-4 w-4" />
            {!compact && <span>新建会话</span>}
          </Button>
        </div>

        {/* 会话列表 */}
        <ScrollArea className="flex-1"><div className="p-2 space-y-1">
            {sortedSessions.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                暂无会话
              </div>
            ) : (
              sortedSessions.map((session) => (
                <ThreadListItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  compact={compact}
                  onSwitch={() => handleSwitchSession(session.id)}
                  onDelete={() => handleDeleteSession(session.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </ThreadListContext.Provider>
  );
};

// =============================================================================
// Thread List Item
// =============================================================================

interface ThreadListItemProps {
  session: ChatSession;
  isActive: boolean;
  compact?: boolean;
  onSwitch: () => void;
  onDelete: () => void;
}

const ThreadListItem: FC<ThreadListItemProps> = ({
  session,
  isActive,
  compact = false,
  onSwitch,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(session.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { updateSessionTitle } = useChatStore();

  // 开始编辑
  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(session.title);
    setIsEditing(true);
  }, [session.title]);

  // 保存编辑
  const handleSaveEdit = useCallback(() => {
    if (editTitle.trim()) {
      updateSessionTitle(session.id, editTitle.trim());
    }
    setIsEditing(false);
  }, [editTitle, session.id, updateSessionTitle]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    setEditTitle(session.title);
    setIsEditing(false);
  }, [session.title]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // 确认删除
  const handleConfirmDelete = useCallback(() => {
    onDelete();
    setShowDeleteDialog(false);
  }, [onDelete]);

  // 计算消息数量
  const messageCount = Object.keys(session.messages).length;

  // 格式化更新时间
  const timeAgo = formatDistanceToNow(session.updatedAt, {
    addSuffix: true,
    locale: zhCN,
  });

  return (
    <>
      <div
        className={cn(
          "aui-thread-list-item group relative flex items-center gap-2 rounded-lg transition-colors cursor-pointer",
          "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-muted",
          compact ? "px-2 py-1.5" : "px-3 py-2"
        )}
        data-aui-thread-list-item
        data-active={isActive}
        onClick={onSwitch}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onSwitch()}
      >
        {/* 图标 */}
        <MessageSquareIcon className={cn(
          "flex-shrink-0 text-muted-foreground",
          compact ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />

        {/* 标题和信息 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                className="h-6 text-sm"
                autoFocus
              />
              <TooltipIconButton
                tooltip="保存"
                variant="ghost"
                size="sm"
                className="h-6 w-6p-0"
                onClick={handleSaveEdit}
              >
                <CheckIcon className="h-3 w-3" />
              </TooltipIconButton>
              <TooltipIconButton
                tooltip="取消"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleCancelEdit}
              >
                <XIcon className="h-3 w-3" />
              </TooltipIconButton>
            </div>
          ) : (
            <>
              <div className={cn(
                "font-medium truncate",
                compact ? "text-xs" : "text-sm"
              )}>
                {session.title || "新对话"}
              </div>
              {!compact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{messageCount} 条消息</span>
                  <span>·</span>
                  <span>{timeAgo}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* 操作按钮 */}
        {!isEditing && (
          <div className={cn(
            "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
            isActive && "opacity-100"
          )}>
            <TooltipIconButton
              tooltip="重命名"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleStartEdit}
            >
              <PencilIcon className="h-3 w-3" />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="删除"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
            >
              <TrashIcon className="h-3 w-3" />
            </TooltipIconButton>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除会话 "{session.title || "新对话"}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// =============================================================================
// Exports
// =============================================================================

export type { ThreadListProps };
