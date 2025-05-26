"use client";

import {
  ATTRIBUTE_TYPES,
  AttributeDialog,
  CharacterDialog,
  ContentDialog,
} from "@/components/dialogs/character-dialogs";
import { type BaseCardProps, CardContainerType, CardSystem } from "@novel-man/card-system";
import { useCallback, useState } from "react";

// 角色卡片系统属性
interface CharacterCardSystemProps {
  availableChapters?: Array<{ id: string; title: string }>;
  isMobile?: boolean;
  onChapterClick?: (chapterId: string) => void;
}

export function CharacterCardSystem({
  availableChapters = [],
  isMobile = false,
  onChapterClick,
}: CharacterCardSystemProps) {
  // 对话框状态
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false);
  const [attributeDialogOpen, setAttributeDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // 卡片数据状态
  const [cards, setCards] = useState<BaseCardProps[]>([]);

  // 从ATTRIBUTE_TYPES生成属性选项
  const attributeOptions = ATTRIBUTE_TYPES.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  // 获取属性类型标签名称
  const getAttributeTypeLabel = (typeValue: string) => {
    const foundType = ATTRIBUTE_TYPES.find((type) => type.value === typeValue);
    return foundType ? foundType.label : typeValue;
  };

  // 更新卡片
  const handleUpdateCard = useCallback((id: string, updates: Partial<BaseCardProps>) => {
    setCards((prev) => {
      // 使用辅助函数更新卡片数组中的指定卡片
      function updateCardInArray(cards: BaseCardProps[]): BaseCardProps[] {
        return cards.map((card) => {
          if (card.id === id) {
            return { ...card, ...updates };
          }

          if (card.childCards) {
            return {
              ...card,
              childCards: updateCardInArray(card.childCards),
            };
          }

          return card;
        });
      }

      return updateCardInArray(prev);
    });
  }, []);

  // 通用的子卡片添加函数
  const addChildCardToParent = useCallback((parentId: string, childCard: BaseCardProps) => {
    setCards((prev) => {
      const updateCardWithChild = (cards: BaseCardProps[]): BaseCardProps[] => {
        return cards.map((card) => {
          if (card.id === parentId) {
            return {
              ...card,
              childCards: [...(card.childCards || []), childCard],
            };
          }

          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            return {
              ...card,
              childCards: updateCardWithChild(card.childCards),
            };
          }

          return card;
        });
      };

      return updateCardWithChild(prev);
    });
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

  // 添加角色卡片（页面级添加按钮）
  const handleAddCard = useCallback((_containerType: CardContainerType, _title?: string) => {
    // 打开角色创建对话框
    setCharacterDialogOpen(true);
  }, []);

  // 确认添加角色
  const handleAddCharacter = useCallback((data: { name: string; role: string }) => {
    const newCard: BaseCardProps = {
      id: `role-${Date.now()}`,
      title: data.name,
      content: `角色类型：${data.role}`,
      type: data.role, // 主角、配角等
      tag: "role", // 标签为role
      isCollapsed: false,
      containerType: CardContainerType.COLLECTION, // 角色卡片是集合类卡片
      childCards: [], // 子卡片初始为空
      showEditButton: true,
      showAddButton: true,
      showDeleteButton: true,
      showRelateButton: false,
    };
    setCards((prev) => [...prev, newCard]);
  }, []);

  // 确认添加属性
  const handleAddAttribute = useCallback(
    (data: { type: string }) => {
      if (!currentParentId) return;

      const attributeLabel = getAttributeTypeLabel(data.type);

      const newChildCard: BaseCardProps = {
        id: `role-${data.type}-${Date.now()}`,
        title: attributeLabel,
        content: "",
        type: "attribute",
        tag: `role-${data.type}`, // 标签为role-xxx，如role-description
        isCollapsed: false,
        containerType: CardContainerType.COLLECTION, // 属性卡片是集合类卡片
        childCards: [], // 初始子卡片为空
        showEditButton: true,
        showAddButton: true,
        showDeleteButton: true,
        showRelateButton: false,
      };

      addChildCardToParent(currentParentId, newChildCard);
    },
    [currentParentId, getAttributeTypeLabel, addChildCardToParent],
  );

  // 更新内容
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

  // 添加子卡片
  const handleAddChildCard = useCallback(
    (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => {
      // 如果是角色卡片，打开属性对话框
      const parentCard = findParentCard(cards, parentId);
      if (parentCard?.tag === "role") {
        setCurrentParentId(parentId);
        setAttributeDialogOpen(true);
        return;
      }

      // 否则，直接添加内容卡片
      const newChildCard: BaseCardProps = {
        id: `content-${Date.now()}`,
        title: title || "内容",
        content: "",
        isCollapsed: false,
        containerType,
        hideTitle,
        showEditButton: true,
        showAddButton: false,
        showDeleteButton: true,
        showRelateButton: true,
      };

      addChildCardToParent(parentId, newChildCard);
    },
    [cards, addChildCardToParent],
  );

  // 查找父卡片
  const findParentCard = (cardsToSearch: BaseCardProps[], cardId: string): BaseCardProps | null => {
    for (const card of cardsToSearch) {
      if (card.id === cardId) {
        return card;
      }

      if (card.childCards && card.childCards.length > 0) {
        const foundInChildren = findParentCard(card.childCards, cardId);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }

    return null;
  };

  // 关联卡片
  const handleRelateCard = useCallback(
    (id: string) => {
      setCurrentCardId(id);
      setContentDialogOpen(true);
    },
    [setCurrentCardId, setContentDialogOpen],
  );

  // 解除关联
  const handleUnrelateCard = useCallback(
    (id: string) => {
      handleUpdateCard(id, { relatedItem: undefined });
    },
    [handleUpdateCard],
  );

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
          const findParentCard = (cards: BaseCardProps[]): BaseCardProps[] => {
            return cards.map((card) => {
              if (card.id === dragParentId) {
                const newChildCards = [...(card.childCards || [])];
                const [removed] = newChildCards.splice(dragIndex, 1);
                newChildCards.splice(hoverIndex, 0, removed);
                return { ...card, childCards: newChildCards };
              }

              if (card.childCards) {
                return { ...card, childCards: findParentCard(card.childCards) };
              }

              return card;
            });
          };

          return findParentCard(prevCards);
        });
        return;
      }

      // 跨容器拖拽
      if (dragParentId && hoverParentId && dragParentId !== hoverParentId) {
        setCards((prevCards) => {
          // 复杂的跨容器拖拽逻辑
          const moveCardBetweenContainers = (cards: BaseCardProps[]): BaseCardProps[] => {
            // 在源容器中移除卡片
            const moveInSameContainer = (cards: BaseCardProps[], parentId: string): boolean => {
              for (let i = 0; i < cards.length; i++) {
                if (cards[i].id === parentId) {
                  if (cards[i].childCards && cards[i].childCards.length > dragIndex) {
                    // 执行移动
                    const newChildCards = [...cards[i].childCards];
                    const [removed] = newChildCards.splice(dragIndex, 1);
                    cards[i] = { ...cards[i], childCards: newChildCards };

                    // 找到目标容器并添加卡片
                    const addToTargetContainer = (cards: BaseCardProps[], targetParentId: string): boolean => {
                      for (let j = 0; j < cards.length; j++) {
                        if (cards[j].id === targetParentId) {
                          const targetChildCards = [...(cards[j].childCards || [])];
                          targetChildCards.splice(hoverIndex, 0, removed);
                          cards[j] = { ...cards[j], childCards: targetChildCards };
                          return true;
                        }

                        if (cards[j].childCards) {
                          if (addToTargetContainer(cards[j].childCards, targetParentId)) {
                            return true;
                          }
                        }
                      }
                      return false;
                    };

                    addToTargetContainer(cards, hoverParentId);
                    return true;
                  }
                }

                if (cards[i].childCards) {
                  if (moveInSameContainer(cards[i].childCards, parentId)) {
                    return true;
                  }
                }
              }
              return false;
            };

            moveInSameContainer(cards, dragParentId);
            return [...cards];
          };

          return moveCardBetweenContainers(prevCards);
        });
      }
    },
    [],
  );

  return (
    <div className="p-4">
      <CardSystem
        cards={cards}
        title="角色管理"
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
        addButtonText="添加角色"
        attributeOptions={attributeOptions}
        availableRelateItems={availableChapters.map((chapter) => ({
          id: chapter.id,
          title: chapter.title,
          type: "chapter",
        }))}
      />

      {/* 角色创建对话框 */}
      <CharacterDialog
        open={characterDialogOpen}
        onClose={() => setCharacterDialogOpen(false)}
        onConfirm={handleAddCharacter}
      />

      {/* 属性添加对话框 */}
      <AttributeDialog
        open={attributeDialogOpen}
        onClose={() => setAttributeDialogOpen(false)}
        onConfirm={handleAddAttribute}
        attributeTypes={ATTRIBUTE_TYPES}
      />

      {/* 内容编辑对话框 */}
      <ContentDialog
        open={contentDialogOpen}
        onClose={() => setContentDialogOpen(false)}
        onConfirm={handleUpdateContent}
        availableChapters={availableChapters}
        onChapterClick={onChapterClick}
        initialContent={currentCardId ? findParentCard(cards, currentCardId)?.content || "" : ""}
        initialRelatedChapter={
          currentCardId && findParentCard(cards, currentCardId)?.relatedItem
            ? {
                id: findParentCard(cards, currentCardId)?.relatedItem?.id || "",
                title: findParentCard(cards, currentCardId)?.relatedItem?.title || "",
                isExternal: findParentCard(cards, currentCardId)?.relatedItem?.isExternal,
              }
            : undefined
        }
      />
    </div>
  );
}
