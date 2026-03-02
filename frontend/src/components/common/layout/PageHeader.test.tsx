import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { PageHeader } from "./PageHeader";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    back: mockBack,
  })),
}));

describe("PageHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("提供 backHref 时点击返回应走 router.push", () => {
    render(<PageHeader title="章节列表" backHref="/works/1" />);

    fireEvent.click(screen.getByRole("button", { name: "返回" }));

    expect(mockPush).toHaveBeenCalledWith("/works/1");
    expect(mockBack).not.toHaveBeenCalled();
  });

  it("未提供 backHref 时点击返回应走 router.back", () => {
    render(<PageHeader title="编辑作品" />);

    fireEvent.click(screen.getByRole("button", { name: "返回" }));

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
