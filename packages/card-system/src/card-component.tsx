import { useCallback, useState } from "react";
import { AddCardDialog, LayoutStyleDialog, RelateDialog } from "./components/dialogs";
import { TitleBar } from "./components/title-bar";
import { Container } from "./components/container";
import { type BaseCardProps, type CardButtonsConfig, CardContainerType, CollectionLayoutStyle } from "./types";
import type { CardComponentProps } from "./types";

// 基础卡片组件
export function CardComponent({
  card,
  onUpdateCard,
  onDeleteCard,
  onAddChildCard,
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
}: CardComponentProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRelateDialogOpen, setIsRelateDialogOpen] = useState(false);
  const [isLayoutStyleDialogOpen, setIsLayoutStyleDialogOpen] = useState(false);

  // 使用用户提供的按钮配置，如果没有则使用默认值
  const showEditButton = card.showEditButton ?? buttonsConfig.showEditButton;
  const showAddButton = card.showAddButton ?? buttonsConfig.showAddButton;
  const showDeleteButton = card.showDeleteButton ?? buttonsConfig.showDeleteButton;
  const showRelateButton = card.showRelateButton ?? buttonsConfig.showRelateButton;
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
    if (onOpenAddDialog) {
      onOpenAddDialog(card.id);
    } else {
      setIsAddDialogOpen(true);
    }
  };

  const handleUnrelateItem = () => {
    if (onUnrelateCard) {
      onUnrelateCard(card.id);
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
    (title?: string, hideTitle = true) => {
      if (onAddChildCard) {
        onAddChildCard(card.id, CardContainerType.EDITOR, {
          title,
          hideTitle,
          props: []
        });

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddChildCard, onUpdateCard],
  );

  const handleAddCollectionCard = useCallback(
    (title?: string) => {
      if (onAddChildCard) {
        onAddChildCard(card.id, CardContainerType.COLLECTION, {
          title,
          props: []
        });

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddChildCard, onUpdateCard],
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

  return (
    <div className="border rounded-md overflow-hidden shadow-sm">
      {/* 标题栏 */}
      {!card.hideTitle && (
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
          onLayoutStyleChange={showLayoutStyleButton ? handleLayoutStyleConfirm : undefined}
          onOpenAddDialog={onOpenAddDialog}
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
          buttonsConfig={buttonsConfig}
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
        currentStyle={card.layoutStyle || CollectionLayoutStyle.VERTICAL}
      />
    </div>
  );
}
