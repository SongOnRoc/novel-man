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
  onBatchUpdateCards?: (updates: Array<{ id: string; updates: Partial<BaseCardProps> }>) => void; // 批量更新卡片
  isMobile?: boolean; // 添加移动端标志
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
  onBatchUpdateCards,
  isMobile = false, // 添加移动端标志，默认为false
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

  // 处理键盘事件，用于标题栏切换按钮的键盘访问
  const handleToggleTitleBarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowTitleBar(!showTitleBar);
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

  // 根据是否为无头卡片设置容器样式
  const containerBorderStyle = isHeadless
    ? {
        border: isOver ? "2px dashed #4a90e2" : "1px solid rgba(226, 232, 240, 0.8)",
        borderRadius: isMobile ? "10px" : "12px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isOver ? "0 0 0 2px rgba(74, 144, 226, 0.2)" : "none",
      }
    : {
        borderTop: "none",
        borderRight: "1px solid rgba(226, 232, 240, 0.8)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
        borderLeft: "1px solid rgba(226, 232, 240, 0.8)",
        borderRadius: isMobile ? "0 0 10px 10px" : "0 0 16px 16px",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      };

  // 无头卡片的悬浮标题栏样式
  const floatingTitleBarStyle = {
    position: "absolute" as const,
    top: "0",
    left: "0",
    right: "0",
    zIndex: showTitleBar ? 10 : -1, // 当隐藏时，将z-index设置为-1，使其位于容器底部
    opacity: showTitleBar ? 1 : 0, // 根据showTitleBar状态决定是否显示
    transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    borderRadius: isMobile ? "10px 10px 0 0" : "12px 12px 0 0",
    pointerEvents: showTitleBar ? "auto" : ("none" as React.CSSProperties["pointerEvents"]), // 当隐藏时，禁用鼠标事件
  };

  // 获取卡片类型对应的主题颜色
  const getCardThemeColor = () => {
    if (card.themeColor) return card.themeColor;
    return containerType === CardContainerType.EDITOR ? "#3b82f6" : "#6366f1";
  };

  // 标题栏切换按钮样式
  const titleBarToggleButtonStyle = {
    position: "absolute" as const,
    top: isMobile ? "6px" : "8px",
    right: isMobile ? "6px" : "8px",
    width: isMobile ? "32px" : "28px",
    height: isMobile ? "32px" : "28px",
    borderRadius: "50%",
    backgroundColor: showTitleBar ? getCardThemeColor() : "rgba(255, 255, 255, 0.9)",
    color: showTitleBar ? "white" : "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    zIndex: 15, // 确保按钮始终位于最上层
    transition: "background-color 0.3s ease, transform 0.3s ease",
    transform: showTitleBar ? "rotate(180deg)" : "rotate(0deg)",
    padding: "0",
    outline: "none",
    touchAction: "manipulation", // 优化移动端触摸体验
  };

  // 标题栏切换按钮图标
  const titleBarToggleIcon = () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>{showTitleBar ? "隐藏标题栏" : "显示标题栏"}</title>
      {showTitleBar ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
    </svg>
  );

  // 编辑器容器样式
  const editorContainerStyle = {
    padding: isMobile ? "12px" : "16px",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: isHeadless ? (isMobile ? "10px" : "12px") : isMobile ? "0 0 10px 10px" : "0 0 16px 16px",
    minHeight: "120px",
    width: "100%",
    boxSizing: "border-box" as const,
    position: "relative" as const,
    backdropFilter: "blur(8px)",
    cursor: containerType === CardContainerType.EDITOR && !isEditingContent ? "pointer" : "default",
    transition: "background-color 0.2s ease",
  };

  // 编辑器文本区域样式
  const textareaStyle = {
    width: "100%",
    minHeight: "100px",
    padding: isMobile ? "12px" : "16px",
    border: "1px solid #e2e8f0",
    borderRadius: isMobile ? "8px" : "10px",
    resize: "vertical" as const,
    outline: "none",
    fontSize: isMobile ? "16px" : "15px", // 移动端使用16px避免iOS缩放
    lineHeight: "1.5",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.04)",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    fontFamily: "inherit",
  };

  // 获取布局的Flex方向
  const getFlexDirection = (): React.CSSProperties["flexDirection"] => {
    switch (layoutStyle) {
      case CollectionLayoutStyle.HORIZONTAL:
        return "row";
      case CollectionLayoutStyle.GRID:
        return "row";
      case CollectionLayoutStyle.ADAPTIVE:
        return isMobile ? "column" : "row";
      default:
        return "column";
    }
  };

  // 集合容器样式
  const collectionContainerStyle: React.CSSProperties = {
    padding: isMobile ? "12px" : "16px",
    display: "flex",
    flexDirection: getFlexDirection(),
    gap: isMobile ? "12px" : "16px",
    minHeight: "50px",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: isHeadless ? (isMobile ? "10px" : "12px") : isMobile ? "0 0 10px 10px" : "0 0 16px 16px",
    position: "relative",
    backdropFilter: "blur(4px)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    flexWrap:
      layoutStyle === CollectionLayoutStyle.ADAPTIVE || layoutStyle === CollectionLayoutStyle.GRID
        ? ("wrap" as const)
        : ("nowrap" as const),
    overflow: layoutStyle === CollectionLayoutStyle.HORIZONTAL ? "auto hidden" : "visible",
    alignItems: "flex-start",
  };

  // 编辑器类型卡片的渲染
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div
        className={`editor-container ${isMobile ? "mobile-editor-container" : ""}`}
        style={editorContainerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 标题栏切换按钮 */}
        {isHeadless && (
          <button
            type="button"
            onClick={handleToggleTitleBar}
            onKeyDown={handleToggleTitleBarKeyDown}
            style={titleBarToggleButtonStyle}
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
              onUpdateCard={onUpdateCard}
              isMobile={isMobile}
            />
          </div>
        )}

        {card.relatedItem && (
          <div
            style={{
              marginBottom: "12px",
              fontSize: "14px",
              color: "#64748b",
              padding: "12px 16px 0 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(243, 244, 246, 0.5)",
              borderBottom: "1px dashed #e5e7eb",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>关联链接</title>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>关联到:</span>{" "}
            <a
              href={`#${card.relatedItem.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigateToRelated?.(card.relatedItem?.id);
              }}
              style={{
                color: getCardThemeColor(),
                textDecoration: "none",
                fontWeight: 500,
                borderBottom: `1px dashed ${getCardThemeColor()}50`,
                transition: "all 0.2s ease",
              }}
            >
              {card.relatedItem.title}
            </a>
          </div>
        )}

        {/* 编辑器内容区域 */}
        {isEditingContent ? (
          <textarea
            ref={contentRef}
            value={card.content || ""}
            onChange={(e) => handleContentChange(e.target.value)}
            onBlur={() => setIsEditingContent(false)}
            style={textareaStyle}
            placeholder="在此输入内容..."
          />
        ) : (
          <textarea
            readOnly
            onClick={handleContentClick}
            onKeyDown={handleKeyDown}
            style={textareaStyle}
            aria-label="点击编辑内容"
            value={card.content || ""}
          />
        )}

        {!card.content && !isEditingContent && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              color: "#94a3b8",
              textAlign: "center",
              height: "100%",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: "none",
              backgroundColor: "rgba(249, 250, 251, 0.5)",
              borderRadius: isHeadless ? "8px" : "0 0 12px 12px",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                opacity: 0.6,
              }}
            >
              <title>编辑内容</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p style={{ marginTop: "12px", fontSize: "15px", fontWeight: 500 }}>点击此处开始编辑内容</p>
            <p style={{ fontSize: "13px", opacity: 0.8, maxWidth: "240px", margin: "8px 0 0 0" }}>
              您可以在这里添加文本、笔记或任何需要的内容
            </p>
          </div>
        )}
      </div>
    );
  }

  // 集合类型卡片的渲染
  return (
    <div
      ref={setNodeRef}
      className={`collection-container ${isMobile ? "mobile-collection-container" : ""} ${
        layoutStyle === CollectionLayoutStyle.HORIZONTAL ? "horizontal-scroll-container" : ""
      } ${layoutStyle === CollectionLayoutStyle.GRID ? "grid-layout" : ""} ${
        layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "adaptive-layout" : ""
      }`}
      style={collectionContainerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题栏切换按钮 */}
      {isHeadless && (
        <button
          type="button"
          onClick={handleToggleTitleBar}
          onKeyDown={handleToggleTitleBarKeyDown}
          style={titleBarToggleButtonStyle}
          aria-label={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
        >
          <svg
            width={isMobile ? "12" : "14"}
            height={isMobile ? "12" : "14"}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>{showTitleBar ? "隐藏标题栏" : "显示标题栏"}</title>
            {showTitleBar ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
          </svg>
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
            onUpdateCard={onUpdateCard}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* 集合内容区域 */}
      {card.childCards && card.childCards.length > 0 ? (
        <div
          style={{
            display: layoutStyle === CollectionLayoutStyle.GRID ? "grid" : "flex",
            gridTemplateColumns:
              layoutStyle === CollectionLayoutStyle.GRID ? "repeat(auto-fill, minmax(280px, 1fr))" : "none",
            flexDirection:
              layoutStyle === CollectionLayoutStyle.VERTICAL || layoutStyle === CollectionLayoutStyle.LIST
                ? "column"
                : "row",
            flexWrap: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "wrap" : "nowrap",
            gap: layoutStyle === CollectionLayoutStyle.LIST ? "8px" : "16px",
            width: "100%",
            transition: "all 0.3s ease",
          }}
        >
          {card.childCards.map((childCard, index) => {
            if (childCard.isVisible === false) {
              return null; // 不渲染隐藏的卡片
            }

            return (
              <DraggableCard
                key={childCard.id}
                id={childCard.id}
                index={index}
                parentId={card.id}
                moveCard={moveCard ? moveCard : () => {}}
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
                  onNavigateToRelated={onNavigateToRelated}
                  layoutStyle={layoutStyle}
                  onBatchUpdateCards={onBatchUpdateCards}
                />
              </DraggableCard>
            );
          })}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 16px",
            color: "#64748b",
            textAlign: "center",
            minHeight: "180px",
            width: "100%",
            backgroundColor: "rgba(249, 250, 251, 0.7)",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1",
            backdropFilter: "blur(4px)",
            boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              opacity: 0.6,
            }}
          >
            <title>添加卡片</title>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="8" x2="12" y2="16" />
          </svg>
          <p style={{ marginTop: "16px", fontSize: "16px", fontWeight: 500 }}>
            {isCollection ? "此集合中还没有卡片" : "点击此处开始编辑内容"}
          </p>
          <p style={{ fontSize: "14px", opacity: 0.8, maxWidth: "300px", margin: "8px 0 0 0" }}>
            {isCollection ? "拖动卡片到此处或点击添加按钮创建新卡片" : "您可以在这里添加文本、笔记或任何需要的内容"}
          </p>
          {isCollection && onAddButtonClick && (
            <button
              type="button"
              onClick={onAddButtonClick}
              style={{
                marginTop: "20px",
                padding: "8px 16px",
                backgroundColor: getCardThemeColor(),
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                transition: "all 0.2s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>添加卡片</title>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              添加卡片
            </button>
          )}
        </div>
      )}

      {/* 添加拖拽提示 */}
      <style>
        {`
          .collection-container.is-over {
            background-color: rgba(243, 244, 246, 0.9);
            border: 2px dashed #4a90e2;
          }
        `}
      </style>
    </div>
  );
}
