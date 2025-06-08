import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CardSystem } from "../card-system";
import { type BaseCardProps, CardContainerType, CollectionLayoutStyle } from "../types";

// Mock implementations
jest.mock("../components/dialogs", () => ({
  AddCardDialog: ({
    open,
    onClose,
    onAddEditorCard,
    onAddCollectionCard,
    parentTag,
    attributeOptions,
  }: {
    open: boolean;
    onClose: () => void;
    onAddEditorCard: (title: string, hideTitle: boolean) => void;
    onAddCollectionCard: (title: string) => void;
    parentTag?: string;
    attributeOptions?: Array<{ value: string; label: string }>;
  }) =>
    open ? (
      <div data-testid="add-dialog">
        <button type="button" onClick={() => onAddEditorCard("Editor Card", false)}>
          Add Editor
        </button>
        <button type="button" onClick={() => onAddCollectionCard("Collection Card")}>
          Add Collection
        </button>
        {parentTag && <div>Parent: {parentTag}</div>}
      </div>
    ) : null,
}));

jest.mock("../card-component", () => {
  const original = jest.requireActual("../card-component");
  return {
    ...original,
    CardComponent: jest.fn(
      ({
        card,
        onUpdateCard,
        onChangeLayoutStyle,
        onAddChildCard,
        onOpenAddDialog,
      }: {
        card: BaseCardProps;
        onUpdateCard?: (id: string, updates: Partial<BaseCardProps>) => void;
        onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
        onAddChildCard?: (
          parentId: string,
          containerType: CardContainerType,
          title?: string,
          hideTitle?: boolean,
        ) => void;
        onOpenAddDialog?: (parentId: string) => void;
      }) => {
        const handleCollapse = () => {
          onUpdateCard?.(card.id, { isCollapsed: !card.isCollapsed });
        };

        const handleLayoutChange = () => {
          onChangeLayoutStyle?.(card.id, CollectionLayoutStyle.ADAPTIVE);
        };

        const handleAddChild = () => {
          if (onOpenAddDialog) {
            onOpenAddDialog(card.id);
          } else if (onAddChildCard) {
            onAddChildCard(card.id, CardContainerType.EDITOR, "Editor Card", false);
          }
        };

        return (
          <div data-testid={`card-${card.id}`}>
            {card.title}
            {card.content && <div>{card.content}</div>}
            <button type="button" data-testid="collapse-button" onClick={handleCollapse}>
              折叠
            </button>
            {card.containerType === CardContainerType.COLLECTION && (
              <>
                <button type="button" data-testid="layout-button" onClick={handleLayoutChange}>
                  布局
                </button>
                <button type="button" data-testid="add-child-button" onClick={handleAddChild}>
                  添加子卡片
                </button>
              </>
            )}
          </div>
        );
      },
    ),
  };
});

describe("CardSystem - Full Requirements", () => {
  const mockAddCard = jest.fn();
  const mockUpdateCard = jest.fn();
  const mockDeleteCard = jest.fn();
  const mockMoveCard = jest.fn();
  const mockAddChildCard = jest.fn();
  const mockRelateCard = jest.fn();
  const mockChangeLayout = jest.fn();

  const baseProps = {
    onAddCard: mockAddCard,
    onUpdateCard: mockUpdateCard,
    onDeleteCard: mockDeleteCard,
    onAddChildCard: mockAddChildCard,
    onRelateCard: mockRelateCard,
    onUnrelateCard: jest.fn(),
    onChangeLayoutStyle: mockChangeLayout,
    moveCard: mockMoveCard,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Card Types", () => {
    test("renders editor card correctly", () => {
      const editorCard: BaseCardProps = {
        id: "editor1",
        title: "Editor Card",
        containerType: CardContainerType.EDITOR,
        isCollapsed: false,
      };

      render(<CardSystem cards={[editorCard]} title="Test" {...baseProps} />);
      expect(screen.getByText("Editor Card")).toBeInTheDocument();
    });

    test("renders collection card correctly", () => {
      const collectionCard: BaseCardProps = {
        id: "collection1",
        title: "Collection Card",
        containerType: CardContainerType.COLLECTION,
        isCollapsed: false,
      };

      render(<CardSystem cards={[collectionCard]} title="Test" {...baseProps} />);
      expect(screen.getByText("Collection Card")).toBeInTheDocument();
    });
  });

  describe("Title Bar Buttons", () => {
    test("collapse button toggles card state", () => {
      const card: BaseCardProps = {
        id: "card1",
        title: "Test Card",
        containerType: CardContainerType.EDITOR,
        isCollapsed: false,
      };

      render(<CardSystem cards={[card]} title="Test" {...baseProps} />);
      fireEvent.click(screen.getByTestId("collapse-button"));
      expect(mockUpdateCard).toHaveBeenCalledWith("card1", { isCollapsed: true });
    });

    test("add button shows dialog for collection cards", () => {
      const card: BaseCardProps = {
        id: "collection1",
        title: "Collection Card",
        containerType: CardContainerType.COLLECTION,
        isCollapsed: false,
      };

      render(<CardSystem cards={[card]} title="Test" {...baseProps} />);
      fireEvent.click(screen.getByTestId("add-child-button"));
      expect(screen.getByTestId("add-dialog")).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    test("prevents dropping outside container", () => {
      const card: BaseCardProps = {
        id: "card1",
        title: "Test Card",
        containerType: CardContainerType.EDITOR,
        isCollapsed: false,
      };

      render(<CardSystem cards={[card]} title="Test" {...baseProps} />);
      // 模拟拖拽操作
      fireEvent.dragStart(screen.getByTestId("card-card1"));
      fireEvent.dragEnd(screen.getByTestId("card-card1"));
      expect(mockMoveCard).not.toHaveBeenCalled();
    });
  });

  describe("Card Creation and Tagging", () => {
    test("generates correct tags for nested cards", async () => {
      const parentCard: BaseCardProps = {
        id: "parent",
        title: "Parent",
        tag: "parent",
        containerType: CardContainerType.COLLECTION,
        props: [{ name: "test", value: "Test" }],
        isCollapsed: false,
      };

      render(<CardSystem cards={[parentCard]} title="Test" {...baseProps} />);

      // 点击父卡片内的添加按钮
      fireEvent.click(screen.getByTestId("add-child-button"));

      // 等待对话框出现
      await waitFor(() => {
        expect(screen.getByTestId("add-dialog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Add Editor"));

      await waitFor(() => {
        expect(mockAddChildCard).toHaveBeenCalledWith("parent", CardContainerType.EDITOR, {
          title: "Editor Card",
          hideTitle: false,
          parentCardCount: expect.any(Number),
        });
      });
    });
  });

  describe("Layout Styles", () => {
    test("allows changing layout for collection cards", () => {
      const card: BaseCardProps = {
        id: "collection1",
        title: "Collection Card",
        containerType: CardContainerType.COLLECTION,
        isCollapsed: false,
      };

      render(<CardSystem cards={[card]} title="Test" {...baseProps} />);
      fireEvent.click(screen.getByTestId("layout-button"));
      expect(mockChangeLayout).toHaveBeenCalledWith("collection1", CollectionLayoutStyle.ADAPTIVE);
    });
  });
});
