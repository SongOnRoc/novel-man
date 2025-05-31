import { fireEvent, render, screen } from "@testing-library/react";
import { AddCardDialog, LayoutStyleDialog, RelateDialog } from "../components/dialogs";
import { CollectionLayoutStyle } from "../types";

describe("AddCardDialog", () => {
  const mockClose = jest.fn();
  const mockAddEditorCard = jest.fn();
  const mockAddCollectionCard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when open", () => {
    render(
      <AddCardDialog
        open={true}
        onClose={mockClose}
        onAddEditorCard={mockAddEditorCard}
        onAddCollectionCard={mockAddCollectionCard}
        defaultTitle="Test Title"
      />,
    );

    expect(screen.getByText("添加新卡片")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Title")).toBeInTheDocument();
    expect(screen.getByText("添加编辑器卡片")).toBeInTheDocument();
    expect(screen.getByText("添加集合卡片")).toBeInTheDocument();
  });

  test("does not render when closed", () => {
    render(
      <AddCardDialog
        open={false}
        onClose={mockClose}
        onAddEditorCard={mockAddEditorCard}
        onAddCollectionCard={mockAddCollectionCard}
      />,
    );

    expect(screen.queryByText("添加新卡片")).not.toBeInTheDocument();
  });

  test("calls onAddEditorCard with correct parameters", () => {
    render(
      <AddCardDialog
        open={true}
        onClose={mockClose}
        onAddEditorCard={mockAddEditorCard}
        onAddCollectionCard={mockAddCollectionCard}
        defaultTitle="Test Title"
      />,
    );

    // 点击添加编辑器卡片按钮
    fireEvent.click(screen.getByText("添加编辑器卡片"));

    expect(mockAddEditorCard).toHaveBeenCalledWith("Test Title", false, []);
    expect(mockClose).not.toHaveBeenCalled(); // 对话框应该由调用者关闭
  });

  test("calls onAddCollectionCard with correct parameters", () => {
    render(
      <AddCardDialog
        open={true}
        onClose={mockClose}
        onAddEditorCard={mockAddEditorCard}
        onAddCollectionCard={mockAddCollectionCard}
        defaultTitle="Test Title"
      />,
    );

    // 点击添加集合卡片按钮
    fireEvent.click(screen.getByText("添加集合卡片"));

    expect(mockAddCollectionCard).toHaveBeenCalledWith("Test Title", [
      { name: "tag", value: "" }
    ]);
    expect(mockClose).not.toHaveBeenCalled(); // 对话框应该由调用者关闭
  });

  test("updates title when input changes", () => {
    render(
      <AddCardDialog
        open={true}
        onClose={mockClose}
        onAddEditorCard={mockAddEditorCard}
        onAddCollectionCard={mockAddCollectionCard}
      />,
    );

    const titleInput = screen.getByPlaceholderText("输入卡片标题");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    fireEvent.click(screen.getByText("添加编辑器卡片"));

    expect(mockAddEditorCard).toHaveBeenCalledWith("New Title", false, []);
  });
});

describe("RelateDialog", () => {
  const mockClose = jest.fn();
  const mockConfirm = jest.fn();
  const availableItems = [
    { id: "item1", title: "Item 1", type: "test" },
    { id: "item2", title: "Item 2", type: "test" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when open with items", () => {
    render(<RelateDialog open={true} onClose={mockClose} onConfirm={mockConfirm} availableItems={availableItems} />);

    expect(screen.getByText("关联项目")).toBeInTheDocument();
    expect(screen.getByText("Item 1 (test)")).toBeInTheDocument();
    expect(screen.getByText("Item 2 (test)")).toBeInTheDocument();
  });

  test("renders message when no items available", () => {
    render(<RelateDialog open={true} onClose={mockClose} onConfirm={mockConfirm} availableItems={[]} />);

    expect(screen.getByText("没有可关联的项目")).toBeInTheDocument();
  });

  test("calls onConfirm with selected item", () => {
    render(<RelateDialog open={true} onClose={mockClose} onConfirm={mockConfirm} availableItems={availableItems} />);

    // 选择一个项目
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "item1" } });

    // 点击确认按钮
    fireEvent.click(screen.getByText("确认关联"));

    expect(mockConfirm).toHaveBeenCalledWith("item1", "Item 1", "test");
    expect(mockClose).toHaveBeenCalled();
  });
});

describe("LayoutStyleDialog", () => {
  const mockClose = jest.fn();
  const mockConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when open", () => {
    render(
      <LayoutStyleDialog
        open={true}
        onClose={mockClose}
        onConfirm={mockConfirm}
        currentStyle={CollectionLayoutStyle.VERTICAL}
      />,
    );

    expect(screen.getByText("选择布局样式")).toBeInTheDocument();
    expect(screen.getByText(/上下排列/)).toBeInTheDocument();
    expect(screen.getByText(/左右排列/)).toBeInTheDocument();
    expect(screen.getByText(/自适应排列/)).toBeInTheDocument();
  });

  test("selects current style by default", () => {
    render(
      <LayoutStyleDialog
        open={true}
        onClose={mockClose}
        onConfirm={mockConfirm}
        currentStyle={CollectionLayoutStyle.HORIZONTAL}
      />,
    );

    const horizontalRadio = screen.getByLabelText(/左右排列/);
    expect(horizontalRadio).toBeChecked();
  });

  test("calls onConfirm with selected style", () => {
    render(
      <LayoutStyleDialog
        open={true}
        onClose={mockClose}
        onConfirm={mockConfirm}
        currentStyle={CollectionLayoutStyle.VERTICAL}
      />,
    );

    // 选择自适应布局
    fireEvent.click(screen.getByLabelText(/自适应排列/));

    // 点击确认按钮
    fireEvent.click(screen.getByText("确认"));

    expect(mockConfirm).toHaveBeenCalledWith(CollectionLayoutStyle.ADAPTIVE);
    expect(mockClose).toHaveBeenCalled();
  });
});
