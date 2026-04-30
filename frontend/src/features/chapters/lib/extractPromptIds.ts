/**
 * @file 智能提取的固定提示词 ID 占位
 * @description 综合提取与专项重提取使用固定 prompt_id；具体数值由后端固定提示词目录提供。
 * 当前以占位常量形式保留，集成时由配置中心或运行时下发覆盖。
 */

export interface ExtractPromptIds {
  combined: number;
  characters: number;
  worldview: number;
  outline: number;
}

const RAW_ENV_OVERRIDE = (() => {
  if (typeof process === "undefined") {
    return undefined;
  }
  return process.env?.NEXT_PUBLIC_EXTRACT_PROMPT_IDS;
})();

const parsed: Partial<ExtractPromptIds> = (() => {
  if (!RAW_ENV_OVERRIDE) {
    return {};
  }
  try {
    const data = JSON.parse(RAW_ENV_OVERRIDE) as Partial<ExtractPromptIds>;
    return data ?? {};
  } catch {
    return {};
  }
})();

export const EXTRACT_PROMPT_IDS: ExtractPromptIds = {
  combined: parsed.combined ?? 0,
  characters: parsed.characters ?? 0,
  worldview: parsed.worldview ?? 0,
  outline: parsed.outline ?? 0,
};
