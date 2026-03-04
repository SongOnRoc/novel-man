import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi } from "vitest";

import {
  usePolishTextMutation,
  useGetCompletionMutation,
  useGenerateOutlineMutation,
  useCreateCharacterMutation,
} from "./useAIAssistant";

import * as aiApi from "@/lib/services/ai.service";
import type {
  PolishRequest,
  CompletionRequest,
  GenerateOutlineRequest,
  CreateCharacterRequest,
} from "@/lib/services/ai.service";

// Mock the AI service module
vi.mock("@/lib/services/ai.service");

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useAIAssistant Hooks", () => {
  describe("usePolishTextMutation", () => {
    it("should call polishTextService and return result", async () => {
      const mockData = { text: "Polished text" };
      const spy = vi
        .spyOn(aiApi, "polishTextService")
        .mockResolvedValue(mockData as any);
      const { result } = renderHook(() => usePolishTextMutation(), { wrapper });

      const params: PolishRequest = { text: "some text" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useGetCompletionMutation", () => {
    it("should call getCompletionService and return result", async () => {
      const mockData = { text: "Completed text" };
      const spy = vi
        .spyOn(aiApi, "getCompletionService")
        .mockResolvedValue(mockData as any);
      const { result } = renderHook(() => useGetCompletionMutation(), {
        wrapper,
      });

      const params: CompletionRequest = { text: "some text" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useGenerateOutlineMutation", () => {
    it("should call generateOutlineService and return result", async () => {
      const mockData = { outline: "Generated outline" };
      const spy = vi
        .spyOn(aiApi, "generateOutlineService")
        .mockResolvedValue(mockData as any);
      const { result } = renderHook(() => useGenerateOutlineMutation(), {
        wrapper,
      });

      const params: GenerateOutlineRequest = { text: "some text" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useCreateCharacterMutation", () => {
    it("should call createCharacterService and return result", async () => {
      const mockData = {
        name: "Test Character",
        background_story: "A story",
        personality_desc: "A personality",
      };
      const spy = vi
        .spyOn(aiApi, "createCharacterService")
        .mockResolvedValue(mockData as any);
      const { result } = renderHook(() => useCreateCharacterMutation(), {
        wrapper,
      });

      const params = { prompt: "A description" } as CreateCharacterRequest;
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });
});
