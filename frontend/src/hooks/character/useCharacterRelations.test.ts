// frontend/src/hooks/character/useCharacterRelations.test.ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCharacterRelations } from "./useCharacterRelations";

import { Character, RelationshipType } from "@/types/character";

// Mock data for tests
const mockAllCharacters: Character[] = [
  { id: "1", name: "主角", workId: "w1", createdAt: "", updatedAt: "" },
  { id: "2", name: "挚友", workId: "w1", createdAt: "", updatedAt: "" },
  { id: "3", name: "导师", workId: "w1", createdAt: "", updatedAt: "" },
  { id: "4", name: "宿敌", workId: "w1", createdAt: "", updatedAt: "" },
  { id: "5", name: "恋人", workId: "w1", createdAt: "", updatedAt: "" },
];

// Mock Date.now to make IDs predictable
vi.spyOn(Date, "now").mockReturnValue(1234567890);

describe("useCharacterRelations", () => {
  const characterId = "1";

  // Reset localStorage before each test
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return initial nodes and edges correctly", () => {
    const { result } = renderHook(() =>
      useCharacterRelations(characterId, mockAllCharacters)
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.nodes).toHaveLength(5);
    // Initial data comes from mock file
    expect(result.current.edges).toHaveLength(4);

    const mainNode = result.current.nodes.find((n) => n.id === characterId);
    expect(mainNode?.type).toBe("input");
    expect(mainNode?.data?.label).toBe("主角");
  });

  it("should add a new relation when onConnect is called", () => {
    const { result } = renderHook(() =>
      useCharacterRelations(characterId, mockAllCharacters)
    );

    const connection = {
      source: "1",
      target: "5",
      sourceHandle: null,
      targetHandle: null,
    };

    act(() => {
      result.current.onConnect(connection);
    });

    expect(result.current.edges).toHaveLength(5);
    const newEdge = result.current.edges.find((e) => e.id === "rel-1234567890");
    expect(newEdge).toBeDefined();
    expect(newEdge?.source).toBe("1");
    expect(newEdge?.target).toBe("5");
    expect(newEdge?.label).toBe("friend"); // Default type
  });

  it("should update a relation type", () => {
    const { result } = renderHook(() =>
      useCharacterRelations(characterId, mockAllCharacters)
    );

    const relationToUpdate = "rel-2"; // from mock data
    const newType: RelationshipType = "master";

    act(() => {
      result.current.updateRelationType(relationToUpdate, newType);
    });

    const updatedEdge = result.current.edges.find(
      (e) => e.id === relationToUpdate
    );
    expect(updatedEdge?.label).toBe(newType);
  });

  it("should delete a relation", () => {
    const { result } = renderHook(() =>
      useCharacterRelations(characterId, mockAllCharacters)
    );

    const relationToDelete = "rel-1";
    expect(result.current.edges.some((e) => e.id === relationToDelete)).toBe(
      true
    );

    act(() => {
      result.current.deleteRelation(relationToDelete);
    });

    expect(result.current.edges).toHaveLength(3);
    expect(result.current.edges.some((e) => e.id === relationToDelete)).toBe(
      false
    );
  });

  it("should correctly calculate nodes and edges based on relations", () => {
    const { result } = renderHook(() =>
      useCharacterRelations(characterId, mockAllCharacters)
    );

    // Initially 4 edges from mock
    expect(result.current.edges).toHaveLength(4);

    // Add a connection
    act(() => {
      result.current.onConnect({
        source: "2",
        target: "3",
        sourceHandle: null,
        targetHandle: null,
      });
    });

    // Now 5 edges
    expect(result.current.edges).toHaveLength(5);
    expect(result.current.nodes).toHaveLength(5); // Node count should be stable
  });
});
