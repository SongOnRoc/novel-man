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
} from '@/lib/api/generated/api10.schemas';

// =================================================================
// Re-exporting Core AI Types for Application-wide Use
// =================================================================
export type CompletionRequest = ModelsCompletionRequest;
export type CreateCharacterRequest = ModelsCreateCharacterRequest;
export type GenerateIdeaRequest = ModelsGenerateIdeaRequest;
export type GenerateOutlineRequest = ModelsGenerateOutlineRequest;
export type PolishRequest = ModelsPolishRequest;

/**
 * Completes text based on the provided prompt and context.
 * @param data - The completion request data.
 * @returns A promise that resolves with the completion response.
 */
export const getCompletionService = (data: CompletionRequest) => {
  return postAiCompletion(data);
};

/**
 * Creates a character based on the provided description and context.
 * @param data - The create character request data.
 * @returns A promise that resolves with the create character response.
 */
export const createCharacterService = (data: CreateCharacterRequest) => {
  return postAiCreateCharacter(data);
};

/**
 * Generates an idea based on the provided text and context.
 * @param data - The generate idea request data.
 * @returns A promise that resolves with the generate idea response.
 */
export const generateIdeaService = (data: GenerateIdeaRequest) => {
  return postAiGenerateIdea(data);
};

/**
 * Generates an outline based on the provided text and context.
 * @param data - The generate outline request data.
 * @returns A promise that resolves with the generate outline response.
 */
export const generateOutlineService = (data: GenerateOutlineRequest) => {
  return postAiGenerateOutline(data);
};

/**
 * Polishes the provided text based on context.
 * @param data - The polish request data.
 * @returns A promise that resolves with the polish response.
 */
export const polishTextService = (data: PolishRequest) => {
  return postAiPolish(data);
};