/**
 * @file AI Service
 * @description This service handles all AI-related API calls using the new generate endpoint.
 */

import { postGenerate } from "@/lib/api/generated/generate/generate";
import type {
  ModelsGenerateRequest,
  ModelsGenerateResponse,
  ModelsAIContext,
} from "@/lib/api/generated/api10.schemas";

// =================================================================
// Re-exporting Core AI Types for Application-wide Use
// =================================================================
export type GenerateRequest = ModelsGenerateRequest;
export type GenerateResponse = ModelsGenerateResponse;
export type AIContext = ModelsAIContext;

// Legacy type aliases for backward compatibility
export type CompletionRequest = GenerateRequest;
export type CompletionResponse = GenerateResponse;
export type PolishRequest = GenerateRequest;
export type PolishResponse = GenerateResponse;
export type CreateCharacterRequest = GenerateRequest;
export type CreateCharacterResponse = GenerateResponse;
export type GenerateOutlineRequest = GenerateRequest;
export type GenerateOutlineResponse = GenerateResponse;

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
 * Generic generate service that calls the unified /generate endpoint
 */
const generateService = async (
  data: GenerateRequest
): Promise<GenerateResponse> => {
  const response = await postGenerate(data);
  return response.data as GenerateResponse;
};

/**
 * Completes text based on the provided prompt and context.
 * @param data - The completion request data.
 * @returns A promise that resolves with the unwrapped completion data.
 */
export const getCompletionService = async (
  data: CompletionRequest
): Promise<CompletionResponse> => {
  return generateService(data);
};

/**
 * Creates a character based on the provided description and context.
 * @param data - The create character request data.
 * @returns A promise that resolves with the unwrapped character data.
 */
export const createCharacterService = async (
  data: CreateCharacterRequest
): Promise<CreateCharacterResponse> => {
  return generateService(data);
};

/**
 * Generates an idea based on the provided text and context.
 * @param data - The generate idea request data.
 * @returns A promise that resolves with the unwrapped idea data.
 */
export const generateIdeaService = async (
  data: GenerateRequest
): Promise<GenerateResponse> => {
  return generateService(data);
};

/**
 * Generates an outline based on the provided text and context.
 * @param data - The generate outline request data.
 * @returns A promise that resolves with the unwrapped outline data.
 */
export const generateOutlineService = async (
  data: GenerateOutlineRequest
): Promise<GenerateOutlineResponse> => {
  return generateService(data);
};

/**
 * Polishes the provided text based on context.
 * @param data - The polish request data.
 * @returns A promise that resolves with the unwrapped polish data.
 */
export const polishTextService = async (
  data: PolishRequest
): Promise<PolishResponse> => {
  return generateService(data);
};

/**
 * Service for streaming AI generation.
 * Handles Server-Sent Events (SSE) for real-time text generation.
 *
 * @param data - The generation request parameters
 * @param onData - Callback function invoked when a new text chunk is received
 * @param onError - Callback function invoked when an error occurs
 * @param onComplete - Callback function invoked when generation is complete
 * @returns A function to abort the stream
 */
export const generateStreamService = (
  data: GenerateRequest,
  onData: (text: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): (() => void) => {
  const controller = new AbortController();
  const signal = controller.signal;

  // Ensure stream parameter is set to true
  const requestData = { ...data, stream: true };

  // Use the generated postGenerate function, passing options to configure the request
  // The generated function uses customFetch internally, which supports onData via options
  postGenerate(
    requestData,
    {
      onData: (chunk: any) => {
        // console.log("AI Service Chunk:", chunk);
        if (chunk.error) {
          console.warn("AI Service Error Chunk:", chunk.error);
          onError(new Error(chunk.error));
          return; // Stop processing if there's an error
        }
        if (chunk.content) {
          onData(chunk.content);
        }
        if (chunk.done) {
          onComplete();
        }
      },
    },
    signal
  ).catch((err) => {
    if (err.name !== "AbortError") {
      onError(err);
    }
  });

  return () => controller.abort();
};
