// AI辅助类型定义
export type AIPromptType =
  | "expand" // 扩写
  | "rewrite" // 改写
  | "summarize" // 缩写
  | "correct" // 纠错
  | "continue" // 续写
  | "custom"; // 自定义

// AI生成请求参数
export interface AIGenerateParams {
  promptType: AIPromptType;
  prompt: string;
  selectedText?: string; // 编辑器中选中的文本
  context?: string; // 上下文信息，如章节标题、作品信息等
}

// AI响应结果
export interface AIResponse {
  content: string;
  metadata?: {
    tokens?: number;
    processingTime?: number;
  };
}
