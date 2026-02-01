import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { ThreadMessageLike } from "@assistant-ui/react";

// Define ExportedMessageRepository type locally to avoid deep imports
export type ExportedMessageRepository = {
  headId?: string | null;
  messages: Array<{
    message: ThreadMessageLike & { id: string };
    parentId: string | null;runConfig?: any;
  }>;
};

export interface ChatMessage extends ThreadMessageLike {
  id: string;
  parentId: string | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Record<string, ChatMessage>;
  headId: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  sessions: Record<string, ChatSession>;
  currentSessionId: string | null;
  
  // Actions
  createSession: () => string;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  
  // Message Actions
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, message: Partial<ChatMessage>) => void;
  setHeadId: (sessionId: string, headId: string) => void;
  importSession: (sessionId: string, repository: ExportedMessageRepository) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: {},
      currentSessionId: null,

      createSession: () => {
        const id = uuidv4();
        const newSession: ChatSession = {
          id,
          title: "新对话",
          messages: {},
          headId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set((state) => ({
          sessions: { ...state.sessions, [id]: newSession },
          currentSessionId: id,
        }));
        
        return id;
      },

      switchSession: (sessionId) => {
        if (get().sessions[sessionId]) {
          set({ currentSessionId: sessionId });
        }
      },

      deleteSession: (sessionId) => {
        set((state) => {
          const { [sessionId]: _, ...rest } = state.sessions;
          const nextSessionId = 
            state.currentSessionId === sessionId 
              ? Object.keys(rest)[0] || null 
              : state.currentSessionId;
          return {
            sessions: rest,
            currentSessionId: nextSessionId,
          };
        });
      },

      updateSessionTitle: (sessionId, title) => {
        set((state) => ({
          sessions: {
            ...state.sessions,
            [sessionId]: {
              ...state.sessions[sessionId],
              title,
              updatedAt: Date.now(),
            },
          },
        }));
      },

      addMessage: (sessionId, message) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: { ...session.messages, [message.id]: message },
                headId: message.id, // Move head to new message
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateMessage: (sessionId, messageId, updates) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session || !session.messages[messageId]) return state;

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: {
                  ...session.messages,
                  [messageId]: { ...session.messages[messageId], ...updates },
                },
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      setHeadId: (sessionId, headId) => {
        set((state) => {
          const session = state.sessions[sessionId];
          if (!session || (headId && !session.messages[headId])) return state;

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                headId,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      importSession: (sessionId, repository) => {
        set((state) => {
          let session = state.sessions[sessionId];
          //如果session不存在，自动创建一个新的
          // 这处理了临时ID（__LOCALID_xxx）的情况
          if (!session) {
            session = {
              id: sessionId,
              title: "新对话",
              messages: {},
              headId: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };}

          const newMessages: Record<string, ChatMessage> = {};
          repository.messages.forEach((item) => {
            newMessages[item.message.id] = {
              ...item.message,
              id: item.message.id,
              parentId: item.parentId,
            };
          });

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...session,
                messages: newMessages,
                headId: repository.headId || null,
                updatedAt: Date.now(),
              },
            },
            // 如果是新创建的session且当前没有选中的session，设置为当前session
            currentSessionId: state.currentSessionId || sessionId,
          };
        });
      },
    }),
    {
      name: "ai-chat-storage-v3",
    }
  )
);