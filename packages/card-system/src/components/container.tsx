import { useDroppable } from "@dnd-kit/core";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { CardComponent } from "../card-component";
import type { BaseCardProps, CardButtonsConfig, CardProperty } from "../types";
import { CardContainerType, CollectionLayoutStyle } from "../types";
import { DraggableCard } from "./draggable-card"; // 更新导入

interface ContainerProps {
  // 重命名接口以匹配文件名
  card: BaseCardProps;
  containerType: CardContainerType;
  layoutStyle?: CollectionLayoutStyle;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddCard?: (
    containerType: CardContainerType,
    options?: {
      title?: string;
      hideTitle?: boolean;
      props?: CardProperty[];
      parentId?: string | null;
    },
  ) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  buttonsConfig?: CardButtonsConfig;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  moveCard?: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  useDndKit?: boolean; // 此属性将不再需要，但暂时保留以避免破坏性更改，后续移除
}

/**
 * 卡片容器组件 - dnd-kit版本
 * 根据卡片类型渲染不同的内容区域
 * 对于集合类型的卡片，容器内部是可放置区域
 */
export function Container({
  // 重命名组件以匹配文件名
  card,
  containerType,
  layoutStyle = CollectionLayoutStyle.VERTICAL,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  buttonsConfig,
  attributeOptions,
  availableRelateItems,
  moveCard,
  useDndKit, // 此属性将不再需要
}: ContainerProps) {
  // 编辑器类型卡片的内容编辑
  const [isEditingContent, setIsEditingContent] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isOver, setIsOver] = useState(false);

  // 只有集合类型卡片才可以接收拖拽
  const isCollection = containerType === CardContainerType.COLLECTION;

  // 使用dnd-kit的useDroppable hook设置可放置区域
  const { setNodeRef, isOver: isDndOver } = useDroppable({
    id: `container-${card.id}`,
    data: {
      type: "container",
      acceptCards: isCollection,
      containerId: card.id,
    },
    disabled: !isCollection,
  });

  // 监听拖拽状态变化
  useEffect(() => {
    setIsOver(isDndOver);
  }, [isDndOver]);

  // 处理卡片内容的变更
  const handleContentChange = (value: string) => {
    onUpdateCard(card.id, { content: value });
  };

  // 对于编辑器类型的卡片，支持点击内容区域直接进入编辑状态
  const handleContentClick = () => {
    if (containerType === CardContainerType.EDITOR && !isEditingContent) {
      setIsEditingContent(true);
    }
  };

  // 处理键盘事件，支持键盘访问
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (containerType === CardContainerType.EDITOR && !isEditingContent) {
        setIsEditingContent(true);
      }
    }
  };

  // 内容编辑器获得焦点时，自动聚焦到末尾
  useEffect(() => {
    if (isEditingContent && contentRef.current) {
      const textarea = contentRef.current;
      textarea.focus();
      textarea.selectionStart = textarea.value.length;
      textarea.selectionEnd = textarea.value.length;
    }
  }, [isEditingContent]);

  // 编辑器类型卡片的渲染
  if (containerType === CardContainerType.EDITOR) {
    let content = card.content || "";

    // 如果有关联的项目，显示关联信息
    if (card.relatedItem) {
      content = `关联到: ${card.relatedItem.title} (${card.relatedItem.type})\n\n${content}`;
    }

    return (
      <div
        className="editor-container"
        style={{
          borderTop: "none",
          borderRight: "1px solid rgba(204, 204, 204, 0.5)",
          borderBottom: "1px solid rgba(204, 204, 204, 0.5)",
          borderLeft: "1px solid rgba(204, 204, 204, 0.5)",
          width: "100%",
          padding: "16px",
          boxSizing: "border-box",
          backgroundColor: "rgba(250, 250, 250, 0.3)",
          borderRadius: "0 0 4px 4px",
          transition: "all 0.2s ease",
        }}
      >
        {isEditingContent ? (
          <textarea
            ref={contentRef}
            value={card.content || ""}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={() => setIsEditingContent(false)}
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              border: "1px solid rgba(209, 213, 219, 0.5)",
              borderRadius: "4px",
              resize: "vertical",
              fontFamily: "inherit",
              fontSize: "inherit",
              boxSizing: "border-box",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05) inset",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={handleContentClick}
            onKeyDown={handleKeyDown}
            aria-label="点击编辑内容"
            style={{
              width: "100%",
              minHeight: "24px",
              whiteSpace: "pre-wrap",
              cursor: "text",
              textAlign: "left",
              background: "none",
              border: "none",
              padding: "8px",
              fontFamily: "inherit",
              fontSize: "inherit",
              color: content ? "#333" : "#6B7280",
            }}
          >
            {content || "点击添加内容..."}
          </button>
        )}
      </div>
    );
  }

  // 集合类型卡片的渲染 - 需要设置为可放置区域
  return (
    <div
      ref={setNodeRef}
      className={`collection-container ${isOver ? "drop-active" : ""}`}
      style={{
        borderTop: "none",
        borderRight: "1px solid rgba(204, 204, 204, 0.5)",
        borderBottom: "1px solid rgba(204, 204, 204, 0.5)",
        borderLeft: "1px solid rgba(204, 204, 204, 0.5)",
        width: "100%",
        padding: "16px",
        boxSizing: "border-box",
        backgroundColor: isOver ? "rgba(74, 144, 226, 0.05)" : "rgba(250, 250, 250, 0.3)",
        outline: isOver ? "2px dashed #4a90e2" : "none",
        minHeight: "80px",
        position: "relative",
        transition: "all 0.2s ease",
        borderRadius: "0 0 4px 4px",
        boxShadow: isOver ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
      }}
      data-container-id={card.id}
      data-accepts-cards={isCollection ? "true" : "false"}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
          maxHeight: "500px",
        }}
        className="collection-content"
      >
        {card.childCards?.map((childCard, index) => (
          <DraggableCard
            key={childCard.id}
            id={childCard.id}
            index={index}
            moveCard={moveCard || (() => {})}
            parentId={card.id}
            layoutStyle={layoutStyle}
          >
            <CardComponent
              card={childCard}
              onUpdateCard={onUpdateCard}
              onDeleteCard={onDeleteCard}
              onAddCard={onAddCard}
              onRelateCard={onRelateCard}
              onUnrelateCard={onUnrelateCard}
              onChangeLayoutStyle={onChangeLayoutStyle}
              buttonsConfig={buttonsConfig}
              attributeOptions={attributeOptions}
              availableRelateItems={availableRelateItems}
              moveCard={moveCard}
              layoutStyle={layoutStyle}
              useDndKit={useDndKit}
            />
          </DraggableCard>
        ))}

        {/* 空容器提示 */}
        {(!card.childCards || card.childCards.length === 0) && (
          <div
            className="empty-container"
            style={{
              padding: "24px",
              textAlign: "center",
              color: "#6B7280",
              border: "1px dashed #D1D5DB",
              borderRadius: "6px",
              backgroundColor: "rgba(249, 250, 251, 0.8)",
              minHeight: "100px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            <div className="flex flex-col items-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-3 text-gray-400"
                style={{ opacity: 0.7 }}
              >
                <title>拖拽提示图标</title>
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
              </svg>
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>点击"+"按钮添加卡片或拖拽卡片到此处</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
