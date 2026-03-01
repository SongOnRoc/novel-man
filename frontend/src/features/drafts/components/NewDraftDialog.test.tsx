import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  NewDraftDialog,
  type NewDraftDialogFormValues,
} from "./NewDraftDialog";

const baseValues: NewDraftDialogFormValues = {
  title: "",
  workId: "none",
  templateKey: "blank",
};

const works = [
  { id: 1, title: "作品 A" },
  { id: 2, title: "作品 B" },
] as const;

describe("NewDraftDialog", () => {
  it("应渲染基础字段并支持标题输入", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(
      <NewDraftDialog
        open
        isCreating={false}
        works={works as any}
        values={baseValues}
        onOpenChange={vi.fn()}
        onValuesChange={onValuesChange}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("新建草稿")).toBeInTheDocument();
    expect(screen.getByLabelText("草稿标题（可选）")).toBeInTheDocument();

    await user.type(screen.getByLabelText("草稿标题（可选）"), "测试标题");

    expect(onValuesChange).toHaveBeenCalled();
  });

  it("点击取消应关闭对话框且不触发创建", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <NewDraftDialog
        open
        isCreating={false}
        works={works as any}
        values={baseValues}
        onOpenChange={onOpenChange}
        onValuesChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "取消" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("点击确认创建应触发 onConfirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <NewDraftDialog
        open
        isCreating={false}
        works={works as any}
        values={baseValues}
        onOpenChange={vi.fn()}
        onValuesChange={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "确认创建" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("创建中应禁用取消/确认并显示进行中文案", () => {
    render(
      <NewDraftDialog
        open
        isCreating
        works={works as any}
        values={baseValues}
        onOpenChange={vi.fn()}
        onValuesChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "创建中..." })).toBeDisabled();
  });

  it("模板默认值应为空白模板（可选）", () => {
    render(
      <NewDraftDialog
        open
        isCreating={false}
        works={works as any}
        values={{ ...baseValues, templateKey: "blank" }}
        onOpenChange={vi.fn()}
        onValuesChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getAllByText("空白模板").length).toBeGreaterThan(0);
  });
});
