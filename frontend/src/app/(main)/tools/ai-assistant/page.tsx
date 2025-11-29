"use client";

import React, { useState, useEffect } from "react";
import { AIChatInterface } from "@/features/ai/components/chat/AIChatInterface";
import { GlobalLoading } from "@/components/common/GlobalLoading";

/**
 * AI写作助手页面
 * 提供完整的AI写作辅助功能
 */
export default function AIAssistantPage(): React.ReactElement {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading for consistency
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <GlobalLoading />;
  }

  return (
    <div className="h-[calc(100vh-64px)] -m-8 flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="px-8 py-6 z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI 写作助手
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            激发创作灵感，优化文字表达，您的智能创作伙伴。
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden px-8 pb-8">
        <div className="max-w-4xl mx-auto h-full bg-background/60 backdrop-blur-xl rounded-2xl border shadow-sm overflow-hidden ring-1 ring-border/50">
          <AIChatInterface 
            className="h-full bg-transparent" 
            hideBorder 
          />
        </div>
      </div>
    </div>
  );
}
