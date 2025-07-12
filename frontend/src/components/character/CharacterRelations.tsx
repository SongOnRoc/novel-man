// frontend/src/components/character/CharacterRelations.tsx
"use client";

import React from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
} from "react-flow-renderer";
import { useCharacterRelations } from "@/hooks/character/useCharacterRelations";
import { useCharacters } from "@/hooks/character/useCharacters";
import CharacterNode from "./CharacterNode";

const nodeTypes = {
  characterNode: CharacterNode,
};

interface CharacterRelationsProps {
  characterId: string;
}

export function CharacterRelations({ characterId }: CharacterRelationsProps) {
  const { characters: allCharacters } = useCharacters();
  const {
    nodes: initialNodes,
    edges: initialEdges,
    isLoading,
    onConnect: onConnectHook,
  } = useCharacterRelations(characterId, allCharacters);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => setNodes(initialNodes), [initialNodes, setNodes]);
  React.useEffect(() => setEdges(initialEdges), [initialEdges, setEdges]);

  const onConnect = React.useCallback(
    (params: Connection) => {
      // This is a temporary solution for the UI, the hook handles the logic
      setEdges((eds) => addEdge(params, eds));
      onConnectHook(params);
    },
    [setEdges, onConnectHook]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{
        height: "70vh",
        width: "100%",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        connectionMode={ConnectionMode.Loose}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
