import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import React from "react";
import { CharacterRelations } from "./CharacterRelations";
import { useCharacterRelations } from "@/hooks/character/useCharacterRelations";
import { Node, Edge, Connection } from "react-flow-renderer";

// Helper to make the mock more realistic
let onConnectCallback: (params: Connection) => void = () => {};

vi.mock("react-flow-renderer", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-flow-renderer")>();
  return {
    ...original,
    default: (props: {
      nodes: Node[];
      edges: Edge[];
      onConnect: (params: Connection) => void;
      children: React.ReactNode;
    }) => {
      onConnectCallback = props.onConnect;
      return (
        <div data-testid="react-flow">
          <pre data-testid="nodes">{JSON.stringify(props.nodes, null, 2)}</pre>
          <pre data-testid="edges">{JSON.stringify(props.edges, null, 2)}</pre>
          {props.children}
        </div>
      );
    },
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    Background: () => <div data-testid="background" />,
    useNodesState: (initialNodes: Node[]) => {
      const [nodes, setNodes] = React.useState(initialNodes);
      return [nodes, setNodes, vi.fn()];
    },
    useEdgesState: (initialEdges: Edge[]) => {
      const [edges, setEdges] = React.useState(initialEdges);
      return [edges, setEdges, vi.fn()];
    },
  };
});

// Mock the custom hook
vi.mock("@/hooks/character/useCharacterRelations");

const mockUseCharacterRelations = useCharacterRelations as Mock;

describe("CharacterRelations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onConnectCallback = () => {};
  });

  it("should render the relations graph when data is loaded", () => {
    const testNodes: Node[] = [
      {
        id: "1",
        type: "input",
        data: { label: "主角" },
        position: { x: 250, y: 5 },
      },
    ];
    const testEdges: Edge[] = [
      { id: "e1", source: "1", target: "2", label: "挚友" },
    ];

    mockUseCharacterRelations.mockReturnValue({
      nodes: testNodes,
      edges: testEdges,
      isLoading: false,
      onConnect: vi.fn(),
    });

    render(<CharacterRelations characterId="1" />);

    expect(screen.getByTestId("react-flow")).toBeInTheDocument();

    const nodes = JSON.parse(screen.getByTestId("nodes").textContent || "[]");
    const edges = JSON.parse(screen.getByTestId("edges").textContent || "[]");

    expect(nodes).toEqual(testNodes);
    expect(edges).toEqual(testEdges);
  });

  it("should render loading state", () => {
    mockUseCharacterRelations.mockReturnValue({
      nodes: [],
      edges: [],
      isLoading: true,
      onConnect: vi.fn(),
    });

    render(<CharacterRelations characterId="1" />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should render an empty graph if hook returns empty arrays", () => {
    mockUseCharacterRelations.mockReturnValue({
      nodes: [],
      edges: [],
      isLoading: false,
      onConnect: vi.fn(),
    });

    render(<CharacterRelations characterId="invalid-id" />);

    expect(screen.getByTestId("react-flow")).toBeInTheDocument();

    const nodes = JSON.parse(screen.getByTestId("nodes").textContent || "[]");
    const edges = JSON.parse(screen.getByTestId("edges").textContent || "[]");

    expect(nodes).toHaveLength(0);
    expect(edges).toHaveLength(0);
  });

  it("should render all UI controls", () => {
    mockUseCharacterRelations.mockReturnValue({
      nodes: [],
      edges: [],
      isLoading: false,
      onConnect: vi.fn(),
    });

    render(<CharacterRelations characterId="1" />);

    expect(screen.getByTestId("controls")).toBeInTheDocument();
    expect(screen.getByTestId("minimap")).toBeInTheDocument();
    expect(screen.getByTestId("background")).toBeInTheDocument();
  });

  it("should call onConnect from the hook when a connection is made", () => {
    const onConnectMock = vi.fn();
    mockUseCharacterRelations.mockReturnValue({
      nodes: [{ id: "1", data: { label: "A" }, position: { x: 0, y: 0 } }],
      edges: [],
      isLoading: false,
      onConnect: onConnectMock,
    });

    render(<CharacterRelations characterId="1" />);

    const connection: Connection = {
      source: "1",
      target: "2",
      sourceHandle: null,
      targetHandle: null,
    };

    act(() => {
      onConnectCallback(connection);
    });

    expect(onConnectMock).toHaveBeenCalledWith(connection);
  });
});
