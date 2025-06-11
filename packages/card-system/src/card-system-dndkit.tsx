// CardSystemDndKit

import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useCallback, useState } from "react";
import { CardComponent } from "./card-component";
import { DefaultCardFactory } from "./card-factory";
import { AddCardDialog } from "./components/dialogs";
import { DndAdapter } from "./components/dnd-adapter";
import { DraggableCard } from "./components/draggable-card";
import {
  type BaseCardProps,
  type CardButtonsConfig,
  CardContainerType,
  type CardProperty,
  type CollectionLayoutStyle,
} from "./types";

interface CardSystemDndKitProps {
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

// dnd-kit版本的卡片系统组件
export function CardSystemDndKit({
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
}: CardSystemDndKitProps) {
  // 内部状态管理
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [_activeId, setActiveId] = useState<string | number | null>(null);
  const [overContainerId, setOverContainerId] = useState<string | null>(null);

  // 创建卡片工厂实例
  const cardFactory = new DefaultCardFactory();

  // 配置传感器
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px的移动距离就激活拖拽
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 短暂延迟以区分点击和拖拽
        tolerance: 5, // 触摸移动容差
      },
    }),
  );

  // 获取所有卡片ID
  const getAllCardIds = useCallback(() => {
    const ids: string[] = [];

    const collectIds = (cardsArray: BaseCardProps[]) => {
      cardsArray.forEach((card) => {
        ids.push(card.id);
        if (card.childCards && card.childCards.length > 0) {
          collectIds(card.childCards);
        }
      });
    };

    collectIds(cards);
    return ids;
  }, [cards]);

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
              const _childCount = card.childCards?.length || 0;

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
    (idToDelete: string) => {
      const removeCardRecursive = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
        return cardsArray
          .map((card) => {
            if (card.id === idToDelete) {
              return null; // Mark for removal
            }

            if (card.childCards && card.childCards.length > 0) {
              const newChildCards = removeCardRecursive(card.childCards);
              // If the children array instance has changed, or length changed,
              // it means a deletion (or modification) happened deeper.
              // Thus, we must return a new card object for the current 'card'
              // to ensure immutability up the chain.
              if (newChildCards.length !== card.childCards.length || newChildCards !== card.childCards) {
                return { ...card, childCards: newChildCards.filter((c) => c !== null) as BaseCardProps[] };
              }
            }
            // If no changes to this card or its children (relevant to deletion), return original.
            return card;
          })
          .filter((card) => card !== null) as BaseCardProps[]; // Filter out cards marked for removal (nulls)
      };

      const newCards = removeCardRecursive(cards);
      updateCards(newCards);
    },
    [cards, updateCards],
  );

  // 关联卡片
  const handleRelateCard = useCallback((_id: string) => {
    // 关联操作已在 CardComponent 中处理
  }, []);

  // 取消关联卡片
  const handleUnrelateCard = useCallback(
    (id: string) => {
      // 更新卡片，清除关联信息
      handleUpdateCard(id, { relatedItem: undefined });
    },
    [handleUpdateCard],
  );

  // 更改布局样式
  const handleChangeLayoutStyle = useCallback(
    (id: string, layoutStyle: CollectionLayoutStyle) => {
      handleUpdateCard(id, { layoutStyle });
    },
    [handleUpdateCard],
  );

  // 移动卡片 - 处理拖拽排序
  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
      // 如果是同一个容器内的排序
      if (dragParentId === hoverParentId) {
        // 处理同一容器内的排序
        if (dragParentId === undefined) {
          // 顶级卡片的排序
          const dragCard = cards[dragIndex];
          const newCards = [...cards];
          newCards.splice(dragIndex, 1);
          newCards.splice(hoverIndex, 0, dragCard);
          updateCards(newCards);
        } else {
          // 子卡片的排序
          const moveChildCard = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
            return cardsArray.map((card) => {
              if (card.id === dragParentId) {
                const newChildCards = [...(card.childCards || [])];
                const dragCard = newChildCards[dragIndex];
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
        return;
      }

      // 处理跨容器拖拽
      console.log(`跨容器拖拽: 从${dragParentId || "root"}到${hoverParentId || "root"}`);

      // 查找被拖拽的卡片
      let dragCard: BaseCardProps | undefined;

      // 从源容器中移除卡片
      const removeCardFromSource = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
        if (dragParentId === undefined) {
          // 从顶级移除
          dragCard = cards[dragIndex];
          return cardsArray.filter((_, i) => i !== dragIndex);
        }

        // 从子容器移除
        return cardsArray.map((card) => {
          if (card.id === dragParentId) {
            const childCards = [...(card.childCards || [])];
            dragCard = childCards[dragIndex];
            childCards.splice(dragIndex, 1);
            return { ...card, childCards };
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
        if (hoverParentId === undefined || hoverParentId === "root") {
          // 添加到根级别
          const newCards = [...cardsArray];
          // 确保目标索引有效
          const safeHoverIndex = Math.min(Math.max(0, hoverIndex), newCards.length);
          newCards.splice(safeHoverIndex, 0, cardToAdd);
          return newCards;
        }

        // 添加到子容器
        return cardsArray.map((card) => {
          if (card.id === hoverParentId) {
            const newChildCards = [...(card.childCards || [])];
            // 确保目标索引有效
            const safeHoverIndex = Math.min(Math.max(0, hoverIndex), newChildCards.length);

            // 确保cardToAdd的父卡片ID正确设置
            const updatedCardToAdd = {
              ...cardToAdd,
              parent: hoverParentId, // 更新父卡片ID
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
          parent: hoverParentId === "root" ? undefined : hoverParentId,
        };

        newCards = addCardToTarget(newCards, updatedDragCard);
        updateCards(newCards);
        console.log(`跨容器拖拽成功完成: 卡片ID=${updatedDragCard.id}, 目标容器=${hoverParentId}`);
      } else {
        console.error("跨容器拖拽失败: 无法获取拖拽的卡片");
      }
    },
    [cards, updateCards],
  );

  // 处理拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  };

  // 处理拖拽悬停
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    // 检查是否悬停在容器上
    const isOverContainer = over.data.current?.type === "container";

    // 防止拖到自己或者自己的容器上
    const isOverSelf = over.id === active.id;
    const isOverOwnContainer = over.id === `container-${active.id}`;

    // 如果悬停在容器上，且不是自己的容器
    if (isOverContainer && !isOverSelf && !isOverOwnContainer) {
      // 提取容器ID
      const containerId = over.data.current?.containerId as string;

      // 确认容器存在且接受卡片
      if (containerId && over.data.current?.acceptCards) {
        setOverContainerId(containerId);
      } else {
        setOverContainerId(null);
      }
    } else {
      setOverContainerId(null);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over) {
      setOverContainerId(null);
      return;
    }

    // 从事件数据中提取拖拽信息
    const activeData = active.data.current;
    if (!activeData) return;

    const { index: dragIndex, parentId: dragParentId } = activeData;

    // 如果拖拽到了容器上
    if (overContainerId) {
      // 确保不是拖到自己的父容器
      if (dragParentId !== overContainerId) {
        // 将卡片移动到目标容器的第一个位置
        handleMoveCard(dragIndex, 0, dragParentId, overContainerId);
      }
      setOverContainerId(null);
      return;
    }

    // 如果over对象是另一个卡片
    if (active.id !== over.id) {
      const overData = over.data.current;
      if (!overData) return;

      const { index: hoverIndex, parentId: hoverParentId } = overData;

      // 处理所有拖拽情况
      handleMoveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);
    }
  };

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

    // 每个卡片都包含在一个可拖拽的容器中
    return (
      <DraggableCard // Ensured JSX tag is DraggableCard
        key={card.id}
        id={card.id}
        index={index}
        moveCard={handleMoveCard}
        parentId={parentId}
        layoutStyle={parentLayoutStyle || card.layoutStyle}
      >
        <CardComponent
          key={card.id}
          card={card}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onAddCard={handleAddCard}
          onRelateCard={handleRelateCard}
          onUnrelateCard={handleUnrelateCard}
          onChangeLayoutStyle={handleChangeLayoutStyle}
          isMobile={isMobile}
          buttonsConfig={cardButtonsConfig}
          attributeOptions={attributeOptions}
          availableRelateItems={availableRelateItems}
          onOpenAddDialog={(parentId: string) => {
            // 打开添加对话框，设置父卡片ID
            setCurrentParentId(parentId);
            setIsAddDialogOpen(true);
          }}
          moveCard={handleMoveCard}
          useDndKit={true} // This prop is no longer strictly necessary in CardComponent but kept for now
          onBatchUpdateCards={handleBatchUpdateCards} // 传递批量更新函数
        />
      </DraggableCard> // Ensured JSX closing tag is DraggableCard
    );
  };

  // 渲染子卡片
  const _renderChildCards = (childCards: BaseCardProps[], parentId: string) => {
    // 直接返回子卡片的映射结果
    return childCards.map((childCard, index) => renderCard(childCard, index, parentId));
  };

  // 批量更新多张卡片
  const handleBatchUpdateCards = useCallback(
    (updates: Array<{ id: string; updates: Partial<BaseCardProps> }>) => {
      // 创建一个新的卡片数组副本
      let newCards = [...cards];

      // 定义递归函数来更新卡片数组中的特定卡片
      const updateCardInArray = (
        cardsArray: BaseCardProps[],
        cardId: string,
        cardUpdates: Partial<BaseCardProps>,
      ): BaseCardProps[] => {
        return cardsArray.map((card) => {
          if (card.id === cardId) {
            return { ...card, ...cardUpdates };
          }

          if (card.childCards && card.childCards.length > 0) {
            return {
              ...card,
              childCards: updateCardInArray(card.childCards, cardId, cardUpdates),
            };
          }

          return card;
        });
      };

      // 应用所有更新
      updates.forEach(({ id, updates: cardUpdates }) => {
        newCards = updateCardInArray(newCards, id, cardUpdates);
      });

      // 一次性更新状态
      updateCards(newCards);
    },
    [cards, updateCards],
  );

  // 返回整个卡片系统
  return (
    <DndAdapter isMobile={isMobile}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={true}
      >
        <SortableContext items={getAllCardIds()} strategy={rectSortingStrategy}>
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

            <div
              style={{
                border: "1px dashed #ccc",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "rgba(249, 250, 251, 0.8)",
                minHeight: "200px",
              }}
            >
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
            </div>

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
              onAddCollectionCard={(title?: string, props: CardProperty[] = [], hideTitle?: boolean) => {
                handleAddCard(CardContainerType.COLLECTION, {
                  title: title || "",
                  hideTitle: hideTitle || false,
                  props: props,
                  parentId: currentParentId,
                });
                setCurrentParentId(null);
                setIsAddDialogOpen(false);
              }}
              attributeOptions={attributeOptions}
            />
          </div>
        </SortableContext>
      </DndContext>
    </DndAdapter>
  );
}
