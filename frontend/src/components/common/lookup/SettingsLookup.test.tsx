import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SettingsLookup } from "./SettingsLookup";
import { useLookup } from "@/hooks/lookup/useLookup";
import { Character } from "@/types/character";
import { WorldItem } from "@/types/worldbuilding";

// Mock dependencies
vi.mock("@/hooks/lookup/useLookup");
vi.mock("./CharacterCard", () => ({
  CharacterCard: ({
    character,
    onSelect,
  }: {
    character: Character;
    onSelect?: (name: string) => void;
  }) => (
    <div
      data-testid={`character-card-${character.id}`}
      onClick={() => onSelect?.(character.name)}
    >
      {character.name}
    </div>
  ),
}));
vi.mock("./WorldItemCard", () => ({
  WorldItemCard: ({
    worldItem,
    onSelect,
  }: {
    worldItem: WorldItem;
    onSelect?: (name: string) => void;
  }) => (
    <div
      data-testid={`world-item-card-${worldItem.id}`}
      onClick={() => onSelect?.(worldItem.name)}
    >
      {worldItem.name}
    </div>
  ),
}));

const mockCharacters: Character[] = [
  { id: "c1", name: "Alice", workId: "w1", createdAt: "", updatedAt: "" },
  { id: "c2", name: "Bob", workId: "w1", createdAt: "", updatedAt: "" },
];

const mockWorldItems: WorldItem[] = [
  {
    id: "wi1",
    name: "Magic City",
    workId: "w1",
    type: "location",
    description: "",
    tags: [],
    createdAt: "",
    updatedAt: "",
  },
];

const mockLoadSettings = vi.fn();
const mockSearchSettings = vi.fn();

describe("SettingsLookup", () => {
  const user = userEvent.setup();
  beforeEach(() => {
    vi.clearAllMocks();
    (useLookup as ReturnType<typeof vi.fn>).mockReturnValue({
      characters: [],
      worldItems: [],
      isLoading: false,
      loadSettings: mockLoadSettings,
      searchSettings: mockSearchSettings,
    });
  });

  it("should render the trigger button", () => {
    render(<SettingsLookup workId="w1" />);
    expect(
      screen.getByRole("button", { name: /设定速查/i }),
    ).toBeInTheDocument();
  });

  it("should call loadSettings when opened", async () => {
    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));
    expect(mockLoadSettings).toHaveBeenCalledWith("w1");
  });

  it("should show loading state", async () => {
    (useLookup as ReturnType<typeof vi.fn>).mockReturnValue({
      characters: [],
      worldItems: [],
      isLoading: true,
      loadSettings: mockLoadSettings,
      searchSettings: mockSearchSettings,
    });

    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    // We only need to check that at least one loading indicator is visible
    expect(screen.getAllByText(/加载中.../i).length).toBeGreaterThan(0);
  });

  it("should display characters and world items when loaded", async () => {
    (useLookup as ReturnType<typeof vi.fn>).mockReturnValue({
      characters: mockCharacters,
      worldItems: mockWorldItems,
      isLoading: false,
      loadSettings: mockLoadSettings,
      searchSettings: mockSearchSettings,
    });

    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /角色/i })).toHaveTextContent(
      "角色 (2)",
    );

    await user.click(screen.getByRole("tab", { name: /世界观/i }));
    expect(await screen.findByText("Magic City")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /世界观/i })).toHaveTextContent(
      "世界观 (1)",
    );
  });

  it("should display empty state message when no data is available", async () => {
    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    expect(await screen.findByText(/该作品还没有角色/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /世界观/i }));
    expect(
      await screen.findByText(/该作品还没有世界观设定/i),
    ).toBeInTheDocument();
  });

  it("should call searchSettings on search button click", async () => {
    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    const searchInput = screen.getByPlaceholderText(/搜索角色或设定.../i);
    await user.type(searchInput, "Alice");
    await user.click(screen.getByRole("button", { name: /搜索/i }));

    expect(mockSearchSettings).toHaveBeenCalledWith("Alice");
  });

  it("should call searchSettings on Enter key press", async () => {
    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    const searchInput = screen.getByPlaceholderText(/搜索角色或设定.../i);
    await user.type(searchInput, "Bob{enter}");

    expect(mockSearchSettings).toHaveBeenCalledWith("Bob");
  });

  it("should display message when search returns no results", async () => {
    render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    const searchInput = screen.getByPlaceholderText(/搜索角色或设定.../i);
    const searchButton = screen.getByRole("button", { name: /搜索/i });

    // 模拟搜索返回空结果
    // 这里的关键是：组件的内部状态 `searchInput` 被更新了
    await user.type(searchInput, "Unknown");
    await user.click(searchButton);

    expect(mockSearchSettings).toHaveBeenCalledWith("Unknown");

    // 此时，组件的 `searchInput` state 是 "Unknown"，
    // 而 `useLookup` 返回的 `characters` 是空数组。
    // 组件的逻辑会显示 "没有找到匹配的角色"。
    expect(await screen.findByText(/没有找到匹配的角色/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /世界观/i }));
    expect(
      await screen.findByText(/没有找到匹配的世界观设定/i),
    ).toBeInTheDocument();
  });

  it("should call onSelectItem when a character card is clicked", async () => {
    const onSelectItem = vi.fn();
    (useLookup as ReturnType<typeof vi.fn>).mockReturnValue({
      characters: mockCharacters,
      worldItems: [],
      isLoading: false,
      loadSettings: mockLoadSettings,
      searchSettings: mockSearchSettings,
    });

    render(
      <SettingsLookup
        workId="w1"
        onSelectItem={onSelectItem}
        // @ts-ignore - onSelectItem is now a valid prop
      />,
    );
    await user.click(screen.getByRole("button", { name: /设定速查/i }));

    const charCard = await screen.findByTestId("character-card-c1");
    await user.click(charCard);

    expect(onSelectItem).toHaveBeenCalledWith("Alice");
  });

  it("should reload data when workId changes and the sheet is open", async () => {
    const { rerender } = render(<SettingsLookup workId="w1" />);
    await user.click(screen.getByRole("button", { name: /设定速查/i }));
    expect(mockLoadSettings).toHaveBeenCalledWith("w1");
    mockLoadSettings.mockClear();

    rerender(<SettingsLookup workId="w2" />);
    expect(mockLoadSettings).toHaveBeenCalledWith("w2");
  });
});
