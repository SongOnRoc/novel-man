/**
 * @file 智能提取 AI 调用服务
 * @description 通过固定 prompt_id 调用统一 /generate 端点，
 * 默认走综合提取（一次返回角色 / 世界观 / 纲要），并支持专项重提取。
 */

import { getCompletionService, type CompletionRequest } from "@/lib/services/ai.service";

import { EXTRACT_PROMPT_IDS } from "./extractPromptIds";
import {
  ExtractParseError,
  parseExtractResponse,
} from "./extractParser";
import type { ExtractKind, ExtractResult } from "./extractTypes";

export interface ExtractServiceInput {
  scope: "combined" | ExtractKind;
  chapterTitle: string;
  paragraphs: string[];
  promptIdOverride?: number;
}

function resolvePromptId(scope: ExtractServiceInput["scope"], override?: number): number {
  if (typeof override === "number" && override > 0) {
    return override;
  }
  if (scope === "combined") {
    return EXTRACT_PROMPT_IDS.combined;
  }
  return EXTRACT_PROMPT_IDS[scope];
}

function buildChapterText(input: ExtractServiceInput): string {
  const cleanParagraphs = input.paragraphs.filter(Boolean);
  if (cleanParagraphs.length === 0) {
    return "（章节正文为空）";
  }
  return cleanParagraphs.join("\n\n");
}

export async function runExtractService(input: ExtractServiceInput): Promise<ExtractResult> {
  const promptId = resolvePromptId(input.scope, input.promptIdOverride);
  const fallbackKind = input.scope === "combined" ? undefined : input.scope;

  const text = buildChapterText(input);
  const request: CompletionRequest = {
    text,
    context: {},
  };
  if (promptId > 0) {
    request.prompt_id = promptId;
  }

  let response;
  try {
    response = await getCompletionService(request);
  } catch (error) {
    throw new ExtractParseError(
      error instanceof Error ? error.message : "智能提取请求失败，请稍后重试。",
      error,
    );
  }

  return parseExtractResponse(response.generated_text, {
    chapterTitle: input.chapterTitle,
    fallbackKind,
  });
}
