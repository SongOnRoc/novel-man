import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as aiApi from "@/lib/api/ai";
import {
  usePolishTextMutation,
  useGetCompletionMutation,
  useGenerateOutlineMutation,
  useCreateCharacterMutation,
} from "./useAIAssistant";
import {
  PolishTextRequest,
  GetCompletionRequest,
  GenerateOutlineRequest,
  CreateCharacterRequest,
} from "@/types/ai";

// Mock the AI API module
vi.mock("@/lib/api/ai");

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
    it("should call polishText and return result", async () => {
      const mockData = { polished_text: "Polished text" };
      const spy = vi.spyOn(aiApi, "polishText").mockResolvedValue(mockData);
      const { result } = renderHook(() => usePolishTextMutation(), { wrapper });

      const params: PolishTextRequest = { text: "some text" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useGetCompletionMutation", () => {
    it("should call getCompletion and return result", async () => {
      const mockData = { completion: "Completed text" };
      const spy = vi.spyOn(aiApi, "getCompletion").mockResolvedValue(mockData);
      const { result } = renderHook(() => useGetCompletionMutation(), {
        wrapper,
      });

      const params: GetCompletionRequest = { text: "some text" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });

  describe("useGenerateOutlineMutation", () => {
    it("should call generateOutline and return result", async () => {
      const mockData = { outline: "Generated outline" };
      const spy = vi
        .spyOn(aiApi, "generateOutline")
        .mockResolvedValue(mockData);
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
    it("should call createCharacter and return result", async () => {
      const mockData = {
        name: "Test Character",
        background_story: "A story",
        personality_desc: "A personality",
      };
      const spy = vi
        .spyOn(aiApi, "createCharacter")
        .mockResolvedValue(mockData);
      const { result } = renderHook(() => useCreateCharacterMutation(), {
        wrapper,
      });

      const params: CreateCharacterRequest = { description: "A description" };
      result.current.mutate(params);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(spy).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockData);
    });
  });
});
