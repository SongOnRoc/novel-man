import { type ThreadMessageLike } from "@assistant-ui/react";
import { type ExportedMessageRepository } from "@/hooks/ai/useChatStore";

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
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 将 useChatStore 的 session 转换为 runtime 可导入的格式
 */
export function convertToExportedMessageRepository(
  session: { messages: Record<string, any>; headId: string | null } | undefined
): ExportedMessageRepository {
  if (!session) {
    return { headId: null, messages: [] };
  }

  return {
    headId: session.headId,
    messages: Object.values(session.messages).map((msg: any) => ({
      message: {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        status: msg.status,
      } as ThreadMessageLike & { id: string },
      parentId: msg.parentId,
    })),
  };
}

// =============================================================================
// Exports
// =============================================================================

export type { ExportedMessageRepository };
