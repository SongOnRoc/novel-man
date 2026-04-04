import { getCompletionService, type CompletionRequest } from "@/lib/services/ai.service";

export type ChapterAnalysisKind = "outline" | "characters";

export interface ChapterAnalysisServiceInput {
  kind: ChapterAnalysisKind;
  chapterTitle: string;
  paragraphs: string[];
}

export interface ChapterAnalysisServiceResult {
  kind: ChapterAnalysisKind;
  heading: string;
  summary: string;
  items: string[];
}

function buildAnalysisPrompt(input: ChapterAnalysisServiceInput): string {
  const joinedParagraphs = input.paragraphs.filter(Boolean).join("\n");

  if (input.kind === "characters") {
    return [
      `请基于章节《${input.chapterTitle}》提取角色线索。`,
      "请严格输出以下格式：",
      "SUMMARY: 一句话总结",
      "ITEMS:",
      "- 角色线索 1",
      "- 角色线索 2",
      "若内容不足，也要给出尽量合理的简要结果。",
      "章节内容：",
      joinedParagraphs || "暂无内容",
    ].join("\n");
  }

  return [
    `请基于章节《${input.chapterTitle}》提取结构大纲。`,
    "请严格输出以下格式：",
    "SUMMARY: 一句话总结",
    "ITEMS:",
    "- 结构要点 1",
    "- 结构要点 2",
    "若内容不足，也要给出尽量合理的简要结果。",
    "章节内容：",
    joinedParagraphs || "暂无内容",
  ].join("\n");
}

function parseGeneratedText(kind: ChapterAnalysisKind, text?: string): Omit<ChapterAnalysisServiceResult, "kind"> | null {
  if (!text) {
    return null;
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const summaryLine = lines.find((line) => line.startsWith("SUMMARY:"));
  const itemLines = lines.filter((line) => /^[-*]\s+/.test(line));

  if (!summaryLine && itemLines.length === 0) {
    return null;
  }

  return {
    heading: kind === "outline" ? "AI 大纲提取结果" : "AI 角色提取结果",
    summary: summaryLine?.replace(/^SUMMARY:\s*/, "") || "已生成章节分析结果。",
    items: itemLines.length
      ? itemLines.map((line) => line.replace(/^[-*]\s+/, ""))
      : ["AI 已返回结果，但未解析出结构化条目。"],
  };
}

export async function analyzeChapterService(
  input: ChapterAnalysisServiceInput,
): Promise<ChapterAnalysisServiceResult | null> {
  const request: CompletionRequest = {
    assistant_type: input.kind === "outline" ? "summarize" : "character-design",
    context: {
      style_preference: input.kind === "outline" ? "descriptive" : "formal",
    },
    text: buildAnalysisPrompt(input),
  };

  try {
    const response = await getCompletionService(request);
    const parsed = parseGeneratedText(input.kind, response.generated_text);

    if (!parsed) {
      return null;
    }

    return {
      kind: input.kind,
      ...parsed,
    };
  } catch {
    return null;
  }
}
