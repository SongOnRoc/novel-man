import React from "react";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteWorkDialog } from "./DeleteWorkDialog";

describe("DeleteWorkDialog", () => {
  it("初始态应展示确认删除，并在点击确认后调用 onConfirm()", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    expect(screen.getByText("确定要删除这个作品吗？")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith();
  });

  it("初次确认若 onConfirm 抛出 409 且带 draftCount，应进入二次确认态并展示数量", async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce({ code: 409, data: { draftCount: 3 } });

    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    expect(screen.getByText("检测到关联草稿")).toBeInTheDocument();
    expect(screen.getByText(/该作品下有 3 篇草稿/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "解除关联并删除作品" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "删除草稿并删除作品" })
    ).toBeInTheDocument();
  });

  it("二次确认点击“解除关联并删除作品”应调用 onConfirm('unlink')", async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce({ code: 409, data: { draftCount: 1 } })
      .mockResolvedValue(undefined);

    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    const unlinkButton = await screen.findByRole("button", {
      name: "解除关联并删除作品",
    });
    await user.click(unlinkButton);

    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenNthCalledWith(2, "unlink");
  });

  it("二次确认点击“删除草稿并删除作品”应调用 onConfirm('delete')", async () => {
    const user = userEvent.setup();
    const onConfirm = vi
      .fn()
      .mockRejectedValueOnce({ code: 409, data: { draftCount: 1 } })
      .mockResolvedValue(undefined);

    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={onConfirm}
        isDeleting={false}
      />
    );

    await user.click(screen.getByRole("button", { name: "确认删除" }));

    const deleteButton = await screen.findByRole("button", {
      name: "删除草稿并删除作品",
    });
    await user.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledTimes(2);
    expect(onConfirm).toHaveBeenNthCalledWith(2, "delete");
  });

  it("isDeleting=true 时应禁用取消/按钮并显示进行中文案", () => {
    render(
      <DeleteWorkDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        isDeleting
      />
    );

    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "删除中..." })).toBeDisabled();
  });
});
