/**
 * @file AI Service
 * @description This service handles all AI-related API calls.
 */

import {
  postAiCompletion,
  postAiCreateCharacter,
  postAiGenerateIdea,
  postAiGenerateOutline,
  postAiPolish,
} from '@/lib/api/generated/ai/ai';
import type {
  ModelsCompletionRequest,
  ModelsCreateCharacterRequest,
  ModelsGenerateIdeaRequest,
  ModelsGenerateOutlineRequest,
  ModelsPolishRequest,
  ModelsAIContext,
  ModelsPolishResponse,
  ModelsCompletionResponse,
  ModelsGenerateOutlineResponse,
  ModelsCreateCharacterResponse,
} from '@/lib/api/generated/api10.schemas';

// =================================================================
// Re-exporting Core AI Types for Application-wide Use
// =================================================================
export type CompletionRequest = ModelsCompletionRequest;
export type CreateCharacterRequest = ModelsCreateCharacterRequest;
export type GenerateIdeaRequest = ModelsGenerateIdeaRequest;
export type GenerateOutlineRequest = ModelsGenerateOutlineRequest;
export type PolishRequest = ModelsPolishRequest;
export type AIContext = ModelsAIContext;

export type PolishResponse = ModelsPolishResponse;
export type CompletionResponse = ModelsCompletionResponse;
export type GenerateOutlineResponse = ModelsGenerateOutlineResponse;
export type CreateCharacterResponse = ModelsCreateCharacterResponse;

export type AIPromptType =
  | "expand"
  | "summarize"
  | "rewrite"
  | "plot-idea"
  | "character-design"
  | "world-building"
  | "dialogue"
  | "text-polish";

export interface AIGenerateParams {
  promptType: AIPromptType;
  writingStyle?: "humorous" | "formal" | "descriptive";
  selectedText?: string;
}

/**
 * Completes text based on the provided prompt and context.
 * @param data - The completion request data.
 * @returns A promise that resolves with the unwrapped completion data.
 */
export const getCompletionService = async (
  data: CompletionRequest
): Promise<CompletionResponse> => {
  const response = await postAiCompletion(data);
  return response.data as CompletionResponse;
};

/**
 * Creates a character based on the provided description and context.
 * @param data - The create character request data.
 * @returns A promise that resolves with the unwrapped character data.
 */
export const createCharacterService = async (
  data: CreateCharacterRequest
): Promise<CreateCharacterResponse> => {
  const response = await postAiCreateCharacter(data);
  return response.data as CreateCharacterResponse;
};

/**
 * Generates an idea based on the provided text and context.
 * @param data - The generate idea request data.
 * @returns A promise that resolves with the unwrapped idea data.
 */
export const generateIdeaService = async (data: GenerateIdeaRequest) => {
  const response = await postAiGenerateIdea(data);
  return response.data as GenerateIdeaRequest;
};

/**
 * Generates an outline based on the provided text and context.
 * @param data - The generate outline request data.
 * @returns A promise that resolves with the unwrapped outline data.
 */
export const generateOutlineService = async (
  data: GenerateOutlineRequest
): Promise<GenerateOutlineResponse> => {
  const response = await postAiGenerateOutline(data);
  return response.data as GenerateOutlineResponse;
};

/**
 * Polishes the provided text based on context.
 * @param data - The polish request data.
 * @returns A promise that resolves with the unwrapped polish data.
 */
export const polishTextService = async (
  data: PolishRequest
): Promise<PolishResponse> => {
  const response = await postAiPolish(data);
  return response.data as PolishResponse;
};