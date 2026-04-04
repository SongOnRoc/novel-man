export type ChapterNumberStyleId =
  | "cn_chapter"
  | "cn_section"
  | "cn_volume"
  | "arabic_chapter"
  | "arabic_dot"
  | "custom";

export interface ChapterNumberStyle {
  id: ChapterNumberStyleId;
  label: string;
  template: string;
}

export interface ChapterTitleNormalizationResult {
  chapterNo: number;
  styleTemplate: string;
  prefix: string;
  suffix: string;
  input: string;
  strippedInput: string;
  finalTitle: string;
  detectedNo: number | null;
  hasConflict: boolean;
}

export const DEFAULT_CHAPTER_NUMBER_STYLE_ID: ChapterNumberStyleId = "cn_chapter";

export const CHAPTER_NUMBER_STYLES: Record<Exclude<ChapterNumberStyleId, "custom">, ChapterNumberStyle> = {
  cn_chapter: {
    id: "cn_chapter",
    label: "第{N}章",
    template: "第{N}章",
  },
  cn_section: {
    id: "cn_section",
    label: "第{N}节",
    template: "第{N}节",
  },
  cn_volume: {
    id: "cn_volume",
    label: "第{N}回",
    template: "第{N}回",
  },
  arabic_chapter: {
    id: "arabic_chapter",
    label: "第{N}章(阿拉伯数字)",
    template: "第{N}章",
  },
  arabic_dot: {
    id: "arabic_dot",
    label: "{N}.",
    template: "{N}.",
  },
};

const CHAPTER_NUMBER_PLACEHOLDER = "{N}";
const MAX_CHAPTER_NO = 9999;

export function isValidChapterNumberStyleTemplate(template: string): boolean {
  if (typeof template !== "string") return false;
  if (template.includes("\n") || template.includes("\r")) return false;
  const trimmed = template.trim();
  if (!trimmed) return false;
  if (!trimmed.includes(CHAPTER_NUMBER_PLACEHOLDER)) return false;
  return true;
}

export function sanitizeChapterNumberStyleTemplate(template: string): string {
  const trimmed = String(template ?? "").trim();
  if (!isValidChapterNumberStyleTemplate(trimmed)) {
    throw new Error("自定义编号模板无效：必须包含 {N} 且禁止换行");
  }
  return trimmed;
}

export function toChineseNumeral(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n > MAX_CHAPTER_NO) {
    throw new Error("中文数字仅支持 1-9999");
  }

  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  const units = ["", "十", "百", "千"];

  const parts: string[] = [];
  const numStr = String(n);
  for (let i = 0; i < numStr.length; i += 1) {
    const d = Number(numStr[i]);
    const pos = numStr.length - 1 - i;
    if (d === 0) {
      if (parts.length > 0 && parts[parts.length - 1] !== digits[0]) {
        parts.push(digits[0]);
      }
      continue;
    }

    parts.push(digits[d]);
    parts.push(units[pos]);
  }

  let out = parts.join("");
  out = out.replace(/零+/g, "零");
  out = out.replace(/零$/g, "");
  out = out.replace(/^一十/, "十");
  return out;
}

function parseChineseNumeral(input: string): number | null {
  const s = input.trim();
  if (!s) return null;

  const digitMap: Record<string, number> = {
    零: 0,
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  };

  const unitMap: Record<string, number> = {
    十: 10,
    百: 100,
    千: 1000,
  };

  let total = 0;
  let current = 0;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch in digitMap) {
      current = digitMap[ch];
      continue;
    }
    if (ch in unitMap) {
      const unit = unitMap[ch];
      const base = current === 0 ? 1 : current;
      total += base * unit;
      current = 0;
      continue;
    }
    return null;
  }

  total += current;

  if (!Number.isInteger(total) || total <= 0 || total > MAX_CHAPTER_NO) return null;
  return total;
}

export function formatChapterNumber(
  chapterNo: number,
  template: string,
  opts?: {
    numberFormat?: "chinese" | "arabic";
  },
): string {
  const safeTemplate = sanitizeChapterNumberStyleTemplate(template);
  if (!Number.isInteger(chapterNo) || chapterNo <= 0 || chapterNo > MAX_CHAPTER_NO) {
    throw new Error("章节序号必须为 1-9999 的整数");
  }

  const numberFormat = opts?.numberFormat ?? "chinese";
  const nText = numberFormat === "arabic" ? String(chapterNo) : toChineseNumeral(chapterNo);
  return safeTemplate.replaceAll(CHAPTER_NUMBER_PLACEHOLDER, nText);
}

export function stripChapterNumberPrefix(inputTitle: string): {
  stripped: string;
  detectedNo: number | null;
} {
  const input = String(inputTitle ?? "").trim();
  if (!input) {
    return { stripped: "", detectedNo: null };
  }

  // Common forms to strip, leading only.
  // - 第20章 xxx / 第二十章 xxx / 第 20 章 xxx
  // - 20. xxx / 20、xxx / 20 xxx
  // - 章节20 xxx / 章20 xxx
  const patterns: Array<{
    re: RegExp;
    parseNo: (m: RegExpMatchArray) => number | null;
  }> = [
    {
      re: /^第\s*([0-9]{1,4})\s*[章节回节卷篇]\s*[:：\-_.、\s]*/,
      parseNo: (m) => {
        const n = Number(m[1]);
        return Number.isInteger(n) && n > 0 && n <= MAX_CHAPTER_NO ? n : null;
      },
    },
    {
      re: /^第\s*([零一二两三四五六七八九十百千]{1,12})\s*[章节回节卷篇]\s*[:：\-_.、\s]*/,
      parseNo: (m) => parseChineseNumeral(m[1]),
    },
    {
      re: /^(?:章节|章)\s*([0-9]{1,4})\s*[:：\-_.、\s]*/,
      parseNo: (m) => {
        const n = Number(m[1]);
        return Number.isInteger(n) && n > 0 && n <= MAX_CHAPTER_NO ? n : null;
      },
    },
    {
      re: /^([0-9]{1,4})\s*[.、]\s*/,
      parseNo: (m) => {
        const n = Number(m[1]);
        return Number.isInteger(n) && n > 0 && n <= MAX_CHAPTER_NO ? n : null;
      },
    },
    {
      re: /^([0-9]{1,4})\s+/, // leading number then whitespace
      parseNo: (m) => {
        const n = Number(m[1]);
        return Number.isInteger(n) && n > 0 && n <= MAX_CHAPTER_NO ? n : null;
      },
    },
  ];

  for (const p of patterns) {
    const m = input.match(p.re);
    if (!m) continue;
    const detectedNo = p.parseNo(m);
    const stripped = input.slice(m[0].length).trim();
    return { stripped, detectedNo };
  }

  return { stripped: input, detectedNo: null };
}

export function normalizeChapterTitle(params: {
  chapterNo: number;
  inputTitle: string;
  styleTemplate: string;
  numberFormat?: "chinese" | "arabic";
}): ChapterTitleNormalizationResult {
  const chapterNo = params.chapterNo;
  const input = String(params.inputTitle ?? "");
  const styleTemplate = sanitizeChapterNumberStyleTemplate(params.styleTemplate);
  const numberFormat = params.numberFormat ?? "chinese";

  if (!Number.isInteger(chapterNo) || chapterNo <= 0 || chapterNo > MAX_CHAPTER_NO) {
    throw new Error("章节序号必须为 1-9999 的整数");
  }

  const { stripped, detectedNo } = stripChapterNumberPrefix(input);
  const suffix = stripped.trim();
  const prefix = formatChapterNumber(chapterNo, styleTemplate, { numberFormat });

  const finalTitle = suffix ? `${prefix} ${suffix}` : prefix;
  const hasConflict = detectedNo !== null && detectedNo !== chapterNo;

  return {
    chapterNo,
    styleTemplate,
    prefix,
    suffix,
    input,
    strippedInput: stripped,
    finalTitle,
    detectedNo,
    hasConflict,
  };
}
