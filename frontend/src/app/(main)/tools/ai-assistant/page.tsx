"use client";

import React, { useState, useCallback } from "react";
import { AIAssistantShell } from "@/components/assistant-ui/ai-assistant-shell";
import {
  AISettingsDialog,
  useAISettings,
} from "@/components/assistant-ui/ai-settings-dialog";

/**
 * AI写作助手页面
 * 
 * 使用新的 assistant-ui 集成架构，提供完整的 AI 写作辅助功能。
 * 包含：
 * - 多会话管理（侧边栏）
 * - 对话区域（消息展示、分支管理）
 * - 输入区域（快捷操作、发送/停止）
 * - 设置对话框（模型、API Key、参数）
 */
export default function AIAssistantPage(): React.ReactElement {
  const {
    settings,
    isDialogOpen,
    setIsDialogOpen,
    handleSave,
  } = useAISettings();

  // 打开设置对话框
  const handleSettingsClick = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

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
        <div className="h-full bg-background/60 backdrop-blur-xl rounded-2xl border shadow-sm overflow-hidden ring-1 ring-border/50">
          <AIAssistantShell
            config={{
              model: settings.model,
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
            }}
            showThreadList={true}
            onSettingsClick={handleSettingsClick}
            className="h-full bg-transparent"
          />
        </div>
      </div>

      {/* 设置对话框 */}
      <AISettingsDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        settings={settings}
        onSave={handleSave}
      />
    </div>
  );
}
