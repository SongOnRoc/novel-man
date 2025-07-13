import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { WorldItemCard } from "./WorldItemCard";
import { WorldItem } from "@/types/worldbuilding";

const mockWorldItem: WorldItem = {
  id: "1",
  workId: "w1",
  name: "世界树",
  type: "location",
  description: "连接九界的巨树",
  tags: ["神话", "北欧"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("WorldItemCard", () => {
  it("renders world item information correctly", () => {
    render(<WorldItemCard worldItem={mockWorldItem} />);
    expect(screen.getByText("世界树")).toBeInTheDocument();
    expect(screen.getByText("地点/场景")).toBeInTheDocument();
    expect(screen.getByText("连接九界的巨树")).toBeInTheDocument();
  });

  it("calls onSelect when the card is clicked", async () => {
    const onSelect = vi.fn();
    render(<WorldItemCard worldItem={mockWorldItem} onSelect={onSelect} />);
    await userEvent.click(screen.getByText("世界树"));
    expect(onSelect).toHaveBeenCalledWith("世界树");
  });

  it("does not call onSelect when a button inside the card is clicked", async () => {
    const onSelect = vi.fn();
    render(
      <WorldItemCard worldItem={mockWorldItem} onSelect={onSelect}>
        <button>编辑</button>
      </WorldItemCard>
    );
    await userEvent.click(screen.getByRole("button", { name: /编辑/i }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("expands to show more details when expand button is clicked", async () => {
    const detailedItem: WorldItem = {
      ...mockWorldItem,
      details: "详细的描述信息",
      tags: ["巨树"],
    };
    render(<WorldItemCard worldItem={detailedItem} />);

    // Initially, details are not visible
    expect(screen.queryByText("详细的描述信息")).not.toBeInTheDocument();

    // Click the expand button (the parent of the chevron icon)
    await userEvent.click(screen.getByRole("button", { name: "" }));

    // Now, details should be visible
    expect(screen.getByText("详细的描述信息")).toBeInTheDocument();
    expect(screen.getByText("巨树")).toBeInTheDocument();
  });
});
