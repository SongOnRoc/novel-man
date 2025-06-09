import { useCallback, useState } from "react";
import { Container } from "./components/container";
// ContainerDndKit is no longer needed as its logic is merged into Container
import { AddCardDialog, LayoutStyleDialog, RelateDialog } from "./components/dialogs";
import { TitleBar } from "./components/title-bar";
import { type CardComponentProps, CardContainerType, type CardProperty, CollectionLayoutStyle } from "./types";

// 基础卡片组件
export function CardComponent({
  card,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  isMobile = false,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
  },
  attributeOptions = [],
  availableRelateItems = [],
  layoutStyle = CollectionLayoutStyle.VERTICAL,
  onOpenAddDialog,
  moveCard,
  onNavigateToRelated,
  // useDndKit prop is no longer needed, defaulting to dnd-kit behavior
}: CardComponentProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRelateDialogOpen, setIsRelateDialogOpen] = useState(false);
  const [isLayoutStyleDialogOpen, setIsLayoutStyleDialogOpen] = useState(false);

  // 使用用户提供的按钮配置，如果没有则使用默认值
  const _showEditButton = card.showEditButton ?? buttonsConfig.showEditButton;
  const _showAddButton = card.showAddButton ?? buttonsConfig.showAddButton;
  const _showDeleteButton = card.showDeleteButton ?? buttonsConfig.showDeleteButton;
  const _showRelateButton = card.showRelateButton ?? buttonsConfig.showRelateButton;
  const showLayoutStyleButton = card.showLayoutStyleButton ?? buttonsConfig.showLayoutStyleButton;

  // 是否为编辑器类型卡片
  const isEditorCard = card.containerType === CardContainerType.EDITOR;
  // 是否为集合类型卡片
  const isCollectionCard = card.containerType === CardContainerType.COLLECTION;

  const handleToggleCollapse = () => {
    onUpdateCard(card.id, { isCollapsed: !card.isCollapsed });
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateCard(card.id, { title: e.target.value });
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleAddButtonClick = () => {
    // 如果卡片是折叠的，先展开卡片
    if (card.isCollapsed) {
      onUpdateCard(card.id, { isCollapsed: false });
    }

    // 然后打开添加对话框
    if (onOpenAddDialog) {
      // 优先使用外部提供的对话框打开函数
      onOpenAddDialog(card.id);
    } else {
      // 只有在没有外部对话框时才使用内部状态
      setIsAddDialogOpen(true);
    }
  };

  const handleUnrelateItem = () => {
    if (onUnrelateCard) {
      // 先更新卡片，清除关联信息
      onUpdateCard(card.id, {
        relatedItem: undefined,
        isEditing: false, // 确保不进入编辑状态
      });
      // 然后调用解除关联回调
      onUnrelateCard(card.id);
      // 确保标题不处于编辑状态
      setIsEditingTitle(false);
    }
  };

  // 处理布局样式变更
  const handleLayoutStyleChange = () => {
    setIsLayoutStyleDialogOpen(true);
  };

  const handleLayoutStyleConfirm = (style: CollectionLayoutStyle) => {
    if (onChangeLayoutStyle) {
      onChangeLayoutStyle(card.id, style);
    }
  };

  const handleAddEditorCard = useCallback(
    (title?: string, hideTitle = true, props: CardProperty[] = []) => {
      if (onAddCard) {
        onAddCard(CardContainerType.EDITOR, {
          title,
          hideTitle,
          props,
          parentId: card.id,
        });

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddCard, onUpdateCard],
  );

  const handleAddCollectionCard = useCallback(
    (title?: string, props?: CardProperty[]) => {
      if (onAddCard) {
        onAddCard(CardContainerType.COLLECTION, {
          title,
          props: props || [],
          parentId: card.id,
        });

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddCard, onUpdateCard],
  );

  const handleRelateItem = () => {
    if (onRelateCard) {
      setIsRelateDialogOpen(true);
    }
  };

  const handleRelateItemConfirm = (itemId: string, itemTitle: string, itemType: string) => {
    if (onRelateCard) {
      const currentContent = card.content;
      onUpdateCard(card.id, {
        relatedItem: {
          id: itemId,
          title: itemTitle,
          type: itemType,
        },
      });
      if (currentContent) {
        onUpdateCard(card.id, { content: currentContent });
      }
      onRelateCard(card.id);
    }
  };

  // 处理可见性切换
  const handleToggleVisibility = useCallback(() => {
    if (onUpdateCard) {
      onUpdateCard(card.id, { isVisible: !(card.isVisible === false) });
    }
  }, [card.id, card.isVisible, onUpdateCard]);

  // 卡片的主样式
  const cardStyle = {
    border: card.hideBorder ? "none" : "1px solid #ccc",
    borderRadius: "4px",
    overflow: "hidden",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    boxSizing: "border-box" as const,
    opacity: card.isVisible === false ? 0.5 : 1, // 根据可见性设置透明度
  };

  return (
    <div style={cardStyle}>
      {/* 标题栏 - 显示条件：有标题栏或者无头卡片处于折叠状态 */}
      {(!card.hideTitle || (card.hideTitle && card.isCollapsed)) && (
        <TitleBar
          card={card}
          buttonsConfig={buttonsConfig}
          isEditorCard={isEditorCard}
          isCollectionCard={isCollectionCard}
          onToggleCollapse={handleToggleCollapse}
          onTitleEdit={handleTitleEdit}
          onAddButtonClick={handleAddButtonClick}
          onDeleteCard={onDeleteCard}
          onRelateItem={handleRelateItem}
          onUnrelateItem={handleUnrelateItem}
          onLayoutStyleChange={showLayoutStyleButton ? handleLayoutStyleChange : undefined}
          onOpenAddDialog={onOpenAddDialog}
          onToggleVisibility={handleToggleVisibility}
          isEditingTitle={isEditingTitle}
          onTitleInputChange={handleTitleChange}
          onTitleInputSave={handleTitleSave}
          onNavigateToRelated={onNavigateToRelated}
          isTemporaryVisible={card.hideTitle && card.isCollapsed} // 添加临时可见标记，用于无头卡片折叠状态
          hasToggleButton={card.hideTitle} // 添加标题栏切换按钮标记
        />
      )}

      {/* 容器内容 */}
      {!card.isCollapsed && (
        <Container
          card={card}
          containerType={card.containerType}
          layoutStyle={card.layoutStyle || layoutStyle}
          onUpdateCard={onUpdateCard}
          onDeleteCard={onDeleteCard}
          onAddCard={onAddCard}
          onRelateCard={onRelateCard}
          onUnrelateCard={onUnrelateCard}
          onChangeLayoutStyle={onChangeLayoutStyle}
          buttonsConfig={buttonsConfig}
          attributeOptions={attributeOptions}
          availableRelateItems={availableRelateItems}
          moveCard={moveCard}
          onNavigateToRelated={onNavigateToRelated}
          onToggleCollapse={handleToggleCollapse}
          onTitleEdit={handleTitleEdit}
          onAddButtonClick={handleAddButtonClick}
          isEditingTitle={isEditingTitle}
          onTitleInputChange={handleTitleChange}
          onTitleInputSave={handleTitleSave}
          useDndKit={true}
        />
      )}

      {/* 添加卡片对话框 */}
      <AddCardDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddEditorCard={handleAddEditorCard}
        onAddCollectionCard={handleAddCollectionCard}
        attributeOptions={attributeOptions}
      />

      {/* 关联对话框 */}
      <RelateDialog
        open={isRelateDialogOpen}
        onClose={() => setIsRelateDialogOpen(false)}
        onConfirm={handleRelateItemConfirm}
        availableItems={availableRelateItems}
      />

      {/* 布局样式对话框 */}
      <LayoutStyleDialog
        open={isLayoutStyleDialogOpen}
        onClose={() => setIsLayoutStyleDialogOpen(false)}
        onConfirm={handleLayoutStyleConfirm}
        currentStyle={card.layoutStyle || layoutStyle}
      />
    </div>
  );
}
