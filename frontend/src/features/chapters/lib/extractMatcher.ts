/**
 * @file 名称匹配工具
 * @description 前端侧匹配 AI 候选与已有角色/世界观条目：精确名 + 前缀（≥2 字符）。
 */

import type { Character } from "@/lib/services/characters.service";
import type { WorldviewItem } from "@/lib/services/worldview.service";

import {
  type CandidateMatch,
  type CandidateMatchStatus,
  type ExtractCandidate,
  type ExtractCandidateMap,
  type ExtractKind,
} from "./extractTypes";

interface KnownEntry {
  id: number;
  name: string;
  kind: ExtractKind;
}

function collectKnown(characters: Character[], worldviewItems: WorldviewItem[]): KnownEntry[] {
  const entries: KnownEntry[] = [];
  for (const character of characters) {
    if (typeof character.id === "number" && character.name) {
      entries.push({ id: character.id, name: character.name.trim(), kind: "characters" });
    }
  }
  for (const item of worldviewItems) {
    if (typeof item.id === "number" && item.name) {
      entries.push({ id: item.id, name: item.name.trim(), kind: "worldview" });
    }
  }
  return entries;
}

function buildMatchInfo(kind: ExtractKind, name: string, status: CandidateMatchStatus): string {
  const targetLabel = kind === "characters" ? "角色模块" : kind === "worldview" ? "世界观模块" : "纲要模块";
  if (status === "matched") {
    return `已匹配：${targetLabel} / ${name}`;
  }
  if (status === "suspect") {
    return `疑似匹配：${targetLabel} / ${name} · 请人工核对`;
  }
  return "";
}

function matchCandidate(candidate: ExtractCandidate, knownEntries: KnownEntry[]): CandidateMatch {
  const baseMatch = candidate.match ?? { status: "unmatched" };
  if (baseMatch.status === "matched" && baseMatch.targetId) {
    return baseMatch;
  }
  if (candidate.kind === "outline") {
    return baseMatch;
  }

  const sameKindKnown = knownEntries.filter((entry) => entry.kind === candidate.kind);
  const exact = sameKindKnown.find((entry) => entry.name === candidate.name);
  if (exact) {
    return {
      ...baseMatch,
      status: "matched",
      targetId: exact.id,
      targetType: exact.kind,
      matchInfo: baseMatch.matchInfo ?? buildMatchInfo(candidate.kind, exact.name, "matched"),
    };
  }

  if (candidate.name.length >= 2) {
    const prefixHit = sameKindKnown.find(
      (entry) =>
        entry.name.startsWith(candidate.name) || candidate.name.startsWith(entry.name),
    );
    if (prefixHit) {
      return {
        ...baseMatch,
        status: "suspect",
        targetId: prefixHit.id,
        targetType: prefixHit.kind,
        matchInfo: baseMatch.matchInfo ?? buildMatchInfo(candidate.kind, prefixHit.name, "suspect"),
      };
    }
  }

  return {
    ...baseMatch,
    status: "unmatched",
  };
}

/**
 * 对已解析的候选卡片执行前端名称匹配。
 * 已带 `status=matched && targetId` 的候选保持原样。
 */
export function applyCandidateMatching(
  candidates: ExtractCandidateMap,
  characters: Character[] | undefined,
  worldviewItems: WorldviewItem[] | undefined,
): ExtractCandidateMap {
  const knownEntries = collectKnown(characters ?? [], worldviewItems ?? []);

  const next: ExtractCandidateMap = {
    characters: [],
    worldview: [],
    outline: [],
  };

  (Object.keys(candidates) as ExtractKind[]).forEach((kind) => {
    next[kind] = candidates[kind].map((candidate) => ({
      ...candidate,
      match: matchCandidate(candidate, knownEntries),
    }));
  });

  return next;
}
