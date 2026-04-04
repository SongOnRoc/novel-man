"use client";

import { useCallback, useRef, useState } from "react";

import {
  generateChapterAnalysisResult,
  type ChapterAnalysisKind,
  type ChapterAnalysisResult,
  type ChapterAnalysisStatus,
} from "@/features/chapters/lib/chapterAnalysis";

interface AnalysisRequest {
  kind: ChapterAnalysisKind;
  chapterTitle: string;
  paragraphs: string[];
  inputLabel?: string;
}

interface ChapterAnalysisState {
  isOpen: boolean;
  inputLabel?: string;
  analysisKind: ChapterAnalysisKind;
  result?: ChapterAnalysisResult;
  status: ChapterAnalysisStatus;
  errorMessage?: string;
}

const DEFAULT_ERROR_MESSAGE = "分析失败，请稍后重试。";

export function useChapterAnalysis(chapterTitleFallback = "章节工作区") {
  const requestRef = useRef<AnalysisRequest | null>(null);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<ChapterAnalysisState>({
    isOpen: false,
    inputLabel: undefined,
    analysisKind: "outline",
    result: undefined,
    status: "idle",
    errorMessage: undefined,
  });

  const runAnalysis = useCallback(async (request: AnalysisRequest) => {
    requestRef.current = request;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((current) => ({
      ...current,
      isOpen: true,
      inputLabel: request.inputLabel,
      analysisKind: request.kind,
      result: undefined,
      status: "loading",
      errorMessage: undefined,
    }));

    try {
      const result = await generateChapterAnalysisResult({
        kind: request.kind,
        chapterTitle: request.chapterTitle,
        paragraphs: request.paragraphs,
      });

      if (requestIdRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        analysisKind: request.kind,
        inputLabel: request.inputLabel,
        result,
        status: "success",
        errorMessage: undefined,
      }));
    } catch (error) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setState((current) => ({
        ...current,
        analysisKind: request.kind,
        inputLabel: request.inputLabel,
        result: undefined,
        status: "error",
        errorMessage: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
      }));
    }
  }, []);

  const openAnalysisFor = useCallback(
    (kind: ChapterAnalysisKind, paragraphs: string[], inputLabel?: string, chapterTitle?: string) => {
      void runAnalysis({
        kind,
        paragraphs,
        inputLabel,
        chapterTitle: chapterTitle || chapterTitleFallback,
      });
    },
    [chapterTitleFallback, runAnalysis],
  );

  const closeAnalysis = useCallback(() => {
    setState((current) => ({
      ...current,
      isOpen: false,
    }));
  }, []);

  const retryAnalysis = useCallback(() => {
    if (!requestRef.current) {
      return;
    }

    void runAnalysis(requestRef.current);
  }, [runAnalysis]);

  return {
    ...state,
    openAnalysisFor,
    closeAnalysis,
    retryAnalysis,
  };
}
