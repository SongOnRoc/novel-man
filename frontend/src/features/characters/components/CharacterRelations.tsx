"use client";

import React, { useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Node,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCharacterList } from "@/hooks/character/useCharacters";
import { useRelationshipList } from "@/hooks/relationship/useRelationshipService";
import type { RelationshipsRelationshipResponse as Relationship } from "@/lib/api/generated/api10.schemas";
import type {
  Character,
  CharacterList,
} from "@/lib/services/characters.service";
import type { RelationshipListResponse } from "@/lib/services/relationship.service";

import CharacterNode from "./CharacterNode";


interface CharacterRelationsProps {
  characterId: string;
}

const nodeTypes = {
  character: CharacterNode,
};

export const CharacterRelations: React.FC<CharacterRelationsProps> = ({
  characterId,
}) => {
  const { data: charactersResponse } = useCharacterList({});
  const {
    data: relationshipsResponse,
    isLoading,
    error,
  } = useRelationshipList({});

  const characters: Character[] =
    (charactersResponse?.data as CharacterList)?.data || [];
  const allRelationships: Relationship[] =
    (relationshipsResponse?.data as RelationshipListResponse)?.data || [];

  const { nodes, edges } = useMemo(() => {
    const currentId = Number(characterId);
    if (isNaN(currentId) || !allRelationships.length || !characters.length) {
      return { nodes: [], edges: [] };
    }

    const characterMap = new Map(characters.map((c) => [c.id, c]));
    const nodesSet = new Map<number, Node>();

    const mainCharacter = characterMap.get(currentId);
    if (mainCharacter?.id) {
      nodesSet.set(mainCharacter.id, {
        id: mainCharacter.id.toString(),
        type: "character",
        position: { x: 250, y: 0 },
        data: {
          label: mainCharacter.name,
          avatar: mainCharacter.avatar_url,
        },
      });
    }

    const relatedRelationships = allRelationships.filter(
      (rel) =>
        rel.source_entity_id === currentId || rel.target_entity_id === currentId,
    );

    const finalEdges: Edge[] = relatedRelationships
      .map((rel) => {
        const sourceId = rel.source_entity_id;
        const targetId = rel.target_entity_id;

        if (!sourceId || !targetId) return null;

        [sourceId, targetId].forEach((id) => {
          if (!nodesSet.has(id)) {
            const character = characterMap.get(id);
            if (character?.id) {
              nodesSet.set(id, {
                id: character.id.toString(),
                type: "character",
                position: {
                  x: Math.random() * 400,
                  y: Math.random() * 400,
                },
                data: {
                  label: character.name,
                  avatar: character.avatar_url,
                },
              });
            }
          }
        });

        const edge: Edge = {
          id: `e${sourceId}-${targetId}-${rel.id}`,
          source: sourceId.toString(),
          target: targetId.toString(),
          animated: true,
        };

        if (rel.relationship_type) {
          edge.label = rel.relationship_type;
        }

        return edge;
      })
      .filter((edge): edge is Edge => edge !== null);

    return { nodes: Array.from(nodesSet.values()), edges: finalEdges };
  }, [allRelationships, characters, characterId]);

  if (isLoading) {
    return <div>加载关系数据中...</div>;
  }

  if (error) {
    return <div>加载关系数据失败: {error.message}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>关系网络</CardTitle>
      </CardHeader>
      <CardContent>
        {nodes.length > 1 ? (
          <div className="relative h-96 w-full border rounded-lg">
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        ) : (
          <p className="text-muted-foreground">暂无足够的关系数据可供展示。</p>
        )}
      </CardContent>
    </Card>
  );
};