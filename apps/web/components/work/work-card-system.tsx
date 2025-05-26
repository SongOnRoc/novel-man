import { type BaseCardProps, CardContainerType, CardSystem } from "@novel-man/card-system";
import { useCallback, useState } from "react";

// 示例卡片数据
const initialCards: BaseCardProps[] = [
  {
    id: "1",
    title: "作品信息",
    content: "这里可以添加作品的基本信息",
    isCollapsed: false,
    containerType: CardContainerType.EDITOR,
  },
  {
    id: "2",
    title: "角色列表",
    isCollapsed: false,
    containerType: CardContainerType.COLLECTION,
    childCards: [
      {
        id: "2-1",
        title: "主角",
        content: "主角的描述和设定",
        isCollapsed: false,
        containerType: CardContainerType.EDITOR,
      },
      {
        id: "2-2",
        title: "配角",
        content: "配角的描述和设定",
        isCollapsed: false,
        containerType: CardContainerType.EDITOR,
      },
    ],
  },
  {
    id: "3",
    title: "世界观设定",
    isCollapsed: false,
    containerType: CardContainerType.EDITOR,
    content: "世界观的基本设定和规则",
  },
];

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
function addChildCardToParent(cards: BaseCardProps[], parentId: string, newChildCard: BaseCardProps): BaseCardProps[] {
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

// 辅助函数：移动卡片
function moveCardInArray(
  cards: BaseCardProps[],
  dragIndex: number,
  hoverIndex: number,
  dragParentId?: string,
  hoverParentId?: string,
): BaseCardProps[] {
  // 如果是在同一级别移动
  if (dragParentId === hoverParentId) {
    const result = [...cards];
    const [removed] = result.splice(dragIndex, 1);
    result.splice(hoverIndex, 0, removed);
    return result;
  }

  // 如果是跨容器移动，这里简化处理
  return cards;
}

// 辅助函数：从一个容器中移除卡片
function removeCardFromContainer(
  cards: BaseCardProps[],
  parentId: string,
  index: number,
): [BaseCardProps[], BaseCardProps | undefined] {
  if (!parentId || parentId === "root") {
    // 从顶级移除
    const newCards = [...cards];
    const [removedCard] = newCards.splice(index, 1);
    return [newCards, removedCard];
  }

  // 从子容器移除
  let removedCard: BaseCardProps | undefined;
  const newCards = cards.map((card) => {
    if (card.id === parentId && card.childCards) {
      const newChildCards = [...card.childCards];
      [removedCard] = newChildCards.splice(index, 1);
      return { ...card, childCards: newChildCards };
    }
    if (card.childCards) {
      const [newChildCards, removed] = removeCardFromContainer(card.childCards, parentId, index);
      if (removed) {
        removedCard = removed;
        return { ...card, childCards: newChildCards };
      }
    }
    return card;
  });

  return [newCards, removedCard];
}

// 辅助函数：向容器添加卡片
function addCardToContainer(
  cards: BaseCardProps[],
  parentId: string,
  index: number,
  cardToAdd: BaseCardProps,
): BaseCardProps[] {
  if (!parentId || parentId === "root") {
    // 添加到顶级
    const newCards = [...cards];
    newCards.splice(index, 0, cardToAdd);
    return newCards;
  }

  // 添加到子容器
  return cards.map((card) => {
    if (card.id === parentId && card.childCards) {
      const newChildCards = [...card.childCards];
      newChildCards.splice(index, 0, cardToAdd);
      return { ...card, childCards: newChildCards };
    }
    if (card.childCards) {
      return { ...card, childCards: addCardToContainer(card.childCards, parentId, index, cardToAdd) };
    }
    return card;
  });
}

export function WorkCardSystem() {
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);

  // 处理添加卡片
  const handleAddCard = useCallback((containerType: CardContainerType, title?: string, hideTitle?: boolean) => {
    const newCard: BaseCardProps = {
      id: Date.now().toString(),
      title: title || "新卡片",
      isCollapsed: false,
      containerType,
      hideTitle,
      childCards: containerType === CardContainerType.COLLECTION ? [] : undefined,
    };

    setCards((prevCards) => [...prevCards, newCard]);
  }, []);

  // 处理更新卡片
  const handleUpdateCard = useCallback((id: string, updates: Partial<BaseCardProps>) => {
    setCards((prevCards) => updateCardInArray(prevCards, id, updates));
  }, []);

  // 处理删除卡片
  const handleDeleteCard = useCallback((id: string) => {
    setCards((prevCards) => {
      // 递归查找并删除卡片
      function removeCard(cards: BaseCardProps[]): BaseCardProps[] {
        return cards.filter((card) => {
          if (card.id === id) return false;
          if (card.childCards) {
            card.childCards = removeCard(card.childCards);
          }
          return true;
        });
      }

      return removeCard(prevCards);
    });
  }, []);

  // 处理添加子卡片
  const handleAddChildCard = useCallback(
    (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => {
      const newChildCard: BaseCardProps = {
        id: `${parentId}-${Date.now()}`,
        title: title || "新子卡片",
        isCollapsed: false,
        containerType,
        hideTitle,
        childCards: containerType === CardContainerType.COLLECTION ? [] : undefined,
      };

      setCards((prevCards) => addChildCardToParent(prevCards, parentId, newChildCard));
    },
    [],
  );

  // 处理卡片移动
  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
      if (dragParentId === hoverParentId) {
        // 同级移动
        setCards((prevCards) => {
          if (!dragParentId) {
            // 顶级卡片移动
            return moveCardInArray(prevCards, dragIndex, hoverIndex);
          }

          // 子卡片移动，需要先找到父卡片
          return updateCardInArray(prevCards, dragParentId, {
            childCards: moveCardInArray(
              prevCards.find((card) => card.id === dragParentId)?.childCards || [],
              dragIndex,
              hoverIndex,
            ),
          });
        });
      } else {
        // 跨容器移动的逻辑
        setCards((prevCards) => {
          // 1. 从源容器中移除卡片
          const [cardsAfterRemove, removedCard] = removeCardFromContainer(prevCards, dragParentId || "root", dragIndex);

          if (!removedCard) {
            console.error("移动卡片失败：找不到要移动的卡片");
            return prevCards;
          }

          // 2. 添加到目标容器
          return addCardToContainer(cardsAfterRemove, hoverParentId || "root", hoverIndex, removedCard);
        });
      }
    },
    [],
  );

  // 关联项目
  const handleRelateCard = useCallback((id: string) => {
    console.log(`关联卡片: ${id}`);
    // 实际应用中，这里可能会打开一个对话框让用户选择要关联的项目
  }, []);

  // 解除关联
  const handleUnrelateCard = useCallback((id: string) => {
    setCards((prevCards) => updateCardInArray(prevCards, id, { relatedItem: undefined }));
  }, []);

  return (
    <div className="p-4">
      <CardSystem
        cards={cards}
        title="作品管理"
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddChildCard={handleAddChildCard}
        moveCard={handleMoveCard}
        onRelateCard={handleRelateCard}
        onUnrelateCard={handleUnrelateCard}
        buttonsConfig={{
          showEditButton: true,
          showAddButton: true,
          showDeleteButton: true,
          showRelateButton: true,
        }}
        addButtonText="添加新卡片"
        attributeOptions={[
          { value: "character", label: "角色" },
          { value: "setting", label: "设定" },
          { value: "plot", label: "情节" },
          { value: "note", label: "笔记" },
        ]}
        availableRelateItems={[
          { id: "chapter-1", title: "第一章", type: "chapter" },
          { id: "chapter-2", title: "第二章", type: "chapter" },
          { id: "volume-1", title: "第一卷", type: "volume" },
        ]}
      />
    </div>
  );
}
