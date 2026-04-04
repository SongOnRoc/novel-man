import {
  DEFAULT_CHAPTER_NUMBER_STYLE_ID,
  type ChapterNumberStyleId,
  sanitizeChapterNumberStyleTemplate,
} from "./chapterNumbering";

export interface ChapterNumberingConfig {
  styleId: ChapterNumberStyleId;
  customTemplate?: string;
  numberFormat?: "chinese" | "arabic";
}

const GLOBAL_STORAGE_KEY = "chapter-numbering:global";
const workKey = (workId: number) => `chapter-numbering:work:${workId}`;

const DEFAULT_CONFIG: ChapterNumberingConfig = {
  styleId: DEFAULT_CHAPTER_NUMBER_STYLE_ID,
  numberFormat: "chinese",
};

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeConfig(input: unknown): ChapterNumberingConfig {
  if (!input || typeof input !== "object") return DEFAULT_CONFIG;
  const obj = input as Record<string, unknown>;

  const styleId = (obj.styleId as ChapterNumberStyleId | undefined) ?? DEFAULT_CONFIG.styleId;
  const numberFormat = (obj.numberFormat as "chinese" | "arabic" | undefined) ?? DEFAULT_CONFIG.numberFormat;
  const customTemplate = typeof obj.customTemplate === "string" ? obj.customTemplate : undefined;

  if (styleId === "custom") {
    if (!customTemplate) {
      return DEFAULT_CONFIG;
    }
    try {
      return {
        styleId,
        numberFormat: numberFormat === "arabic" ? "arabic" : "chinese",
        customTemplate: sanitizeChapterNumberStyleTemplate(customTemplate),
      };
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  return {
    styleId,
    numberFormat: numberFormat === "arabic" ? "arabic" : "chinese",
  };
}

export function loadGlobalChapterNumberingConfig(): ChapterNumberingConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const stored = localStorage.getItem(GLOBAL_STORAGE_KEY);
  if (!stored) return DEFAULT_CONFIG;
  return normalizeConfig(safeParseJson(stored));
}

export function saveGlobalChapterNumberingConfig(config: ChapterNumberingConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GLOBAL_STORAGE_KEY, JSON.stringify(config));
}

export function loadWorkChapterNumberingConfig(workId: number): ChapterNumberingConfig | null {
  if (typeof window === "undefined") return null;
  if (!Number.isInteger(workId) || workId <= 0) return null;

  const stored = localStorage.getItem(workKey(workId));
  if (!stored) return null;
  return normalizeConfig(safeParseJson(stored));
}

export function saveWorkChapterNumberingConfig(workId: number, config: ChapterNumberingConfig): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(workId) || workId <= 0) return;
  localStorage.setItem(workKey(workId), JSON.stringify(config));
}

export function clearWorkChapterNumberingConfig(workId: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isInteger(workId) || workId <= 0) return;
  localStorage.removeItem(workKey(workId));
}

export function getEffectiveChapterNumberingConfig(workId?: number | null): ChapterNumberingConfig {
  const global = loadGlobalChapterNumberingConfig();
  if (!workId || !Number.isInteger(workId) || workId <= 0) return global;
  const work = loadWorkChapterNumberingConfig(workId);
  return work ?? global;
}

export function getChapterNumberStyleTemplate(config: ChapterNumberingConfig): string {
  if (config.styleId === "custom") {
    return sanitizeChapterNumberStyleTemplate(config.customTemplate || "");
  }

  // Keep templates centralized in chapterNumbering.ts
  switch (config.styleId) {
    case "cn_chapter":
      return "第{N}章";
    case "cn_section":
      return "第{N}节";
    case "cn_volume":
      return "第{N}回";
    case "arabic_chapter":
      return "第{N}章";
    case "arabic_dot":
      return "{N}.";
    default:
      return "第{N}章";
  }
}
