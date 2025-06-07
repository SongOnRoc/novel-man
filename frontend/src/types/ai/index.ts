// AI辅助类型定义
export type AIPromptType = 
  | "expand" // 扩写
  | "summarize" // 缩写/总结
  | "rewrite" // 改写
  | "plot-idea" // 情节构思
  | "character-design" // 角色设计
  | "world-building" // 世界观构建
  | "dialogue" // 对话生成
  | "text-polish"; // 文本优化

// 提示类型选项数组，用于下拉选择
export const promptTypeOptions = [
  { value: "expand", label: "扩写内容" },
  { value: "summarize", label: "缩写/总结" },
  { value: "rewrite", label: "改写内容" },
  { value: "plot-idea", label: "情节构思" },
  { value: "character-design", label: "角色设计" },
  { value: "world-building", label: "世界观构建" },
  { value: "dialogue", label: "对话生成" },
  { value: "text-polish", label: "文本优化" },
];

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