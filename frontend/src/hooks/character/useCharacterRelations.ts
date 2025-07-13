import { useState, useCallback, useMemo, useEffect } from "react";
import { Edge, Node, Connection, MarkerType } from "react-flow-renderer";
import {
  Character,
  CharacterRelationship,
  RelationshipType,
  relationshipTypeMap,
} from "@/types/character";
import { mockRelationships } from "@/lib/mock/character-mock-data";

export function useCharacterRelations(
  characterId: string,
  allCharacters: Character[]
) {
  const [isLoading, setIsLoading] = useState(false);
  // In this mock version, relations are read-only from the mock file.
  const [relations, setRelations] =
    useState<CharacterRelationship[]>(mockRelationships);

  const onConnect = useCallback((params: Connection) => {
    console.log("Mock onConnect called. Params:", params);
    // In a real app, you would create a new relationship here.
    // setRelations(prev => [...prev, newRelation]);
  }, []);

  const updateRelationType = useCallback(
    async (relationId: string, newType: RelationshipType) => {
      setRelations((prev) =>
        prev.map((r) => (r.id === relationId ? { ...r, type: newType } : r))
      );
      return Promise.resolve();
    },
    []
  );

  const deleteRelation = useCallback(async (relationId: string) => {
    setRelations((prev) => prev.filter((r) => r.id !== relationId));
    return Promise.resolve();
  }, []);

  const addRelation = useCallback(
    async (targetId: string, type: RelationshipType) => {
      const newRelation: CharacterRelationship = {
        id: `rel-${Date.now()}-${Math.random()}`,
        sourceId: characterId,
        targetId: targetId,
        type: type,
      };
      setRelations((prev) => [...prev, newRelation]);
      return Promise.resolve();
    },
    [characterId]
  );

  const { nodes, edges, charactersInSameWork } = useMemo(() => {
    const currentCharacter = allCharacters.find((c) => c.id === characterId);
    if (!currentCharacter || !currentCharacter.workId) {
      return { nodes: [], edges: [], charactersInSameWork: [] };
    }

    const charactersInSameWork = allCharacters.filter(
      (c) => c.workId === currentCharacter.workId
    );

    const nodes: Node[] = charactersInSameWork.map((char, index) => ({
      id: char.id,
      type: "characterNode",
      data: { label: char.name, avatar: char.avatar },
      position: {
        x: (index % 4) * 200,
        y: Math.floor(index / 4) * 200,
      },
    }));

    const characterIds = new Set(charactersInSameWork.map((c) => c.id));
    const validRelations = relations.filter(
      (r) => characterIds.has(r.sourceId) && characterIds.has(r.targetId)
    );

    const edges: Edge[] = validRelations.map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
      label: relationshipTypeMap[rel.type] || rel.type,
      type: "default",
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      labelStyle: { fill: "#000", fontWeight: 700 },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: "#fff", color: "#fff", fillOpacity: 0.7 },
    }));

    return { nodes, edges, charactersInSameWork };
  }, [characterId, relations, allCharacters]);

  useEffect(() => {
    setIsLoading(true);
    // Simulate fetching data
    setTimeout(() => {
      setRelations(mockRelationships);
      setIsLoading(false);
    }, 100);
  }, []);

  return {
    nodes,
    edges,
    relations,
    charactersInSameWork,
    isLoading,
    onConnect,
    updateRelationType,
    deleteRelation,
    addRelation,
  };
}
