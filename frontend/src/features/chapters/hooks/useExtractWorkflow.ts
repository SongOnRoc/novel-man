/**
 * @file 智能提取工作流 Hook
 * @description 统一管理：触发提取、当前激活的 kind、候选忽略、错误重试。
 * 不直接持有 Character/Worldview 数据；由外部传入用于名称匹配。
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import type { Character } from "@/lib/services/characters.service";
import type { WorldviewItem } from "@/lib/services/worldview.service";

import { applyCandidateMatching } from "../lib/extractMatcher";
import {
  ExtractParseError,
} from "../lib/extractParser";
import { runExtractService, type ExtractServiceInput } from "../lib/extractService";
import {
  EXTRACT_KIND_ORDER,
  type ExtractCandidate,
  type ExtractCandidateMap,
  type ExtractKind,
  type ExtractResult,
  type ExtractStatus,
  type ExtractedTerm,
} from "../lib/extractTypes";

const DEFAULT_ERROR = "智能提取失败，请稍后重试。";

interface ExtractRequest {
  chapterTitle: string;
  paragraphs: string[];
  scope: "combined" | ExtractKind;
}

export interface UseExtractWorkflowOptions {
  chapterTitle?: string;
  characters?: Character[];
  worldviewItems?: WorldviewItem[];
}

export interface ExtractWorkflowState {
  isOpen: boolean;
  status: ExtractStatus;
  errorMessage?: string;
  activeKind: ExtractKind;
  result?: ExtractResult;
  candidates: ExtractCandidateMap;
  visibleCandidates: ExtractCandidate[];
  terms: ExtractedTerm[];
  ignoredIds: Set<string>;
  pendingCount: number;
}

export function useExtractWorkflow(options: UseExtractWorkflowOptions = {}): ExtractWorkflowState & {
  open: (request: ExtractRequest) => void;
  close: () => void;
  setActiveKind: (kind: ExtractKind) => void;
  retry: () => void;
  ignoreCandidate: (id: string) => void;
  restoreCandidate: (id: string) => void;
} {
  const requestIdRef = useRef(0);
  const lastRequestRef = useRef<ExtractRequest | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ExtractStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [activeKind, setActiveKind] = useState<ExtractKind>("characters");
  const [result, setResult] = useState<ExtractResult | undefined>();
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());

  const candidates = useMemo<ExtractCandidateMap>(() => {
    if (!result) {
      return { characters: [], worldview: [], outline: [] };
    }
    return applyCandidateMatching(result.candidates, options.characters, options.worldviewItems);
  }, [result, options.characters, options.worldviewItems]);

  const visibleCandidates = useMemo<ExtractCandidate[]>(() => {
    return (candidates[activeKind] ?? []).filter((candidate) => !ignoredIds.has(candidate.id));
  }, [candidates, activeKind, ignoredIds]);

  const pendingCount = useMemo(() => {
    let count = 0;
    for (const kind of EXTRACT_KIND_ORDER) {
      for (const candidate of candidates[kind]) {
        if (!ignoredIds.has(candidate.id) && candidate.match.status !== "matched") {
          count += 1;
        }
      }
    }
    return count;
  }, [candidates, ignoredIds]);

  const run = useCallback(async (request: ExtractRequest) => {
    lastRequestRef.current = request;
    const id = requestIdRef.current + 1;
    requestIdRef.current = id;

    setIsOpen(true);
    setStatus("loading");
    setErrorMessage(undefined);
    setIgnoredIds(new Set());

    try {
      const input: ExtractServiceInput = {
        scope: request.scope,
        chapterTitle: request.chapterTitle,
        paragraphs: request.paragraphs,
      };
      const data = await runExtractService(input);
      if (requestIdRef.current !== id) {
        return;
      }
      setResult(data);
      setStatus("success");
      const firstKind = EXTRACT_KIND_ORDER.find((kind) => data.candidates[kind].length > 0);
      if (firstKind) {
        setActiveKind(firstKind);
      }
    } catch (error) {
      if (requestIdRef.current !== id) {
        return;
      }
      setResult(undefined);
      setStatus("error");
      setErrorMessage(
        error instanceof ExtractParseError
          ? error.message
          : error instanceof Error
            ? error.message
            : DEFAULT_ERROR,
      );
    }
  }, []);

  const open = useCallback(
    (request: ExtractRequest) => {
      void run(request);
    },
    [run],
  );

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const retry = useCallback(() => {
    if (lastRequestRef.current) {
      void run(lastRequestRef.current);
    }
  }, [run]);

  const ignoreCandidate = useCallback((id: string) => {
    setIgnoredIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const restoreCandidate = useCallback((id: string) => {
    setIgnoredIds((current) => {
      if (!current.has(id)) {
        return current;
      }
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  return {
    isOpen,
    status,
    errorMessage,
    activeKind,
    result,
    candidates,
    visibleCandidates,
    terms: result?.terms ?? [],
    ignoredIds,
    pendingCount,
    open,
    close,
    setActiveKind,
    retry,
    ignoreCandidate,
    restoreCandidate,
  };
}
