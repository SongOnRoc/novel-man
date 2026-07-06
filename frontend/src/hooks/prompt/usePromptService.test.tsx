import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usePromptList,
  usePromptById,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
} from "./usePromptService";
import {
  getPromptsService,
  getPromptByIdService,
  createPromptService,
  updatePromptService,
  deletePromptService,
} from "@/lib/services/prompt.service";
import { toCamelCase } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock the services
vi.mock("@/lib/services/prompt.service", () => ({
  getPromptsService: vi.fn(),
  getPromptByIdService: vi.fn(),
  createPromptService: vi.fn(),
  updatePromptService: vi.fn(),
  deletePromptService: vi.fn(),
}));

// Mock utility functions
vi.mock("@/lib/utils", () => ({
  toCamelCase: vi.fn((data) => data), // Simple pass-through for testing
}));

// Mock react-query hooks
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("usePromptService Hooks", () => {
  let mockQueryClient: { invalidateQueries: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    (useQueryClient as any).mockReturnValue(mockQueryClient);
  });

  // Test usePromptList
  describe("usePromptList", () => {
    it("should call useQuery with correct queryKey and queryFn", () => {
      const params = { page: 1, limit: 10 };
      (useQuery as any).mockReturnValue({ data: [], isLoading: false });

      renderHook(() => usePromptList(params), { wrapper });

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["prompts", "list", params],
          queryFn: expect.any(Function),
          select: expect.any(Function),
        })
      );

      const queryFn = (useQuery as any).mock.calls[0][0].queryFn;
      queryFn();
      expect(getPromptsService).toHaveBeenCalledWith(params);

      const selectFn = (useQuery as any).mock.calls[0][0].select;
      selectFn({ some_data: "value" });
      expect(toCamelCase).toHaveBeenCalledWith({ some_data: "value" });
    });
  });

  // Test usePromptById
  describe("usePromptById", () => {
    it("should call useQuery with correct queryKey, queryFn, and enabled flag", () => {
      const id = 1;
      (useQuery as any).mockReturnValue({ data: {}, isLoading: false });

      renderHook(() => usePromptById(id), { wrapper });

      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ["prompts", "detail", id],
          queryFn: expect.any(Function),
          select: expect.any(Function),
          enabled: true,
        })
      );

      const queryFn = (useQuery as any).mock.calls[0][0].queryFn;
      queryFn();
      expect(getPromptByIdService).toHaveBeenCalledWith(id);

      const selectFn = (useQuery as any).mock.calls[0][0].select;
      selectFn({ some_detail: "value" });
      expect(toCamelCase).toHaveBeenCalledWith({ some_detail: "value" });
    });

    it("should be disabled if id is not provided", () => {
      (useQuery as any).mockReturnValue({ data: {}, isLoading: false });
      renderHook(() => usePromptById(0), { wrapper });
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          enabled: false,
        })
      );
    });
  });

  // Test useCreatePrompt
  describe("useCreatePrompt", () => {
    it("should call useMutation with correct mutationFn and onSuccess", async () => {
      const mockMutation = { mutate: vi.fn() };
      (useMutation as any).mockReturnValue(mockMutation);
      const { result } = renderHook(() => useCreatePrompt(), { wrapper });

      expect(useMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
        })
      );

      const mutationFn = (useMutation as any).mock.calls[0][0].mutationFn;
      const newPrompt = { name: "Test", content: "Test content" };
      mutationFn(newPrompt);
      expect(createPromptService).toHaveBeenCalledWith(newPrompt);

      const onSuccess = (useMutation as any).mock.calls[0][0].onSuccess;
      onSuccess();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["prompts", "list"],
      });
    });
  });

  // Test useUpdatePrompt
  describe("useUpdatePrompt", () => {
    it("should call useMutation with correct mutationFn and onSuccess", async () => {
      const mockMutation = { mutate: vi.fn() };
      (useMutation as any).mockReturnValue(mockMutation);
      const { result } = renderHook(() => useUpdatePrompt(), { wrapper });

      expect(useMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
        })
      );

      const mutationFn = (useMutation as any).mock.calls[0][0].mutationFn;
      const updatedPrompt = { id: 1, data: { name: "Updated" } };
      mutationFn(updatedPrompt);
      expect(updatePromptService).toHaveBeenCalledWith(
        updatedPrompt.id,
        updatedPrompt.data
      );

      const onSuccess = (useMutation as any).mock.calls[0][0].onSuccess;
      onSuccess(null, { id: 1 });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["prompts", "list"],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["prompts", "detail", 1],
      });
    });
  });

  // Test useDeletePrompt
  describe("useDeletePrompt", () => {
    it("should call useMutation with correct mutationFn and onSuccess", async () => {
      const mockMutation = { mutate: vi.fn() };
      (useMutation as any).mockReturnValue(mockMutation);
      const { result } = renderHook(() => useDeletePrompt(), { wrapper });

      expect(useMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationFn: expect.any(Function),
          onSuccess: expect.any(Function),
        })
      );

      const mutationFn = (useMutation as any).mock.calls[0][0].mutationFn;
      const idToDelete = 1;
      mutationFn(idToDelete);
      expect(deletePromptService).toHaveBeenCalledWith(idToDelete);

      const onSuccess = (useMutation as any).mock.calls[0][0].onSuccess;
      onSuccess();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ["prompts", "list"],
      });
    });
  });
});
