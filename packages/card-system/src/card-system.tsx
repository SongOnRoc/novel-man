import { useCallback, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { CardComponent } from "./card-component";
import { DefaultCardFactory } from "./card-factory";
import { AddCardDialog } from "./components/dialogs";
import { DraggableCard } from "./components/draggable-card";
import {
  type BaseCardProps,
  type CardButtonsConfig,
  CardContainerType,
  type CardProperty,
  type CollectionLayoutStyle,
} from "./types";

interface CardSystemProps {
  // 初始卡片数据，可选
  initialCards?: BaseCardProps[];
  // 卡片系统标题
  title: string;
  // 外部状态同步回调，可选
  onCardsChange?: (cards: BaseCardProps[]) => void;
  // 样式配置
  isMobile?: boolean;
  buttonsConfig?: CardButtonsConfig;
  addButtonText?: string;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  defaultCollapsed?: boolean;
}

// 卡片系统组件
export function CardSystem({
  initialCards = [],
  title,
  onCardsChange,
  isMobile = false,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: true,
  },
  addButtonText = "添加卡片",
  attributeOptions = [],
  availableRelateItems = [],
  defaultCollapsed = true,
}: CardSystemProps) {
  // 内部状态管理
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // 创建卡片工厂实例
  const cardFactory = new DefaultCardFactory();

  // 更新卡片状态并通知外部
  const updateCards = useCallback(
    (newCards: BaseCardProps[]) => {
      // 添加深度比较，避免不必要的状态更新
      const hasChanged = JSON.stringify(newCards) !== JSON.stringify(cards);
      if (hasChanged) {
        setCards(newCards);
        if (onCardsChange) {
          onCardsChange(newCards);
        }
      }
    },
    [cards, onCardsChange],
  );

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // 统一的添加卡片函数，根据parentId决定是添加顶级卡片还是子卡片
  const handleAddCard = useCallback(
    (
      containerType: CardContainerType,
      options?: {
        title?: string;
        hideTitle?: boolean;
        props?: CardProperty[];
        parentId?: string | null;
      },
    ) => {
      const { title, hideTitle, props = [], parentId } = options || {};

      // 创建新卡片
      const newCard = cardFactory.createCard({
        title: title || (containerType === CardContainerType.EDITOR ? "新建编辑器" : "新建集合"),
        containerType,
        hideTitle,
        props,
        isCollapsed: defaultCollapsed,
        parent: parentId || undefined,
      });

      // 如果有父卡片ID，则添加为子卡片
      if (parentId) {
        // 递归查找父卡片并添加子卡片
        const addChildToParent = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
          return cardsArray.map((card) => {
            if (card.id === parentId) {
              // 获取父卡片中的子卡片数量，用于生成tag
              const childCount = card.childCards?.length || 0;

              // 更新卡片的parentCardCount属性
              const updatedNewCard = {
                ...newCard,
                parent: parentId,
                // 如果需要根据父卡片的子卡片数量生成tag，可以在这里设置
              };

              // 更新父卡片，添加子卡片并展开父卡片
              return {
                ...card,
                childCards: [...(card.childCards || []), updatedNewCard],
                isCollapsed: false, // 自动展开父卡片
              };
            }

            if (card.childCards && card.childCards.length > 0) {
              return {
                ...card,
                childCards: addChildToParent(card.childCards),
              };
            }

            return card;
          });
        };

        const newCards = addChildToParent(cards);
        updateCards(newCards);
      } else {
        // 添加为顶级卡片
        const newCards = [...cards, newCard];
        updateCards(newCards);
      }
    },
    [cards, cardFactory, defaultCollapsed, updateCards],
  );

  // 更新卡片
  const handleUpdateCard = useCallback(
    (id: string, updates: Partial<BaseCardProps>) => {
      const updateCardInArray = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
        return cardsArray.map((card) => {
          if (card.id === id) {
            return { ...card, ...updates };
          }

          if (card.childCards && card.childCards.length > 0) {
            return {
              ...card,
              childCards: updateCardInArray(card.childCards),
            };
          }

          return card;
        });
      };

      const newCards = updateCardInArray(cards);
      updateCards(newCards);
    },
    [cards, updateCards],
  );

  // 删除卡片
  const handleDeleteCard = useCallback(
    (id: string) => {
      const removeCardById = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
        return cardsArray.filter((card) => {
          if (card.id === id) return false;

          if (card.childCards && card.childCards.length > 0) {
            card.childCards = removeCardById(card.childCards);
          }

          return true;
        });
      };

      const newCards = removeCardById(cards);
      updateCards(newCards);
    },
    [cards, updateCards],
  );

  // 关联卡片
  const handleRelateCard = useCallback((id: string) => {
    // 关联操作已在 CardComponent 中处理
    console.log(`关联卡片: ${id}`);
  }, []);

  // 解除关联
  const handleUnrelateCard = useCallback(
    (id: string) => {
      handleUpdateCard(id, { relatedItem: undefined });
    },
    [handleUpdateCard],
  );

  // 更改布局样式
  const handleChangeLayoutStyle = useCallback(
    (id: string, style: CollectionLayoutStyle) => {
      handleUpdateCard(id, { layoutStyle: style });
    },
    [handleUpdateCard],
  );

  // 移动卡片
  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
      // 确保 dragParentId 和 hoverParentId 有值
      const sourcePid = dragParentId || "root";
      const targetPid = hoverParentId || "root";

      // 防止无效的移动操作
      if (dragIndex < 0) {
        console.error(`无效的拖拽索引: ${dragIndex}`);
        return;
      }

      // 获取拖拽卡片的ID
      let dragCardId: string | undefined;

      // 从源容器中找到拖拽卡片的ID
      if (sourcePid === "root" && dragIndex < cards.length) {
        dragCardId = cards[dragIndex]?.id;
      } else {
        // 在子容器中查找
        const findCardId = (cardsArray: BaseCardProps[], parentId: string): string | undefined => {
          for (const card of cardsArray) {
            if (card.id === parentId && card.childCards && dragIndex < card.childCards.length) {
              return card.childCards[dragIndex]?.id;
            }
            if (card.childCards && card.childCards.length > 0) {
              const id = findCardId(card.childCards, parentId);
              if (id) return id;
            }
          }
          return undefined;
        };

        dragCardId = findCardId(cards, sourcePid);
      }

      // 防止卡片拖入自己的容器中或其子卡片的容器中（避免循环引用）
      if (dragCardId && targetPid !== "root") {
        // 直接循环引用检测
        if (dragCardId === targetPid) {
          console.error(`禁止将卡片拖入自己的容器中: 卡片ID=${dragCardId}, 目标容器=${targetPid}`);
          return;
        }

        // 检查是否会形成循环引用
        const wouldCreateCycle = (cardId: string, targetContainerId: string): boolean => {
          // 检查目标容器是否是当前卡片的子卡片或后代
          const isDescendant = (parentId: string, potentialChildId: string): boolean => {
            const findCard = (cardsArray: BaseCardProps[], id: string): BaseCardProps | undefined => {
              for (const card of cardsArray) {
                if (card.id === id) {
                  return card;
                }
                if (card.childCards && card.childCards.length > 0) {
                  const found = findCard(card.childCards, id);
                  if (found) return found;
                }
              }
              return undefined;
            };

            const parentCard = findCard(cards, parentId);
            if (!parentCard || !parentCard.childCards) return false;

            for (const childCard of parentCard.childCards) {
              if (childCard.id === potentialChildId) {
                return true;
              }
              if (childCard.containerType === CardContainerType.COLLECTION) {
                if (isDescendant(childCard.id, potentialChildId)) {
                  return true;
                }
              }
            }

            return false;
          };

          return isDescendant(cardId, targetContainerId);
        };

        if (wouldCreateCycle(dragCardId, targetPid)) {
          console.error(`禁止将卡片拖入会形成循环引用的容器中: 卡片ID=${dragCardId}, 目标容器=${targetPid}`);
          return;
        }
      }

      // 判断操作类型：排序还是跨容器移动
      const isSameContainerMove = sourcePid === targetPid;

      if (isSameContainerMove) {
        // 同一容器内的排序操作
        handleSameContainerSort(sourcePid, dragIndex, hoverIndex);
      } else {
        // 跨容器拖拽操作
        handleCrossContainerMove(sourcePid, targetPid, dragIndex, hoverIndex);
      }
    },
    [cards, updateCards],
  );

  // 处理同一容器内的排序操作
  const handleSameContainerSort = useCallback(
    (containerId: string, dragIndex: number, hoverIndex: number) => {
      if (containerId === "root") {
        // 根级别卡片排序
        const newCards = [...cards];
        // 检查索引是否有效
        if (dragIndex < 0 || dragIndex >= newCards.length || hoverIndex < 0 || hoverIndex >= newCards.length) {
          console.error(
            `无效的索引: dragIndex=${dragIndex}, hoverIndex=${hoverIndex}, cards.length=${newCards.length}`,
          );
          return;
        }

        const dragCard = newCards[dragIndex];
        // 检查拖拽的卡片是否存在
        if (!dragCard) {
          console.error(`无法找到索引为 ${dragIndex} 的卡片`);
          return;
        }

        newCards.splice(dragIndex, 1);
        newCards.splice(hoverIndex, 0, dragCard);
        updateCards(newCards);
      } else {
        // 子容器内卡片排序
        const moveChildCard = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
          return cardsArray.map((card) => {
            if (card.id === containerId && card.childCards) {
              const newChildCards = [...card.childCards];

              // 检查索引是否有效
              if (
                dragIndex < 0 ||
                dragIndex >= newChildCards.length ||
                hoverIndex < 0 ||
                hoverIndex >= newChildCards.length
              ) {
                console.error(
                  `无效的子卡片索引: dragIndex=${dragIndex}, hoverIndex=${hoverIndex}, childCards.length=${newChildCards.length}`,
                );
                return card;
              }

              const dragCard = newChildCards[dragIndex];
              // 检查拖拽的卡片是否存在
              if (!dragCard) {
                console.error(`无法找到父卡片 ${containerId} 中索引为 ${dragIndex} 的子卡片`);
                return card;
              }

              // 执行排序
              newChildCards.splice(dragIndex, 1);
              newChildCards.splice(hoverIndex, 0, dragCard);
              return { ...card, childCards: newChildCards };
            }

            if (card.childCards && card.childCards.length > 0) {
              return {
                ...card,
                childCards: moveChildCard(card.childCards),
              };
            }

            return card;
          });
        };

        const newCards = moveChildCard(cards);
        updateCards(newCards);
      }
    },
    [cards, updateCards],
  );

  // 处理跨容器拖拽操作
  const handleCrossContainerMove = useCallback(
    (sourcePid: string, targetPid: string, dragIndex: number, hoverIndex: number) => {
      console.log(`执行跨容器拖拽: 从 ${sourcePid} 到 ${targetPid}, 索引 ${dragIndex}→${hoverIndex}`);

      // 1. 从源容器获取要移动的卡片
      let dragCard: BaseCardProps | undefined;

      // 从源容器中获取并移除卡片
      const removeCardFromSource = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
        if (sourcePid === "root") {
          // 从根级别获取卡片
          // 检查索引是否有效
          if (dragIndex < 0 || dragIndex >= cards.length) {
            console.error(`无效的源索引: dragIndex=${dragIndex}, cards.length=${cards.length}`);
            return cardsArray;
          }

          // 在移除前保存一份卡片的完整副本，包括所有子卡片
          dragCard = JSON.parse(JSON.stringify(cards[dragIndex]));

          // 检查拖拽的卡片是否存在
          if (!dragCard) {
            console.error(`无法找到索引为 ${dragIndex} 的卡片`);
            return cardsArray;
          }

          const newCards = [...cards];
          newCards.splice(dragIndex, 1);
          return newCards;
        }

        // 从子容器获取卡片
        return cardsArray.map((card) => {
          if (card.id === sourcePid && card.childCards) {
            // 检查索引是否有效
            if (dragIndex < 0 || dragIndex >= card.childCards.length) {
              console.error(`无效的子卡片源索引: dragIndex=${dragIndex}, childCards.length=${card.childCards.length}`);
              // 不要移除任何卡片，直接返回原始卡片
              return card;
            }

            // 在移除前保存一份卡片的完整副本，包括所有子卡片
            dragCard = JSON.parse(JSON.stringify(card.childCards[dragIndex]));

            // 确保集合类卡片有childCards属性
            if (dragCard && dragCard.containerType === CardContainerType.COLLECTION && !dragCard.childCards) {
              dragCard.childCards = [];
            }

            const newChildCards = [...card.childCards];
            newChildCards.splice(dragIndex, 1);
            return { ...card, childCards: newChildCards };
          }

          if (card.childCards && card.childCards.length > 0) {
            return {
              ...card,
              childCards: removeCardFromSource(card.childCards),
            };
          }

          return card;
        });
      };

      // 将卡片添加到目标容器
      const addCardToTarget = (cardsArray: BaseCardProps[], cardToAdd: BaseCardProps): BaseCardProps[] => {
        // 确保集合类卡片有childCards属性
        if (cardToAdd.containerType === CardContainerType.COLLECTION && !cardToAdd.childCards) {
          cardToAdd.childCards = [];
        }

        if (targetPid === "root") {
          // 添加到根级别
          const newCards = [...cardsArray];
          // 确保目标索引有效
          const safeHoverIndex = Math.min(Math.max(0, hoverIndex), newCards.length);
          newCards.splice(safeHoverIndex, 0, cardToAdd);
          return newCards;
        }

        // 添加到子容器
        return cardsArray.map((card) => {
          if (card.id === targetPid) {
            const newChildCards = [...(card.childCards || [])];
            // 确保目标索引有效
            const safeHoverIndex = Math.min(Math.max(0, hoverIndex), newChildCards.length);

            // 确保cardToAdd的父卡片ID正确设置
            const updatedCardToAdd = {
              ...cardToAdd,
              parent: targetPid, // 更新父卡片ID
            };

            newChildCards.splice(safeHoverIndex, 0, updatedCardToAdd);
            return { ...card, childCards: newChildCards };
          }

          if (card.childCards && card.childCards.length > 0) {
            return {
              ...card,
              childCards: addCardToTarget(card.childCards, cardToAdd),
            };
          }

          return card;
        });
      };

      // 执行跨容器拖拽
      let newCards = removeCardFromSource(cards);

      if (dragCard) {
        // 更新拖拽卡片的父容器ID
        const updatedDragCard = {
          ...dragCard,
          parent: targetPid === "root" ? undefined : targetPid,
        };

        newCards = addCardToTarget(newCards, updatedDragCard);
        updateCards(newCards);
        console.log(`跨容器拖拽成功完成: 卡片ID=${updatedDragCard.id}, 目标容器=${targetPid}`);
      } else {
        console.error("跨容器拖拽失败: 无法获取拖拽的卡片");
      }
    },
    [cards, updateCards],
  );

  // 渲染卡片
  const renderCard = (card: BaseCardProps, index: number, parentId?: string) => {
    // 如果卡片没有提供按钮配置，使用系统级别的配置
    const cardButtonsConfig = {
      showEditButton: card.showEditButton ?? buttonsConfig?.showEditButton ?? true,
      showAddButton: card.showAddButton ?? buttonsConfig?.showAddButton ?? true,
      showDeleteButton: card.showDeleteButton ?? buttonsConfig?.showDeleteButton ?? true,
      showRelateButton: card.showRelateButton ?? buttonsConfig?.showRelateButton ?? true,
      showLayoutStyleButton: card.showLayoutStyleButton ?? buttonsConfig?.showLayoutStyleButton ?? true,
      showVisibilityButton: card.showVisibilityButton ?? buttonsConfig?.showVisibilityButton ?? false,
    };

    // 获取父卡片的布局样式
    let parentLayoutStyle: string | undefined;
    if (parentId) {
      const findParentStyle = (cardsArray: BaseCardProps[]): string | undefined => {
        for (const c of cardsArray) {
          if (c.id === parentId) {
            return c.layoutStyle;
          }
          if (c.childCards && c.childCards.length > 0) {
            const style = findParentStyle(c.childCards);
            if (style) return style;
          }
        }
        return undefined;
      };
      parentLayoutStyle = findParentStyle(cards);
    }

    const cardContent = (
      <CardComponent
        key={card.id}
        card={card}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddCard={handleAddCard} // 使用统一的添加卡片函数
        onRelateCard={handleRelateCard}
        onUnrelateCard={handleUnrelateCard}
        onChangeLayoutStyle={handleChangeLayoutStyle}
        isMobile={isMobile}
        buttonsConfig={cardButtonsConfig}
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
        onOpenAddDialog={(parentId: string) => {
          setCurrentParentId(parentId);
          setIsAddDialogOpen(true);
        }}
        moveCard={handleMoveCard} // 传递moveCard函数
      />
    );

    // 使用DraggableCard包装
    return (
      <DraggableCard
        key={card.id}
        id={card.id}
        index={index}
        moveCard={handleMoveCard}
        parentId={parentId}
        layoutStyle={parentLayoutStyle || card.layoutStyle} // 优先使用父容器的布局样式，其次是卡片自身的布局样式
      >
        {cardContent}
      </DraggableCard>
    );
  };

  // 渲染子卡片
  const renderChildCards = (childCards: BaseCardProps[], parentId: string) => {
    return childCards.map((childCard, index) => renderCard(childCard, index, parentId));
  };

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { enableMouseEvents: true } : undefined}
    >
      <div className="space-y-4 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h3 className="text-lg font-medium">{title}</h3>
          <button
            type="button"
            onClick={() => {
              setCurrentParentId(null);
              setIsAddDialogOpen(true);
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, () => {
                setCurrentParentId(null);
                setIsAddDialogOpen(true);
              })
            }
            aria-label={`${addButtonText}`}
          >
            {/* 添加图标 */}
            <span>➕</span> {addButtonText}
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">暂无内容，点击"{addButtonText}"按钮创建</div>
        ) : (
          <div className="grid gap-4">
            {cards.map((card, index) => {
              if (!card) return null; // 添加空值检查
              return renderCard(card, index);
            })}
          </div>
        )}

        <AddCardDialog
          open={isAddDialogOpen}
          onClose={() => {
            setCurrentParentId(null);
            setIsAddDialogOpen(false);
          }}
          onAddEditorCard={(title?: string, hideTitle?: boolean, props?: CardProperty[]) => {
            handleAddCard(CardContainerType.EDITOR, {
              title: title || "",
              hideTitle: hideTitle || false,
              props: props || [],
              parentId: currentParentId,
            });
            setCurrentParentId(null);
            setIsAddDialogOpen(false);
          }}
          onAddCollectionCard={(title?: string, props: CardProperty[] = []) => {
            handleAddCard(CardContainerType.COLLECTION, {
              title: title || "",
              hideTitle: false,
              props: props,
              parentId: currentParentId,
            });
            setCurrentParentId(null);
            setIsAddDialogOpen(false);
          }}
          attributeOptions={attributeOptions}
        />
      </div>
    </DndProvider>
  );
}
