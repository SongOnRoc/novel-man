"use client";

import {
  ATTRIBUTE_TYPES,
  AttributeDialog,
  CharacterDialog,
  ContentDialog,
} from "@/components/dialogs/character-dialogs";
import { useCallback, useState } from "react";
import { CardComponent, CardContainerType, CardSystem } from "./base-card-system";
import type { BaseCardProps } from "./base-card-system";

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
    setCards((prev) =>
      prev.map((card) => {
        // 更新主卡片
        if (card.id === id) {
          return { ...card, ...updates };
        }

        // 如果是集合类卡片，检查其子卡片
        if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
          const updatedChildCards = card.childCards.map((childCard) => {
            if (childCard.id === id) {
              return { ...childCard, ...updates };
            }

            // 检查三级卡片（子卡片的子卡片）
            if (childCard.containerType === CardContainerType.COLLECTION && childCard.childCards) {
              const updatedGrandChildCards = childCard.childCards.map((grandChildCard) =>
                grandChildCard.id === id ? { ...grandChildCard, ...updates } : grandChildCard,
              );
              return { ...childCard, childCards: updatedGrandChildCards };
            }

            return childCard;
          });
          return { ...card, childCards: updatedChildCards };
        }

        return card;
      }),
    );
  }, []);

  // 通用的子卡片添加函数，不依赖其他复杂函数
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

  // 处理关联功能
  const handleRelateCard = useCallback((id: string) => {
    // 标记正在关联的卡片ID
    setCurrentCardId(id);
  }, []);

  // 处理解除关联
  const handleUnrelateCard = useCallback(
    (id: string) => {
      handleUpdateCard(id, { relatedItem: undefined });
    },
    [handleUpdateCard],
  );

  // 获取可关联的项目
  const availableRelateItems = availableChapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    type: "chapter",
  }));

  // 添加子卡片 - 移动到这里，确保在使用前声明
  const handleAddChildCard = useCallback(
    (parentId: string, containerType: CardContainerType, title?: string, hideTitle = false) => {
      console.log("CHARACTER handleAddChildCard called:", { parentId, containerType, title, hideTitle });

      // 查找父卡片以获取其标签
      const findParentCard = (cardsToSearch: BaseCardProps[]): BaseCardProps | null => {
        for (const card of cardsToSearch) {
          if (card.id === parentId) return card;

          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            const found = findParentCard(card.childCards);
            if (found) return found;
          }
        }
        return null;
      };

      const parentCard = findParentCard(cards);
      if (!parentCard) {
        console.error("Parent card not found:", parentId);
        return;
      }

      console.log("Parent card found:", parentCard);
      setCurrentParentId(parentId);

      if (containerType === CardContainerType.EDITOR) {
        // 如果是编辑器类卡片
        const newCardId = `${Date.now()}-editor`;
        let newCard: BaseCardProps;

        // 创建编辑器卡片，根据hideTitle参数决定是否隐藏标题
        const attributeType = title
          ? attributeOptions.find((opt) => opt.label === title)?.value || "custom"
          : "content";

        newCard = {
          id: `${attributeType}-editor-${Date.now()}`,
          title: title || "内容卡片", // 即使隐藏标题也设置一个默认标题
          content: "",
          type: "content",
          tag: `role-${attributeType}-editor`, // 标签基于属性类型
          isCollapsed: false,
          containerType: CardContainerType.EDITOR,
          hideTitle: hideTitle, // 根据参数决定是否隐藏标题
          showEditButton: !hideTitle, // 如果显示标题则显示编辑按钮
          showAddButton: false,
          showDeleteButton: true,
          showRelateButton: true,
        };

        console.log("Creating editor card:", { hideTitle, newCard });

        // 添加卡片
        console.log("Before adding card to parent, cards:", cards);
        addChildCardToParent(parentId, newCard);
        console.log("After adding card to parent, currentCardId will be set to:", newCard.id);

        // 创建完卡片后打开内容对话框
        setCurrentCardId(newCard.id);
        setContentDialogOpen(true);
      } else if (containerType === CardContainerType.COLLECTION) {
        // 如果父卡片标签是role且选择的是集合类卡片，打开属性对话框
        if (parentCard.tag === "role") {
          console.log("Opening attribute dialog for role parent");
          setAttributeDialogOpen(true);
        } else {
          // 其他情况下的集合类卡片
          const newChildCard: BaseCardProps = {
            id: `${parentCard.tag}-collection-${Date.now()}`,
            title: title || "集合卡片",
            content: "",
            type: "collection",
            tag: `${parentCard.tag}-collection`,
            isCollapsed: false,
            containerType: CardContainerType.COLLECTION,
            childCards: [],
            showEditButton: true,
            showAddButton: true,
            showDeleteButton: true,
            showRelateButton: false,
          };

          console.log("Creating collection card:", newChildCard);
          addChildCardToParent(parentId, newChildCard);
        }
      }
    },
    [
      cards,
      attributeOptions,
      addChildCardToParent,
      setContentDialogOpen,
      setAttributeDialogOpen,
      setCurrentCardId,
      setCurrentParentId,
    ],
  );

  // 处理渲染自定义卡片
  const renderCustomCard = useCallback(
    (card: BaseCardProps, index: number) => {
      return (
        <CardComponent
          key={card.id}
          card={card}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onAddChild={handleAddChildCard}
          onRelate={handleRelateCard}
          onUnrelate={handleUnrelateCard}
          index={index}
          buttonsConfig={{
            showEditButton: card.showEditButton !== false,
            showAddButton: card.showAddButton !== false,
            showDeleteButton: card.showDeleteButton !== false,
            showRelateButton: card.showRelateButton || false,
          }}
          attributeOptions={attributeOptions}
          availableRelateItems={availableRelateItems}
        />
      );
    },
    [
      handleUpdateCard,
      handleDeleteCard,
      handleAddChildCard,
      handleRelateCard,
      handleUnrelateCard,
      attributeOptions,
      availableRelateItems,
    ],
  );

  // 对话框关闭时清除当前状态
  const _handleDialogClose = useCallback((setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(false);
    setCurrentCardId(null);
    setCurrentParentId(null);
  }, []);

  // 查找卡片的辅助函数
  const findCardById = useCallback((id: string, cardsToSearch: BaseCardProps[]): BaseCardProps | null => {
    for (const card of cardsToSearch) {
      if (card.id === id) return card;

      if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
        const found = findCardById(id, card.childCards);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 确认添加内容 - 放在最后避免依赖问题
  const _handleAddContent = useCallback(
    (data: {
      content: string;
      relatedChapter?: { id: string; title: string; isExternal?: boolean };
    }) => {
      console.log("_handleAddContent called:", { data, currentParentId, currentCardId });

      if (!currentParentId && !currentCardId) {
        console.error("No current parent or card ID set");
        return;
      }

      // 如果是已经创建的卡片，更新其内容
      if (currentCardId) {
        console.log("Updating existing card:", currentCardId);
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
        return;
      }

      // 查找父卡片以获取其标签
      const findParentCard = (cards: BaseCardProps[]): BaseCardProps | null => {
        for (const card of cards) {
          if (card.id === currentParentId) return card;

          if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
            const found = findParentCard(card.childCards);
            if (found) return found;
          }
        }
        return null;
      };

      const parentCard = findParentCard(cards);
      if (!parentCard) {
        console.error("Parent card not found in _handleAddContent");
        return;
      }

      console.log("Creating content card for parent:", parentCard);

      // 创建内容卡片，标签基于父卡片标签
      const newContentCard: BaseCardProps = {
        id: `${parentCard.tag}-editor-${Date.now()}`,
        title: "详细内容", // 即使隐藏标题，也需要设置一个标题
        content: data.content,
        type: "content",
        tag: `${parentCard.tag}-editor`, // 标签为父标签-editor
        isCollapsed: false,
        containerType: CardContainerType.EDITOR, // 内容卡片是编辑器类卡片
        hideTitle: true, // 默认隐藏标题
        showEditButton: false,
        showAddButton: false,
        showDeleteButton: true,
        showRelateButton: true,
        relatedItem: data.relatedChapter
          ? {
              id: data.relatedChapter.id,
              title: data.relatedChapter.title,
              type: "chapter",
              isExternal: data.relatedChapter.isExternal,
            }
          : undefined,
      };

      console.log("Adding new content card:", newContentCard);
      addChildCardToParent(currentParentId, newContentCard);
    },
    [currentParentId, currentCardId, cards, handleUpdateCard, addChildCardToParent],
  );

  // 移动卡片
  const _handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
      console.log("Moving card:", { dragIndex, hoverIndex, dragParentId, hoverParentId });

      setCards((prevCards) => {
        // 创建卡片的深拷贝
        const newCards = JSON.parse(JSON.stringify(prevCards));

        // 如果是同一容器内的拖拽
        if (!dragParentId || !hoverParentId || dragParentId === hoverParentId) {
          // 顶级卡片移动
          if (dragParentId === "root" && hoverParentId === "root") {
            const [removed] = newCards.splice(dragIndex, 1);
            newCards.splice(hoverIndex, 0, removed);
            return newCards;
          }

          // 子卡片在同一父容器内移动
          const moveInSameContainer = (cards: BaseCardProps[], parentId: string): boolean => {
            for (const card of cards) {
              if (card.id === parentId && card.childCards) {
                const [removed] = card.childCards.splice(dragIndex, 1);
                card.childCards.splice(hoverIndex, 0, removed);
                return true;
              }

              if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
                if (moveInSameContainer(card.childCards, parentId)) {
                  return true;
                }
              }
            }
            return false;
          };

          if (dragParentId && dragParentId !== "root") {
            moveInSameContainer(newCards, dragParentId);
          }
        }
        // 跨容器拖拽
        else {
          // 从源容器中提取卡片
          let extractedCard: BaseCardProps | undefined;

          // 如果是从根容器拖拽
          if (dragParentId === "root") {
            extractedCard = newCards[dragIndex];
            newCards.splice(dragIndex, 1);
          }
          // 从子容器拖拽
          else {
            const extractFromContainer = (cards: BaseCardProps[], parentId: string): BaseCardProps | undefined => {
              for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                if (card.id === parentId && card.childCards) {
                  if (dragIndex < card.childCards.length) {
                    const [removed] = card.childCards.splice(dragIndex, 1);
                    return removed;
                  }
                  return undefined;
                }

                if (card.containerType === CardContainerType.COLLECTION && card.childCards) {
                  const extracted = extractFromContainer(card.childCards, parentId);
                  if (extracted) return extracted;
                }
              }
              return undefined;
            };

            extractedCard = extractFromContainer(newCards, dragParentId);
          }

          // 将提取的卡片添加到目标容器
          if (extractedCard) {
            // 添加到根容器
            if (hoverParentId === "root") {
              newCards.splice(hoverIndex, 0, extractedCard);
            }
            // 添加到子容器
            else {
              const addToContainer = (cards: BaseCardProps[], parentId: string, card: BaseCardProps): boolean => {
                for (let i = 0; i < cards.length; i++) {
                  const containerCard = cards[i];
                  if (containerCard.id === parentId && containerCard.childCards) {
                    containerCard.childCards.splice(hoverIndex, 0, card);
                    return true;
                  }

                  if (containerCard.containerType === CardContainerType.COLLECTION && containerCard.childCards) {
                    if (addToContainer(containerCard.childCards, parentId, card)) {
                      return true;
                    }
                  }
                }
                return false;
              };

              addToContainer(newCards, hoverParentId, extractedCard);
            }
          }
        }

        return newCards;
      });
    },
    [],
  );

  // 处理章节点击
  const _handleChapterClick = useCallback(
    (chapterId: string) => {
      if (onChapterClick) {
        onChapterClick(chapterId);
      }
    },
    [onChapterClick],
  );

  return (
    <div className="w-full">
      <CardSystem
        cards={cards}
        title="角色管理"
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddChildCard={handleAddChildCard}
        onRelateCard={handleRelateCard}
        onUnrelateCard={handleUnrelateCard}
        moveCard={_handleMoveCard}
        renderCard={renderCustomCard}
        buttonsConfig={{
          showEditButton: true,
          showAddButton: true,
          showDeleteButton: true,
          showRelateButton: true,
        }}
        isMobile={isMobile}
        addButtonText="添加角色"
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
      />

      {/* 角色创建对话框 */}
      <CharacterDialog
        open={characterDialogOpen}
        onClose={() => setCharacterDialogOpen(false)}
        onConfirm={handleAddCharacter}
      />

      {/* 属性创建对话框 */}
      <AttributeDialog
        open={attributeDialogOpen}
        onClose={() => setAttributeDialogOpen(false)}
        onConfirm={handleAddAttribute}
        attributeTypes={ATTRIBUTE_TYPES}
      />

      {/* 内容编辑对话框 */}
      <ContentDialog
        open={contentDialogOpen}
        onClose={() => {
          console.log("ContentDialog onClose called");
          setContentDialogOpen(false);
          setCurrentCardId(null);
          setCurrentParentId(null);
        }}
        onConfirm={(data) => {
          console.log("ContentDialog onConfirm called with data:", data);
          if (currentCardId) {
            // 如果是更新现有卡片
            console.log("Updating existing card:", currentCardId);
            handleUpdateContent(data);
          } else if (currentParentId) {
            // 如果是创建新卡片
            console.log("Creating new card for parent:", currentParentId);
            _handleAddContent(data);
          } else {
            console.error("No currentCardId or currentParentId set");
          }
        }}
        defaultContent={currentCardId ? findCardById(currentCardId, cards)?.content || "" : ""}
      />
    </div>
  );
}
