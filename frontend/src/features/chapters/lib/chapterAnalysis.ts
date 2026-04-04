import { analyzeChapterService } from "@/lib/services/chapter-analysis.service";

export type ChapterAnalysisKind = "outline" | "characters";

export type ChapterAnalysisStatus = "idle" | "loading" | "success" | "error";

export interface ChapterAnalysisResult {
  kind: ChapterAnalysisKind;
  heading: string;
  summary: string;
  items: string[];
}

export function buildChapterAnalysisResult(input: {
  kind: ChapterAnalysisKind;
  chapterTitle: string;
  paragraphs: string[];
}): ChapterAnalysisResult {
  const sourceParagraphs = input.paragraphs.filter(Boolean);
  const firstParagraph = sourceParagraphs[0] || "暂无内容";

  if (input.kind === "characters") {
    return {
      kind: "characters",
      heading: "角色提取结果",
      summary: `基于《${input.chapterTitle}》的当前输入片段，提取角色经历与行为线索。`,
      items: sourceParagraphs.length
        ? sourceParagraphs.map((paragraph, index) => `角色线索 ${index + 1}：${paragraph}`)
        : ["暂无可提取的角色信息。"],
    };
  }

  return {
    kind: "outline",
    heading: "大纲提取结果",
    summary: `基于《${input.chapterTitle}》的当前输入片段，生成本章结构摘要。`,
    items: sourceParagraphs.length
      ? [
          `开场：${firstParagraph}`,
          `推进：共选中 ${sourceParagraphs.length} 段，可作为本章推进线索。`,
        ]
      : ["暂无可提取的大纲内容。"],
  };
}

export async function generateChapterAnalysisResult(input: {
  kind: ChapterAnalysisKind;
  chapterTitle: string;
  paragraphs: string[];
}): Promise<ChapterAnalysisResult> {
  const aiResult = await analyzeChapterService(input);

  if (aiResult) {
    return aiResult;
  }

  await new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });

  return buildChapterAnalysisResult(input);
}
