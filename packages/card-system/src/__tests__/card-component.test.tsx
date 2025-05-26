import { fireEvent, render, screen } from "@testing-library/react";
import { CardComponent } from "../card-component";
import { type BaseCardProps, CardContainerType } from "../types";

// 模拟对话框组件
jest.mock("../dialogs", () => ({
  AddCardDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="add-dialog">
        Add Dialog <button type="button" onClick={onClose}>Close</button>
      </div>
    ) : null,
  RelateDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="relate-dialog">
        Relate Dialog <button type="button" onClick={onClose}>Close</button>
      </div>
    ) : null,
  LayoutStyleDialog: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="layout-dialog">
        Layout Dialog <button type="button" onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

describe("CardComponent", () => {
  const mockUpdateCard = jest.fn();
  const mockDeleteCard = jest.fn();
  const mockAddChildCard = jest.fn();
  const mockRelateCard = jest.fn();
  const mockUnrelateCard = jest.fn();
  const mockChangeLayoutStyle = jest.fn();

  const editorCard: BaseCardProps = {
    id: "editor-card",
    title: "Editor Card",
    containerType: CardContainerType.EDITOR,
    isCollapsed: false,
    content: "Test content",
  };

  const collectionCard: BaseCardProps = {
    id: "collection-card",
    title: "Collection Card",
    containerType: CardContainerType.COLLECTION,
    isCollapsed: false,
    childCards: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders editor card correctly", () => {
    render(<CardComponent card={editorCard} onUpdateCard={mockUpdateCard} onDeleteCard={mockDeleteCard} />);

    expect(screen.getByText("Editor Card")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  test("renders collection card correctly", () => {
    render(<CardComponent card={collectionCard} onUpdateCard={mockUpdateCard} onDeleteCard={mockDeleteCard} />);

    expect(screen.getByText("Collection Card")).toBeInTheDocument();
    expect(screen.getByText('点击"+"按钮添加卡片')).toBeInTheDocument();
  });

  test("toggles collapse state when collapse button is clicked", () => {
    render(<CardComponent card={editorCard} onUpdateCard={mockUpdateCard} onDeleteCard={mockDeleteCard} />);

    fireEvent.click(screen.getByRole("button", { name: /折叠卡片/i }));

    expect(mockUpdateCard).toHaveBeenCalledWith("editor-card", { isCollapsed: true });
  });

  test("shows add dialog when add button is clicked", () => {
    const collectionCardWithButtons = {
      ...collectionCard,
      showAddButton: true,
    };

    render(
      <CardComponent
        card={collectionCardWithButtons}
        onUpdateCard={mockUpdateCard}
        onAddChildCard={mockAddChildCard}
      />,
    );

    // 找到添加按钮并点击
    const addButton = screen.getByTitle("添加子卡片");
    fireEvent.click(addButton);

    // 验证对话框已显示
    expect(screen.getByTestId("add-dialog")).toBeInTheDocument();

    // 关闭对话框
    fireEvent.click(screen.getByText("Close"));

    // 验证对话框已关闭
    expect(screen.queryByTestId("add-dialog")).not.toBeInTheDocument();
  });

  test("shows relate dialog when relate button is clicked", () => {
    const editorCardWithRelateButton = {
      ...editorCard,
      showRelateButton: true,
    };

    render(
      <CardComponent card={editorCardWithRelateButton} onUpdateCard={mockUpdateCard} onRelateCard={mockRelateCard} />,
    );

    // 找到关联按钮并点击
    const relateButton = screen.getByTitle("关联内容");
    fireEvent.click(relateButton);

    // 验证对话框已显示
    expect(screen.getByTestId("relate-dialog")).toBeInTheDocument();
  });

  test("shows layout style dialog when layout style button is clicked", () => {
    const collectionCardWithLayoutButton = {
      ...collectionCard,
      showLayoutStyleButton: true,
    };

    render(
      <CardComponent
        card={collectionCardWithLayoutButton}
        onUpdateCard={mockUpdateCard}
        onChangeLayoutStyle={mockChangeLayoutStyle}
      />,
    );

    // 找到布局样式按钮并点击
    const layoutButton = screen.getByTitle("更改布局样式");
    fireEvent.click(layoutButton);

    // 验证对话框已显示
    expect(screen.getByTestId("layout-dialog")).toBeInTheDocument();
  });

  test("deletes card when delete button is clicked", () => {
    const editorCardWithDeleteButton = {
      ...editorCard,
      showDeleteButton: true,
    };

    render(
      <CardComponent card={editorCardWithDeleteButton} onUpdateCard={mockUpdateCard} onDeleteCard={mockDeleteCard} />,
    );

    // 找到删除按钮并点击
    const deleteButton = screen.getByTitle("删除卡片");
    fireEvent.click(deleteButton);

    // 验证删除函数被调用
    expect(mockDeleteCard).toHaveBeenCalledWith("editor-card");
  });
});
