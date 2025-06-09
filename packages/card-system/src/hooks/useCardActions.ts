import { useCallback } from "react";
import type { BaseCardProps, CardCallbacks, CollectionLayoutStyle } from "../types";

export function useCardActions(card: BaseCardProps, callbacks: CardCallbacks) {
  const handleAddButtonClick = useCallback(() => {
    // 确保父卡片展开
    if (card.isCollapsed) {
      callbacks.onUpdateCard?.(card.id, { isCollapsed: false });
    }

    // 添加新卡片并设置默认折叠
    callbacks.onAddCard?.(card.containerType, {
      parentId: card.id,
      isCollapsed: true, // 新卡片默认折叠
    });
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
    // 解除关联时清除卡片的relatedItem
    callbacks.onUpdateCard?.(card.id, { relatedItem: undefined });
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
