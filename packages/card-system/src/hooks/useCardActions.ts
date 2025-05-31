import { useCallback } from "react";
import { type BaseCardProps, type CardCallbacks, CardContainerType, type CollectionLayoutStyle } from "../types";

export function useCardActions(card: BaseCardProps, callbacks: CardCallbacks) {
  const handleAddButtonClick = useCallback(() => {
    if (card.containerType === CardContainerType.EDITOR) {
      callbacks.onAddChildCard?.(card.id, CardContainerType.EDITOR);
    } else {
      callbacks.onAddChildCard?.(card.id, CardContainerType.COLLECTION);
    }
  }, [card.id, card.containerType, callbacks]);

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
