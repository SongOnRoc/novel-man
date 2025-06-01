import { useCallback } from "react";
import { type BaseCardProps, type CardCallbacks, CardContainerType, type CollectionLayoutStyle } from "../types";

export function useCardActions(card: BaseCardProps, callbacks: CardCallbacks) {
  const handleAddButtonClick = useCallback(() => {
    // 如果卡片是折叠的，先展开卡片
    if (card.isCollapsed) {
      callbacks.onUpdateCard?.(card.id, { isCollapsed: false });
    }

    // 然后处理添加子卡片
    if (card.containerType === CardContainerType.EDITOR) {
      callbacks.onAddCard?.(CardContainerType.EDITOR, { parentId: card.id });
    } else {
      callbacks.onAddCard?.(CardContainerType.COLLECTION, { parentId: card.id });
    }
  }, [card.id, card.containerType, card.isCollapsed, callbacks]);

  const handleDeleteButtonClick = useCallback(() => {
    callbacks.onDeleteCard?.(card.id);
  }, [callbacks, card.id]);

  const handleEditButtonClick = useCallback(() => {
    callbacks.onUpdateCard?.(card.id, { isEditing: true });
  }, [callbacks, card.id]);

  const handleCollapseButtonClick = useCallback(() => {
    callbacks.onToggleCollapse?.(card.id);
  }, [callbacks, card.id]);

  const handleUnrelateItem = useCallback(() => {
    callbacks.onUnrelateCard?.(card.id);
  }, [callbacks, card.id]);

  const handleRelateItem = useCallback(() => {
    callbacks.onRelateCard?.(card.id);
  }, [callbacks, card.id]);

  const handleLayoutStyleConfirm = useCallback(
    (style: CollectionLayoutStyle) => {
      callbacks.onChangeLayoutStyle?.(card.id, style);
    },
    [callbacks, card.id],
  );

  return {
    handleAddButtonClick,
    handleDeleteButtonClick,
    handleEditButtonClick,
    handleCollapseButtonClick,
    handleUnrelateItem,
    handleRelateItem,
    handleLayoutStyleConfirm,
  };
}
