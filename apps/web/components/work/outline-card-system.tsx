"use client";

import { OutlineContentDialog } from "@/components/dialogs/outline-dialogs";
import { type BaseCardProps, CardContainerType, CardSystem } from "@novel-man/card-system";
import { useCallback, useState } from "react";

// 大纲卡片系统属性
interface OutlineCardSystemProps {
  availableChapters?: Array<{ id: string; title: string }>;
  isMobile?: boolean;
  onChapterClick?: (chapterId: string) => void;
}

export function OutlineCardSystem({
  availableChapters = [],
  isMobile = false,
  onChapterClick,
}: OutlineCardSystemProps) {
  // 对话框状态
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);

  // 卡片数据状态
  const [cards, setCards] = useState<BaseCardProps[]>([
    {
      id: "outline-root",
      title: "作品大纲",
      isCollapsed: false,
      containerType: CardContainerType.COLLECTION,
      childCards: [],
      tag: "outline",
    },
  ]);

  // 辅助函数：更新卡片数组中的指定卡片
  function updateCardInArray(cards: BaseCardProps[], id: string, updates: Partial<BaseCardProps>): BaseCardProps[] {
    return cards.map((card) => {
      if (card.id === id) {
        return { ...card, ...updates };
      }

      if (card.childCards) {
        return {
          ...card,
          childCards: updateCardInArray(card.childCards, id, updates),
        };
      }

      return card;
    });
  }

  // 辅助函数：向父卡片添加子卡片
  function addChildCardToParent(
    cards: BaseCardProps[],
    parentId: string,
    newChildCard: BaseCardProps,
  ): BaseCardProps[] {
    return cards.map((card) => {
      if (card.id === parentId) {
        return {
          ...card,
          childCards: [...(card.childCards || []), newChildCard],
        };
      }

      if (card.childCards) {
        return {
          ...card,
          childCards: addChildCardToParent(card.childCards, parentId, newChildCard),
        };
      }

      return card;
    });
  }

  // 更新卡片
  const handleUpdateCard = useCallback((id: string, updates: Partial<BaseCardProps>) => {
    setCards((prev) => updateCardInArray(prev, id, updates));
  }, []);

  // 删除卡片
  const handleDeleteCard = useCallback((id: string) => {
    setCards((prev) => {
      // 递归函数，用于删除任何层级的卡片
      const removeCardById = (cards: BaseCardProps[]): BaseCardProps[] => {
        // 过滤掉要删除的卡片
        const filtered = cards.filter((card) => card.id !== id);

        // 处理子卡片
        return filtered.map((card) => {
          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            return {
              ...card,
              childCards: removeCardById(card.childCards),
            };
          }
          return card;
        });
      };

      return removeCardById(prev);
    });
  }, []);

  // 添加大纲卡片（页面级添加按钮）
  const handleAddCard = useCallback((_containerType: CardContainerType, title?: string) => {
    // 为根大纲添加一个新的章节或部分
    const newCard: BaseCardProps = {
      id: `outline-section-${Date.now()}`,
      title: title || "新章节",
      isCollapsed: false,
      containerType: CardContainerType.COLLECTION,
      childCards: [],
      tag: "outline-section",
      showEditButton: true,
      showAddButton: true,
      showDeleteButton: true,
      showRelateButton: false,
    };

    // 添加到根大纲
    setCards((prev) => {
      // 找到根大纲卡片
      const rootOutline = prev.find((card) => card.id === "outline-root");
      if (rootOutline) {
        return updateCardInArray(prev, "outline-root", {
          childCards: [...(rootOutline.childCards || []), newCard],
        });
      }
      return prev;
    });
  }, []);

  // 添加子卡片
  const handleAddChildCard = useCallback(
    (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => {
      if (containerType === CardContainerType.EDITOR) {
        // 添加内容卡片
        const newChildCard: BaseCardProps = {
          id: `outline-content-${Date.now()}`,
          title: title || "内容",
          content: "",
          isCollapsed: false,
          containerType: CardContainerType.EDITOR,
          hideTitle,
          tag: "outline-content",
          showEditButton: true,
          showAddButton: false,
          showDeleteButton: true,
          showRelateButton: true,
        };

        setCards((prev) => addChildCardToParent(prev, parentId, newChildCard));

        // 打开内容编辑对话框
        setCurrentCardId(newChildCard.id);
        setContentDialogOpen(true);
      } else {
        // 添加集合卡片（子章节）
        const newChildCard: BaseCardProps = {
          id: `outline-subsection-${Date.now()}`,
          title: title || "子章节",
          isCollapsed: false,
          containerType: CardContainerType.COLLECTION,
          childCards: [],
          tag: "outline-subsection",
          showEditButton: true,
          showAddButton: true,
          showDeleteButton: true,
          showRelateButton: false,
        };

        setCards((prev) => addChildCardToParent(prev, parentId, newChildCard));
      }
    },
    [],
  );

  // 关联卡片
  const handleRelateCard = useCallback((id: string) => {
    setCurrentCardId(id);
    setContentDialogOpen(true);
  }, []);

  // 解除关联
  const handleUnrelateCard = useCallback(
    (id: string) => {
      handleUpdateCard(id, { relatedItem: undefined });
    },
    [handleUpdateCard],
  );

  // 处理内容更新
  const handleUpdateContent = useCallback(
    (data: {
      content: string;
      relatedChapter?: { id: string; title: string; isExternal?: boolean };
    }) => {
      if (currentCardId) {
        handleUpdateCard(currentCardId, {
          content: data.content,
          relatedItem: data.relatedChapter
            ? {
                id: data.relatedChapter.id,
                title: data.relatedChapter.title,
                type: "chapter",
                isExternal: data.relatedChapter.isExternal,
              }
            : undefined,
        });
      }
    },
    [currentCardId, handleUpdateCard],
  );

  // 查找卡片
  const findCard = useCallback((id: string, cardsToSearch: BaseCardProps[]): BaseCardProps | null => {
    for (const card of cardsToSearch) {
      if (card.id === id) {
        return card;
      }

      if (card.childCards && card.childCards.length > 0) {
        const foundInChildren = findCard(id, card.childCards);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return null;
  }, []);

  // 处理卡片移动
  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
      if (!dragParentId && !hoverParentId) {
        // 顶级卡片移动
        setCards((prevCards) => {
          const newCards = [...prevCards];
          const [removed] = newCards.splice(dragIndex, 1);
          newCards.splice(hoverIndex, 0, removed);
          return newCards;
        });
        return;
      }

      if (dragParentId && hoverParentId && dragParentId === hoverParentId) {
        // 同一父卡片下的子卡片移动
        setCards((prevCards) => {
          // 查找父卡片并更新其子卡片顺序
          const updateParentCard = (cards: BaseCardProps[]): BaseCardProps[] => {
            return cards.map((card) => {
              if (card.id === dragParentId) {
                const newChildCards = [...(card.childCards || [])];
                const [removed] = newChildCards.splice(dragIndex, 1);
                newChildCards.splice(hoverIndex, 0, removed);
                return { ...card, childCards: newChildCards };
              }

              if (card.childCards) {
                return { ...card, childCards: updateParentCard(card.childCards) };
              }

              return card;
            });
          };

          return updateParentCard(prevCards);
        });
        return;
      }

      // 跨容器拖拽（简化实现）
      if (dragParentId && hoverParentId && dragParentId !== hoverParentId) {
        setCards((prevCards) => {
          // 复杂的跨容器拖拽逻辑
          let draggedCard: BaseCardProps | null = null;

          // 从源容器中提取卡片
          const removeFromSource = (cards: BaseCardProps[]): BaseCardProps[] => {
            return cards.map((card) => {
              if (card.id === dragParentId && card.childCards) {
                const newChildCards = [...card.childCards];
                draggedCard = newChildCards[dragIndex];
                newChildCards.splice(dragIndex, 1);
                return { ...card, childCards: newChildCards };
              }

              if (card.childCards) {
                return { ...card, childCards: removeFromSource(card.childCards) };
              }

              return card;
            });
          };

          // 添加到目标容器
          const addToTarget = (cards: BaseCardProps[]): BaseCardProps[] => {
            if (!draggedCard) return cards;

            return cards.map((card) => {
              if (card.id === hoverParentId && card.childCards) {
                const newChildCards = [...card.childCards];
                newChildCards.splice(hoverIndex, 0, draggedCard);
                return { ...card, childCards: newChildCards };
              }

              if (card.childCards) {
                return { ...card, childCards: addToTarget(card.childCards) };
              }

              return card;
            });
          };

          // 先移除，再添加
          const cardsAfterRemoval = removeFromSource(prevCards);
          return addToTarget(cardsAfterRemoval);
        });
      }
    },
    [],
  );

  return (
    <div className="p-4">
      <CardSystem
        cards={cards}
        title="大纲管理"
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddChildCard={handleAddChildCard}
        onRelateCard={handleRelateCard}
        onUnrelateCard={handleUnrelateCard}
        moveCard={handleMoveCard}
        isMobile={isMobile}
        buttonsConfig={{
          showEditButton: true,
          showAddButton: true,
          showDeleteButton: true,
          showRelateButton: true,
        }}
        addButtonText="添加章节"
        availableRelateItems={availableChapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          type: "chapter",
        }))}
      />

      {/* 内容编辑对话框 */}
      <OutlineContentDialog
        open={contentDialogOpen}
        onClose={() => {
          setContentDialogOpen(false);
          setCurrentCardId(null);
        }}
        onConfirm={handleUpdateContent}
        availableChapters={availableChapters}
        onChapterClick={onChapterClick}
        initialContent={currentCardId ? findCard(currentCardId, cards)?.content || "" : ""}
        initialRelatedChapter={
          currentCardId && findCard(currentCardId, cards)?.relatedItem
            ? {
                id: findCard(currentCardId, cards)?.relatedItem?.id || "",
                title: findCard(currentCardId, cards)?.relatedItem?.title || "",
                isExternal: findCard(currentCardId, cards)?.relatedItem?.isExternal,
              }
            : undefined
        }
      />
    </div>
  );
}
