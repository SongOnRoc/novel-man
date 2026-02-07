"use client";

import { type FC, type ReactNode, createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { AssistantRuntimeProvider as BaseAssistantRuntimeProvider, useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { useChatStore, type ExportedMessageRepository } from "@/hooks/ai/useChatStore";
import { generateStreamService, type GenerateRequest } from "@/lib/services/ai.service";

// =============================================================================
// Types
// =============================================================================

export interface RuntimeConfig {
  /** 选择的模型名称 */
  model?: string;
  /** 温度参数 (0-2) */
  temperature?: number;
  /** 最大 token 数 */
  maxTokens?: number;
  /** 获取当前选中的提示词 ID 的回调函数 */
  getSelectedPromptId?: () => number | null;
  /** 编辑器当前选中文本（会注入本轮用户消息上下文） */
  selectedText?: string;
}

export interface AssistantRuntimeProviderProps {
  children: ReactNode;
  /** Runtime配置 */
  config?: RuntimeConfig;
  /** 初始化时自动创建会话（如果没有会话） */
  autoCreateSession?: boolean;
}

interface ChatRuntimeContextValue {
  switchToSession: (sessionId: string) => void;
  createNewSession: () => string;
  currentSessionId: string | null;
}

// =============================================================================
// Context
// =============================================================================

const ChatRuntimeContext = createContext<ChatRuntimeContextValue | null>(null);

/**
 * Hook to access runtime operations from within AssistantRuntimeProvider
 *
 * 必须在 AssistantRuntimeProvider 内部使用
 */
export const useChatRuntimeContext = () => {
  const context = useContext(ChatRuntimeContext);
  if (!context) {
    throw new Error("useChatRuntimeContext must be used within AssistantRuntimeProvider");
  }
  return context;
};

// =============================================================================
// Model Adapter
// =============================================================================

const createModelAdapter = (config: RuntimeConfig = {}): ChatModelAdapter => {
  return {
    run: async function* ({ messages, abortSignal }) {
      const history = messages.map((msg) => {
        let content = "";
        if (typeof msg.content === "string") {
          content = msg.content;
        } else if (Array.isArray(msg.content)) {
          content = msg.content
            .map((part: any) => ("text" in part ? part.text : ""))
            .join("");
        }
        return { role: msg.role, content };
      });

      const selectedText = config.selectedText?.trim();
      if (selectedText) {
        for (let i = history.length - 1; i >= 0; i--) {
          if (history[i].role === "user") {
            history[i] = {
              ...history[i],
              content: `${history[i].content}\n\n【引用文本】\n${selectedText}`,
            };
            break;
          }
        }
      }

      let fullText = "";
      const resolveQueue: ((val: any) => void)[] = [];
      const queue: any[] = [];

      const push = (val: any) => {
        if (resolveQueue.length > 0) {
          resolveQueue.shift()!(val);
        } else {
          queue.push(val);
        }
      };

      // 获取当前选中的提示词 ID（必须是正整数才有效）
      const promptId = config.getSelectedPromptId?.() ?? null;
      const validPromptId = promptId && promptId > 0 ? promptId : null;

      const requestData: GenerateRequest = {
        messages: history,
        model: config.model,
        ...(validPromptId && { prompt_id: validPromptId }),
      };

      const abortFn = generateStreamService(
        requestData,
        (textChunk) => push({ type: "chunk", value: textChunk }),
        (error) => push({ type: "error", value: error }),
        () => push({ type: "done" })
      );

      const abortHandler = () => {
        abortFn();
        push({ type: "aborted" });
      };
      abortSignal.addEventListener("abort", abortHandler);

      try {
        while (true) {
          if (abortSignal.aborted) break;

          const next = await new Promise<any>((resolve) => {
            if (queue.length > 0) {
              resolve(queue.shift());
            } else {
              resolveQueue.push(resolve);
            }
          });

          // 再次检查 abortSignal，防止在等待 Promise 期间被取消
          if (abortSignal.aborted) break;
          if (next.type === "done" || next.type === "aborted") break;
          if (next.type === "error") throw next.value;

          if (next.type === "chunk") {
            fullText += next.value;
            yield { content: [{ type: "text", text: fullText }] };
          }

        }
      } finally {
        abortSignal.removeEventListener("abort", abortHandler);
      }
    },
  };
};

// =============================================================================
// Inner Runtime Component (with key-based remounting)
// =============================================================================

interface RuntimeInnerProps {
  children: ReactNode;
  config?: RuntimeConfig;
  sessionId: string;
}

/**
 * 内部 Runtime 组件
 * 通过 key={sessionId} 强制在会话切换时重新创建整个 runtime
 */
const RuntimeInner: FC<RuntimeInnerProps> = ({ children, config, sessionId }) => {
  const sessions = useChatStore((state) => state.sessions);
  const session = sessions[sessionId];

  // 创建 adapter
  const adapter = useMemo(() => createModelAdapter(config), [config]);

  // 计算初始消息，同时修复"僵尸" running 状态
  // 如果消息状态是 running 但页面刚加载，说明之前的流没有正确结束
  const initialMessages = useMemo(() => {
    if (!session) return [];
    return Object.values(session.messages).map((msg) => {
      const message = {
        ...msg,
        id: msg.id,
        parentId: msg.parentId,
      };

      // 修复卡住的 "running" 状态消息
      // 页面加载时不可能有真正在运行的流，所以标记为 incomplete
      if (msg.status && (msg.status as any).type === "running") {
        return {
          ...message,
          status: {
            type: "incomplete" as const,
            reason: "cancelled" as const,
          },
        };
      }

      return message;
    });
  }, [session]);

  // 创建 runtime
  const runtime = useLocalRuntime(adapter, { initialMessages });

  // 订阅 runtime 状态变化，自动导出到 store
  useEffect(() => {
    if (!runtime?.thread) return;

    const importSession = useChatStore.getState().importSession;

    return runtime.thread.subscribe(() => {
      try {
        const repo = runtime.thread.export();
        importSession(sessionId, repo as ExportedMessageRepository);
      } catch (error) {
        // 忽略导出错误
      }
    });
  }, [sessionId, runtime]);

  return (
    <BaseAssistantRuntimeProvider runtime={runtime}>
      {children}
    </BaseAssistantRuntimeProvider>
  );
};

// =============================================================================
// Provider Component
// =============================================================================

/**
 * Assistant Runtime Provider
 *
 * 包装 @assistant-ui/react 的 AssistantRuntimeProvider，
 * 使用 key={currentSessionId} 强制在会话切换时重新创建 runtime，
 * 避免 assistant-ui 库的内部状态问题。
 */
export const AssistantRuntimeProvider: FC<AssistantRuntimeProviderProps> = ({
  children,
  config,
  autoCreateSession = true,
}) => {
  const { currentSessionId, sessions, createSession, switchSession } = useChatStore();

  // 自动创建初始会话
  useEffect(() => {
    if (autoCreateSession && Object.keys(sessions).length === 0) {
      createSession();
    }
  }, [autoCreateSession, sessions, createSession]);

  // 切换会话
  const switchToSession = useCallback((sessionId: string) => {
    if (sessions[sessionId]) {
      switchSession(sessionId);
    }
  }, [sessions, switchSession]);

  // 创建新会话
  const createNewSession = useCallback(() => {
    return createSession();
  }, [createSession]);

  // 如果没有当前会话，显示空状态
  if (!currentSessionId) {
    return (
      <ChatRuntimeContext.Provider value={{ switchToSession, createNewSession, currentSessionId }}>
        {children}
      </ChatRuntimeContext.Provider>
    );
  }

  return (
    <ChatRuntimeContext.Provider value={{ switchToSession, createNewSession, currentSessionId }}>
      {/* key={currentSessionId} 确保会话切换时完全重新创建 runtime */}
      <RuntimeInner key={currentSessionId} config={config} sessionId={currentSessionId}>
        {children}
      </RuntimeInner>
    </ChatRuntimeContext.Provider>
  );
};

// =============================================================================
// Exports
// =============================================================================

export type { ExportedMessageRepository };
