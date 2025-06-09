import { useDroppable } from "@dnd-kit/core";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { CardComponent } from "../card-component";
import type { BaseCardProps, CardButtonsConfig, CardProperty } from "../types";
import { CardContainerType, CollectionLayoutStyle } from "../types";
import { DraggableCard } from "./draggable-card"; // 更新导入
import { TitleBar } from "./title-bar"; // 导入TitleBar组件

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
  onNavigateToRelated?: (id?: string) => void; // 添加跳转到关联内容的回调
  onToggleCollapse?: () => void; // 添加折叠/展开回调
  onTitleEdit?: () => void; // 添加标题编辑回调
  onAddButtonClick?: () => void; // 添加按钮点击回调
  isEditingTitle?: boolean; // 是否正在编辑标题
  onTitleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // 标题输入变更回调
  onTitleInputSave?: () => void; // 标题保存回调
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
  onNavigateToRelated, // 添加解构
  onToggleCollapse,
  onTitleEdit,
  onAddButtonClick,
  isEditingTitle,
  onTitleInputChange,
  onTitleInputSave,
}: ContainerProps) {
  // 编辑器类型卡片的内容编辑
  const [isEditingContent, setIsEditingContent] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false); // 添加悬浮状态
  const [showTitleBar, setShowTitleBar] = useState(false); // 添加是否显示标题栏的状态

  // 只有集合类型卡片才可以接收拖拽
  const isCollection = containerType === CardContainerType.COLLECTION;

  // 是否为无头卡片
  const isHeadless = card.hideTitle === true;

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

  // 处理切换标题栏显示/隐藏
  const handleToggleTitleBar = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setShowTitleBar(!showTitleBar);
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

  // 根据是否为无头卡片设置容器样式
  const containerBorderStyle = isHeadless
    ? {
        border: isOver ? "2px dashed #4a90e2" : "1px solid rgba(204, 204, 204, 0.8)",
        borderRadius: "6px",
        transition: "all 0.3s ease", // 添加过渡效果
      }
    : {
        borderTop: "none",
        borderRight: "1px solid rgba(204, 204, 204, 0.5)",
        borderBottom: "1px solid rgba(204, 204, 204, 0.5)",
        borderLeft: "1px solid rgba(204, 204, 204, 0.5)",
        borderRadius: "0 0 4px 4px",
        transition: "all 0.3s ease", // 添加过渡效果
      };

  // 无头卡片的悬浮标题栏样式
  const floatingTitleBarStyle = {
    position: "absolute" as const,
    top: "0",
    left: "0",
    right: "0",
    zIndex: showTitleBar ? 10 : -1, // 当隐藏时，将z-index设置为-1，使其位于容器底部
    opacity: showTitleBar ? 1 : 0, // 根据showTitleBar状态决定是否显示
    transition: "opacity 0.2s ease",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottom: "1px solid #ccc",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    borderRadius: "6px 6px 0 0",
    pointerEvents: showTitleBar ? "auto" : ("none" as React.CSSProperties["pointerEvents"]), // 当隐藏时，禁用鼠标事件
  };

  // 标题栏切换按钮样式
  const titleBarToggleButtonStyle = {
    position: "absolute" as const,
    top: "8px",
    right: "8px",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: showTitleBar ? "#4a90e2" : "rgba(255, 255, 255, 0.8)",
    color: showTitleBar ? "white" : "#666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: `1px solid ${showTitleBar ? "#4a90e2" : "#ccc"}`,
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    zIndex: 20, // 增加z-index，确保按钮在最上层
    transition: "all 0.2s ease",
    opacity: isHovered || showTitleBar ? 1 : 0,
    fontSize: "12px",
    fontWeight: "bold",
  };

  // 标题栏切换按钮图标
  const titleBarToggleIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <title>{showTitleBar ? "隐藏标题栏" : "显示标题栏"}</title>
      {showTitleBar ? (
        <>
          <path d="M4 6h16M4 12h16M4 18h10" />
          <path d="M16 16l4 4m0 0l4-4m-4 4V4" />
        </>
      ) : (
        <>
          <path d="M4 6h16M4 12h16M4 18h10" />
          <path d="M16 8l4-4m0 0l4 4m-4-4v16" />
        </>
      )}
    </svg>
  );

  // 编辑器类型卡片的渲染
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div
        className="editor-container"
        style={{
          ...containerBorderStyle,
          width: "100%",
          padding: "16px",
          boxSizing: "border-box",
          backgroundColor: "rgba(250, 250, 250, 0.3)",
          transition: "all 0.2s ease",
          position: "relative", // 添加相对定位
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 标题栏切换按钮 */}
        {isHeadless && (
          <button
            type="button"
            onClick={handleToggleTitleBar}
            style={{
              ...titleBarToggleButtonStyle,
              // 当标题栏显示时，按钮显示在标题栏上方
              // 当标题栏隐藏时，按钮显示在内容区域上方
              top: showTitleBar ? "8px" : "8px",
              right: "8px",
            }}
            aria-label={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
            title={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
          >
            {titleBarToggleIcon()}
          </button>
        )}

        {/* 无头卡片的悬浮标题栏 */}
        {isHeadless && onToggleCollapse && onTitleEdit && onAddButtonClick && (
          <div style={floatingTitleBarStyle}>
            <TitleBar
              card={card}
              buttonsConfig={buttonsConfig}
              isEditorCard={true}
              isCollectionCard={false}
              onToggleCollapse={onToggleCollapse}
              onTitleEdit={onTitleEdit}
              onAddButtonClick={onAddButtonClick}
              onDeleteCard={onDeleteCard}
              onRelateItem={onRelateCard || (() => {})}
              onUnrelateItem={onUnrelateCard || (() => {})}
              onLayoutStyleChange={undefined}
              onNavigateToRelated={onNavigateToRelated}
              isEditingTitle={isEditingTitle}
              onTitleInputChange={onTitleInputChange}
              onTitleInputSave={onTitleInputSave}
              hasToggleButton={isHeadless}
            />
          </div>
        )}

        {card.relatedItem && (
          <div style={{ marginBottom: "12px", fontSize: "14px", color: "#6B7280" }}>
            关联到:{" "}
            <a
              href={`#${card.relatedItem.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRelated?.(card.relatedItem?.id);
              }}
              style={{ color: "#3b82f6", textDecoration: "underline", cursor: "pointer" }}
              title={card.relatedItem.title}
            >
              {card.relatedItem.title}
            </a>
          </div>
        )}

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
              color: card.content ? "#333" : "#6B7280",
            }}
          >
            {card.content || "点击添加内容..."}
          </button>
        )}
      </div>
    );
  }

  // 集合类型卡片的渲染 - 需要设置为可放置区域
  // 根据布局样式设置容器样式
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: layoutStyle === CollectionLayoutStyle.HORIZONTAL ? "row" : "column",
    flexWrap: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "wrap" : "nowrap",
    gap: "16px",
    overflowY: "auto",
    maxHeight: isHeadless ? "none" : "500px", // 无头卡片不限制高度
  };

  // 根据布局样式设置子卡片样式
  const childCardStyle = {
    flex: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "1 1 200px" : "0 0 auto",
    minWidth: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "200px" : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      className={`collection-container ${isOver ? "drop-active" : ""} ${isHeadless ? "headless-container" : ""}`}
      style={{
        ...containerBorderStyle,
        width: "100%",
        padding: "16px",
        boxSizing: "border-box",
        backgroundColor: isOver ? "rgba(74, 144, 226, 0.05)" : "rgba(250, 250, 250, 0.3)",
        outline: isOver ? "2px dashed #4a90e2" : "none",
        minHeight: "80px",
        position: "relative",
        transition: "all 0.2s ease",
        boxShadow: isOver ? "0 2px 8px rgba(0, 0, 0, 0.05)" : "none",
      }}
      data-container-id={card.id}
      data-accepts-cards={isCollection ? "true" : "false"}
      data-headless={isHeadless ? "true" : "false"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题栏切换按钮 */}
      {isHeadless && (
        <button
          type="button"
          onClick={handleToggleTitleBar}
          style={{
            ...titleBarToggleButtonStyle,
            // 当标题栏显示时，按钮显示在标题栏上方
            // 当标题栏隐藏时，按钮显示在内容区域上方
            top: showTitleBar ? "8px" : "8px",
            right: "8px",
          }}
          aria-label={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
          title={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
        >
          {titleBarToggleIcon()}
        </button>
      )}

      {/* 无头卡片的悬浮标题栏 */}
      {isHeadless && onToggleCollapse && onTitleEdit && onAddButtonClick && (
        <div style={floatingTitleBarStyle}>
          <TitleBar
            card={card}
            buttonsConfig={buttonsConfig}
            isEditorCard={false}
            isCollectionCard={true}
            onToggleCollapse={onToggleCollapse}
            onTitleEdit={onTitleEdit}
            onAddButtonClick={onAddButtonClick}
            onDeleteCard={onDeleteCard}
            onRelateItem={onRelateCard || (() => {})}
            onUnrelateItem={onUnrelateCard || (() => {})}
            onLayoutStyleChange={onChangeLayoutStyle ? () => onChangeLayoutStyle(card.id, layoutStyle) : undefined}
            onNavigateToRelated={onNavigateToRelated}
            isEditingTitle={isEditingTitle}
            onTitleInputChange={onTitleInputChange}
            onTitleInputSave={onTitleInputSave}
            hasToggleButton={isHeadless}
          />
        </div>
      )}

      <div style={containerStyle} className="collection-content">
        {card.childCards?.map((childCard, index) => (
          <div key={childCard.id} style={childCardStyle}>
            <DraggableCard
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
                onNavigateToRelated={onNavigateToRelated}
              />
            </DraggableCard>
          </div>
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
              <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                {isHeadless ? "这是一个无头卡片容器，" : ""}点击"+"按钮添加卡片或拖拽卡片到此处
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
