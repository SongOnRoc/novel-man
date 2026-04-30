/**
 * @file 智能提取的核心数据类型
 * @description 章节智能提取使用统一的富卡片模型 `ExtractCandidate[]`，
 * 替换旧版 `{ heading, summary, items: string[] }` 列表结构。
 */

export type ExtractKind = "characters" | "worldview" | "outline";

export type ExtractStatus = "idle" | "loading" | "success" | "error";

export type CandidateMatchStatus = "matched" | "suspect" | "unmatched";

export interface CandidateMatch {
  status: CandidateMatchStatus;
  targetId?: number;
  targetType?: ExtractKind;
  matchInfo?: string;
  confidence?: number;
}

export interface IdentityAnchorFacet {
  label: string;
  value: string;
}

export interface IdentityAnchor {
  title?: string;
  facets: IdentityAnchorFacet[];
}

export interface ExtractRelatedEntity {
  kind: ExtractKind;
  name: string;
}

export interface ExtractSegmentRef {
  id: string;
  label: string;
}

export interface ExtractCandidate {
  id: string;
  kind: ExtractKind;
  name: string;
  subtitle?: string;
  description: string;
  match: CandidateMatch;
  identityAnchor?: IdentityAnchor;
  relatedEntities?: ExtractRelatedEntity[];
  segments?: ExtractSegmentRef[];
  matchEvidence?: string;
}

export interface ExtractedTerm {
  text: string;
  kind: ExtractKind;
  candidateId?: string;
}

export type ExtractCandidateMap = Record<ExtractKind, ExtractCandidate[]>;

export interface ExtractResult {
  chapterTitle: string;
  candidates: ExtractCandidateMap;
  terms: ExtractedTerm[];
  rawResponse?: string;
}

export const EXTRACT_KIND_ORDER: ExtractKind[] = ["characters", "worldview", "outline"];

export const EXTRACT_KIND_LABEL: Record<ExtractKind, string> = {
  characters: "角色",
  worldview: "世界观",
  outline: "纲要",
};

/**
 * 对象词高亮：使用全局 token，与状态色映射保持一致。
 * 角色=primary teal、世界观=neutral 蓝灰、纲要=accent coral。
 */
export const EXTRACT_KIND_TOKEN_CLASS: Record<ExtractKind, string> = {
  characters: "text-[var(--primary-700)] bg-[var(--primary-50)]",
  worldview: "text-[var(--neutral-700)] bg-[var(--neutral-100)]",
  outline: "text-[var(--accent-700)] bg-[var(--accent-50)]",
};

export const EXTRACT_KIND_BADGE_CLASS: Record<ExtractKind, string> = {
  characters: "bg-[var(--primary-50)] text-[var(--primary-700)] border-[var(--primary-200)]",
  worldview: "bg-[var(--neutral-100)] text-[var(--neutral-700)] border-[var(--neutral-200)]",
  outline: "bg-[var(--accent-50)] text-[var(--accent-700)] border-[var(--accent-200)]",
};
