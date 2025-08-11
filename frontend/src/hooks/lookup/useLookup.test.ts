import React from "react";
import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useLookup } from "./useLookup";
import { useCharacters } from "@/hooks/character/useCharacters";
import { useWorldbuilding } from "@/hooks/worldbuilding/useWorldbuilding";
import { Character } from "@/types/character";
import { WorldItem } from "@/types/worldbuilding";

// Mock the dependencies
vi.mock("@/hooks/character/useCharacters");
vi.mock("@/hooks/worldbuilding/useWorldbuilding");

const mockCharacters: Character[] = [
  {
    id: "1",
    workId: "work-1",
    name: "Hero",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    workId: "work-1",
    name: "Villian",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockWorldItems: WorldItem[] = [
  {
    id: "1",
    workId: "work-1",
    name: "Magic Sword",
    description: "A powerful artifact",
    type: "item",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    workId: "work-1",
    name: "Lost City",
    description: "A hidden place",
    type: "location",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("useLookup", () => {
  const mockGetCharactersByWorkId = vi.fn();
  const mockGetWorldItemsByWorkId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useCharacters as ReturnType<typeof vi.fn>).mockReturnValue({
      getCharactersByWorkId: mockGetCharactersByWorkId,
    });

    (useWorldbuilding as ReturnType<typeof vi.fn>).mockReturnValue({
      getWorldItemsByWorkId: mockGetWorldItemsByWorkId,
    });
  });

  it("should load settings and set initial data", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockGetWorldItemsByWorkId.mockResolvedValue(mockWorldItems);

    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual(mockCharacters);
    expect(result.current.worldItems).toEqual(mockWorldItems);
    expect(mockGetCharactersByWorkId).toHaveBeenCalledWith("work-1");
    expect(mockGetWorldItemsByWorkId).toHaveBeenCalledWith("work-1");
  });

  it("should handle loading error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockGetCharactersByWorkId.mockRejectedValue(new Error("Failed to fetch"));
    mockGetWorldItemsByWorkId.mockResolvedValue(mockWorldItems); // Assume this one succeeds or also fails
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([]);
    expect(result.current.worldItems).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load settings:",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should filter characters and world items based on search query", async () => {
    mockGetCharactersByWorkId.mockResolvedValue(mockCharacters);
    mockGetWorldItemsByWorkId.mockResolvedValue(mockWorldItems);
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
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
    mockGetWorldItemsByWorkId.mockResolvedValue(mockWorldItems);
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
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
    mockGetWorldItemsByWorkId.mockResolvedValue(mockWorldItems);
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
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
    mockGetWorldItemsByWorkId.mockRejectedValue(
      new Error("World fetch failed"),
    );

    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.characters).toEqual([]); // On error, all data is cleared
    expect(result.current.worldItems).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("should handle search when original data is empty", async () => {
    mockGetCharactersByWorkId.mockResolvedValue([]);
    mockGetWorldItemsByWorkId.mockResolvedValue([]);
    const { result } = renderHook(() => useLookup());

    await act(async () => {
      await result.current.loadSettings("work-1");
    });

    act(() => {
      result.current.searchSettings("anything");
    });

    expect(result.current.characters).toEqual([]);
    expect(result.current.worldItems).toEqual([]);
  });
});
