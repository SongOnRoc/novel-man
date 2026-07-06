import { renderHook, act } from "@testing-library/react";
import React from "react";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { useCharacterLookup } from "@/hooks/character/useCharacters";
import { useWorldviewItems } from "@/hooks/worldbuilding/useWorldviewService";
// types from legacy tests are not used in this codebase; keep test data as `any`.

import { useLookup } from "./useLookup";

// Mock the dependencies
vi.mock("@/hooks/character/useCharacters");
vi.mock("@/hooks/worldbuilding/useWorldviewService");

const mockCharacters: any[] = [
  {
    id: "1",
    work_id: 1,
    name: "Hero",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    work_id: 1,
    name: "Villian",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockWorldItems: any[] = [
  {
    id: "1",
    work_id: 1,
    name: "Magic Sword",
    description: "A powerful artifact",
    type: "item",
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    work_id: 1,
    name: "Lost City",
    description: "A hidden place",
    type: "location",
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe("useLookup", () => {
  const mockGetCharactersByWorkId = vi.fn();
  const mockWorldviewItemsQuery = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useCharacterLookup as ReturnType<typeof vi.fn>).mockReturnValue({
      getCharactersByWorkId: mockGetCharactersByWorkId,
    });

    (useWorldviewItems as ReturnType<typeof vi.fn>).mockImplementation(
      (...args: any[]) => mockWorldviewItemsQuery(...args)
    );
  });

  it("should load settings and set initial data", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockWorldviewItemsQuery.mockReturnValue({
      data: mockWorldItems,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual(mockCharacters);
    expect(result.current.worldItems).toEqual(mockWorldItems);
    expect(mockGetCharactersByWorkId).toHaveBeenCalledWith("1");
  });

  it("should handle loading error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetCharactersByWorkId.mockRejectedValue(new Error("Failed to fetch"));
    mockWorldviewItemsQuery.mockReturnValue({
      data: mockWorldItems,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([]);
    expect(result.current.worldItems).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load settings:",
      expect.any(Error)
    );
    consoleErrorSpy.mockRestore();
  });

  it("should filter characters and world items based on search query", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockWorldviewItemsQuery.mockReturnValue({
      data: mockWorldItems,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    act(() => {
      result.current.searchSettings("hero");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([mockCharacters[0]]);
    expect(result.current.worldItems).toEqual([]);
  });

  it("should filter case-insensitively", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockWorldviewItemsQuery.mockReturnValue({
      data: mockWorldItems,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    act(() => {
      result.current.searchSettings("CITY");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([]);
    expect(result.current.worldItems).toEqual([mockWorldItems[1]]);
  });

  it("should reset to original data when search query is empty", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockWorldviewItemsQuery.mockReturnValue({
      data: mockWorldItems,
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    act(() => {
      result.current.searchSettings("hero");
    });

    expect(result.current.characters).not.toEqual(mockCharacters);

    act(() => {
      result.current.searchSettings("");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual(mockCharacters);
    expect(result.current.worldItems).toEqual(mockWorldItems);
  });

  it("should handle partial success when one data fetch fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockWorldviewItemsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("World fetch failed"),
    });

    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([]); // On error, all data is cleared
    expect(result.current.worldItems).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should handle search when original data is empty", async () => {
    mockGetCharactersByWorkId.mockResolvedValue([]);
    mockWorldviewItemsQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("1");
    });

    act(() => {
      result.current.searchSettings("anything");
    });

    expect(result.current.characters).toEqual([]);
    expect(result.current.worldItems).toEqual([]);
  });
});
