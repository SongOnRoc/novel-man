import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { CharacterCard } from "./CharacterCard";
import { Character } from "@/types/character";

const mockCharacter: Character = {
  id: "1",
  workId: "w1",
  name: "英雄",
  background: "一个勇敢的角色",
  avatar: "/avatar.png",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("CharacterCard", () => {
  it("renders character information correctly", () => {
    render(<CharacterCard character={mockCharacter} />);
    expect(screen.getByText("英雄")).toBeInTheDocument();
    // The background is not directly visible until expanded, so we won't test for it here.
  });

  it("calls onSelect when the card is clicked", async () => {
    const onSelect = vi.fn();
    render(<CharacterCard character={mockCharacter} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("英雄"));
    expect(onSelect).toHaveBeenCalledWith("英雄");
  });

  it("does not call onSelect when a button inside the card is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <CharacterCard character={mockCharacter} onSelect={onSelect}>
        <button>编辑</button>
      </CharacterCard>
    );
    await userEvent.click(screen.getByRole("button", { name: /编辑/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
