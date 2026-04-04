import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResponsiveBackButton } from "./ResponsiveBackButton";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

describe("ResponsiveBackButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应渲染桌面端文案与移动端可访问名称，并跳转到指定地址", async () => {
    const user = userEvent.setup();

    render(<ResponsiveBackButton href="/works/12" label="返回作品" />);

    const button = screen.getByRole("button", { name: "返回作品" });
    expect(button).toBeInTheDocument();
    expect(screen.getByText("返回作品")).toHaveClass("hidden", "sm:inline");

    await user.click(button);

    expect(mockPush).toHaveBeenCalledWith("/works/12");
  });
});
