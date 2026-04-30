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
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4 animate-in fade-in duration-500 sm:gap-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-5 sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 hidden h-40 w-40 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block"
        />
        <div className="relative space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-3 pr-3">
            <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
              AI 创作伙伴
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            AI 写作助手
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            激发创作灵感，优化文字表达，您的智能创作伙伴。
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm">
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
