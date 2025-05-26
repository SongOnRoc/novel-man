import { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { CardComponent } from "./card-component";
import { AddCardDialog } from "./dialogs";
import { DraggableCard } from "./draggable-card";
import { type BaseCardProps, type CardButtonsConfig, CardContainerType, type CollectionLayoutStyle } from "./types";

interface CardSystemProps {
  cards: BaseCardProps[];
  title: string;
  onAddCard: (containerType: CardContainerType, title?: string, hideTitle?: boolean) => void;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean, parentCardCount?: number) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  moveCard?: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  isMobile?: boolean;
  buttonsConfig?: CardButtonsConfig;
  addButtonText?: string;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  defaultCollapsed?: boolean;
}

// 卡片系统组件
export function CardSystem({
  cards,
  title,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddChildCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  moveCard,
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // 增强版的移动卡片处理函数，支持跨容器拖拽
  const handleMoveCard = (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
    // 确保 dragParentId 和 hoverParentId 有值
    const sourcePid = dragParentId || "root";
    const targetPid = hoverParentId || "root";

    console.log(`CardSystem handleMoveCard: 从 ${sourcePid}[${dragIndex}] 到 ${targetPid}[${hoverIndex}]`);

    if (moveCard) {
      moveCard(dragIndex, hoverIndex, sourcePid, targetPid);
    } else {
      console.warn("CardSystem: moveCard函数未提供");
    }
  };

  // 处理布局样式变更
  const handleChangeLayoutStyle = (id: string, style: CollectionLayoutStyle) => {
    if (onChangeLayoutStyle) {
      onChangeLayoutStyle(id, style);
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
    };

    const cardContent = (
      <CardComponent
        key={card.id}
        card={card}
        onUpdateCard={onUpdateCard}
        onDeleteCard={onDeleteCard}
        onAddChildCard={onAddChildCard}
        onRelateCard={onRelateCard}
        onUnrelateCard={onUnrelateCard}
        onChangeLayoutStyle={handleChangeLayoutStyle}
        isMobile={isMobile}
        buttonsConfig={cardButtonsConfig}
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
        onOpenAddDialog={(parentId) => {
          setCurrentParentId(parentId);
          setIsAddDialogOpen(true);
        }}
      />
    );

    // 如果提供了moveCard函数，则使用DraggableCard包装
    if (moveCard) {
      return (
        <DraggableCard key={card.id} id={card.id} index={index} moveCard={handleMoveCard} parentId={parentId}>
          {cardContent}
        </DraggableCard>
      );
    }

    return cardContent;
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
            onKeyDown={(e) => handleKeyDown(e, () => {
              setCurrentParentId(null);
              setIsAddDialogOpen(true);
            })}
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
          onAddEditorCard={(title, hideTitle) => {
            console.log("Add Editor Card clicked", { currentParentId, title, hideTitle });
            if (currentParentId && onAddChildCard) {
              console.log("Calling onAddChildCard");
              // 获取父容器中的子卡片数量
              const parentCard = cards.find(c => c.id === currentParentId);
              const childCount = parentCard?.childCards?.length || 0;
              onAddChildCard(currentParentId, CardContainerType.EDITOR, title, hideTitle, childCount);
            } else {
              console.log("Calling onAddCard");
              onAddCard(CardContainerType.EDITOR, title, hideTitle);
            }
            setCurrentParentId(null);
            setIsAddDialogOpen(false);
          }}
          onAddCollectionCard={(title) => {
            if (currentParentId && onAddChildCard) {
              // 获取父容器中的子卡片数量
              const parentCard = cards.find(c => c.id === currentParentId);
              const childCount = parentCard?.childCards?.length || 0;
              onAddChildCard(currentParentId, CardContainerType.COLLECTION, title, false, childCount);
            } else {
              onAddCard(CardContainerType.COLLECTION, title);
            }
            setCurrentParentId(null);
            setIsAddDialogOpen(false);
          }}
          attributeOptions={attributeOptions}
        />
      </div>
    </DndProvider>
  );
}
