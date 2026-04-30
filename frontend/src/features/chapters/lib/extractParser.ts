/**
 * @file 智能提取响应解析层
 * @description 将 AI 返回的带标记 JSON 文本映射为 `ExtractCandidate[]` 富卡片模型。
 * 设计要点：
 * - 解析成功要求 AI 返回 JSON（直接 JSON 或 ```json fenced block```）
 * - 任何字段缺失走宽松降级（保留可见信息），但若整体不是合法 JSON 则抛错
 *   交由 UI 层进入错误态触发重试。
 */

import {
  EXTRACT_KIND_ORDER,
  type CandidateMatchStatus,
  type ExtractCandidate,
  type ExtractCandidateMap,
  type ExtractKind,
  type ExtractRelatedEntity,
  type ExtractResult,
  type ExtractSegmentRef,
  type ExtractedTerm,
  type IdentityAnchor,
} from "./extractTypes";

export class ExtractParseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "ExtractParseError";
  }
}

interface RawCandidate {
  id?: string | number;
  kind?: string;
  name?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  match?: {
    status?: string;
    target_id?: number;
    targetId?: number;
    target_type?: string;
    targetType?: string;
    match_info?: string;
    matchInfo?: string;
    confidence?: number;
  };
  identity_anchor?: {
    title?: string;
    facets?: { label?: string; value?: string }[];
  };
  identityAnchor?: {
    title?: string;
    facets?: { label?: string; value?: string }[];
  };
  related_entities?: { kind?: string; name?: string }[];
  relatedEntities?: { kind?: string; name?: string }[];
  segments?: { id?: string | number; label?: string }[];
  match_evidence?: string;
  matchEvidence?: string;
}

interface RawTerm {
  text?: string;
  kind?: string;
  candidate_id?: string | number;
  candidateId?: string | number;
}

interface RawResponse {
  candidates?: RawCandidate[];
  terms?: RawTerm[];
}

const VALID_KINDS = new Set<ExtractKind>(["characters", "worldview", "outline"]);

const VALID_STATUSES = new Set<CandidateMatchStatus>(["matched", "suspect", "unmatched"]);

function extractJsonText(text: string): string {
  const fenceMatch = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

function normalizeKind(value?: string): ExtractKind | undefined {
  if (!value) {
    return undefined;
  }
  const lower = value.toLowerCase();
  if (VALID_KINDS.has(lower as ExtractKind)) {
    return lower as ExtractKind;
  }
  if (lower === "character") {
    return "characters";
  }
  if (lower === "plot" || lower === "outline-item") {
    return "outline";
  }
  return undefined;
}

function normalizeStatus(value?: string): CandidateMatchStatus {
  if (!value) {
    return "unmatched";
  }
  const lower = value.toLowerCase();
  if (VALID_STATUSES.has(lower as CandidateMatchStatus)) {
    return lower as CandidateMatchStatus;
  }
  if (lower === "hit" || lower === "exact") {
    return "matched";
  }
  if (lower === "maybe" || lower === "possible") {
    return "suspect";
  }
  return "unmatched";
}

function buildIdentityAnchor(raw?: RawCandidate["identity_anchor"] | RawCandidate["identityAnchor"]): IdentityAnchor | undefined {
  if (!raw) {
    return undefined;
  }
  const facets = (raw.facets ?? [])
    .map((facet) => ({
      label: (facet?.label ?? "").trim(),
      value: (facet?.value ?? "").trim(),
    }))
    .filter((facet) => facet.label || facet.value);
  if (!facets.length && !raw.title) {
    return undefined;
  }
  return {
    title: raw.title?.trim() || undefined,
    facets,
  };
}

function buildRelatedEntities(raw?: RawCandidate["related_entities"] | RawCandidate["relatedEntities"]): ExtractRelatedEntity[] {
  if (!raw?.length) {
    return [];
  }
  return raw
    .map((entry) => {
      const kind = normalizeKind(entry?.kind);
      const name = (entry?.name ?? "").trim();
      if (!kind || !name) {
        return undefined;
      }
      return { kind, name };
    })
    .filter((entry): entry is ExtractRelatedEntity => Boolean(entry));
}

function buildSegments(raw?: RawCandidate["segments"]): ExtractSegmentRef[] {
  if (!raw?.length) {
    return [];
  }
  return raw
    .map((entry, index) => {
      const id = entry?.id != null ? String(entry.id) : `seg-${index + 1}`;
      const label = (entry?.label ?? "").trim() || id;
      return { id, label };
    })
    .filter((entry) => entry.label);
}

function makeCandidateId(kind: ExtractKind, name: string, index: number, hint?: string | number): string {
  if (hint != null && hint !== "") {
    return `${kind}-${hint}`;
  }
  const safe = name.replace(/\s+/g, "-").slice(0, 24) || `c-${index}`;
  return `${kind}-${safe}-${index}`;
}

function buildCandidate(raw: RawCandidate, fallbackKind: ExtractKind | undefined, index: number): ExtractCandidate | undefined {
  const kind = normalizeKind(raw.kind) ?? fallbackKind;
  if (!kind) {
    return undefined;
  }
  const name = (raw.name ?? raw.title ?? "").trim();
  if (!name) {
    return undefined;
  }
  const description = (raw.description ?? "").trim();
  const match = raw.match ?? {};
  return {
    id: makeCandidateId(kind, name, index, raw.id),
    kind,
    name,
    subtitle: raw.subtitle?.trim() || undefined,
    description: description || name,
    match: {
      status: normalizeStatus(match.status),
      targetId: match.targetId ?? match.target_id,
      targetType: normalizeKind(match.targetType ?? match.target_type),
      matchInfo: (match.matchInfo ?? match.match_info)?.trim() || undefined,
      confidence: typeof match.confidence === "number" ? match.confidence : undefined,
    },
    identityAnchor: buildIdentityAnchor(raw.identity_anchor ?? raw.identityAnchor),
    relatedEntities: buildRelatedEntities(raw.related_entities ?? raw.relatedEntities),
    segments: buildSegments(raw.segments),
    matchEvidence: (raw.matchEvidence ?? raw.match_evidence)?.trim() || undefined,
  };
}

function buildTerm(raw: RawTerm): ExtractedTerm | undefined {
  const kind = normalizeKind(raw.kind);
  const text = (raw.text ?? "").trim();
  if (!kind || !text) {
    return undefined;
  }
  return {
    text,
    kind,
    candidateId: raw.candidateId != null
      ? String(raw.candidateId)
      : raw.candidate_id != null
        ? String(raw.candidate_id)
        : undefined,
  };
}

export function emptyCandidateMap(): ExtractCandidateMap {
  return {
    characters: [],
    worldview: [],
    outline: [],
  };
}

export interface ParseExtractOptions {
  chapterTitle: string;
  fallbackKind?: ExtractKind;
}

/**
 * 解析 AI 综合提取返回结果。
 * @throws ExtractParseError 当响应不是合法 JSON 或缺少 candidates 数组时
 */
export function parseExtractResponse(rawText: string | undefined | null, options: ParseExtractOptions): ExtractResult {
  if (!rawText || !rawText.trim()) {
    throw new ExtractParseError("AI 返回为空，无法解析智能提取结果。");
  }

  const jsonText = extractJsonText(rawText);

  let parsed: RawResponse;
  try {
    parsed = JSON.parse(jsonText) as RawResponse;
  } catch (error) {
    throw new ExtractParseError("AI 返回格式不正确，无法解析为 JSON。", error);
  }

  if (!parsed || !Array.isArray(parsed.candidates)) {
    throw new ExtractParseError("AI 返回缺少 candidates 字段，无法解析智能提取结果。");
  }

  const map = emptyCandidateMap();
  parsed.candidates.forEach((raw, index) => {
    const candidate = buildCandidate(raw, options.fallbackKind, index);
    if (candidate) {
      map[candidate.kind].push(candidate);
    }
  });

  const candidateIndex = new Map<string, ExtractCandidate>();
  for (const list of Object.values(map)) {
    for (const candidate of list) {
      candidateIndex.set(`${candidate.kind}:${candidate.name}`, candidate);
    }
  }

  const terms: ExtractedTerm[] = [];
  for (const raw of parsed.terms ?? []) {
    const term = buildTerm(raw);
    if (!term) {
      continue;
    }
    if (!term.candidateId) {
      const candidate = candidateIndex.get(`${term.kind}:${term.text}`);
      if (candidate) {
        term.candidateId = candidate.id;
      }
    }
    terms.push(term);
  }

  for (const kind of EXTRACT_KIND_ORDER) {
    for (const candidate of map[kind]) {
      if (terms.some((term) => term.kind === kind && term.text === candidate.name)) {
        continue;
      }
      terms.push({ text: candidate.name, kind, candidateId: candidate.id });
    }
  }

  return {
    chapterTitle: options.chapterTitle,
    candidates: map,
    terms,
    rawResponse: rawText,
  };
}
