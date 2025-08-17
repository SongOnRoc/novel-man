"use client";

import { AIAssistant } from "@/features/ai/components/AIAssistant";

/**
 * AI写作助手页面
 * 提供完整的AI写作辅助功能
 */
export default function AIAssistantPage() {
  return (
    <div className="container max-w-5xl py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI写作助手</h1>
        <p className="text-muted-foreground">
          描述您的写作需求，AI将为您提供创意、角色设计、情节构思或文本优化建议。
        </p>
      </div>

      {/* 完整的AI助手组件 */}
      <AIAssistant />

      {/* 使用说明 */}
      <div className="bg-muted p-4 rounded-lg mt-8">
        <h3 className="font-medium mb-2">使用提示</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>选择特定的辅助类型可以获得更精准的回复</li>
          <li>详细描述您的需求，包括背景、风格和特定要求</li>
          <li>生成的内容仅供参考，请根据您的创作风格进行调整</li>
          <li>您可以将满意的内容保存到草稿箱，方便后续编辑</li>
          <li>在编辑器中，您也可以通过右下角的悬浮按钮随时使用AI助手</li>
        </ul>
      </div>
    </div>
  );
}
