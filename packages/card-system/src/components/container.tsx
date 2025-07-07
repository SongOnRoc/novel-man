import { useDroppable } from "@dnd-kit/core";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { CardComponent } from "../card-component";
import {
  getCardChildrenContainerStyle,
  getContainerBorderStyle,
  getContainerStyleByLayout,
  getEditorContainerStyle,
  getEmptyButtonStyle,
  getEmptyContainerStyle,
  getFloatingTitleBarStyle,
  getTextareaStyle,
  getTitleBarToggleButtonStyle,
} from "../styles/cardStyles"; // 更新导入，引入所有样式函数
import { getScrollbarStyles } from "../styles/cardStyles";
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
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null); // 存储容器节点

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

  // 设置节点引用，同时保存到state中
  const setNodeRefWithSave = (node: HTMLElement | null) => {
    setNodeRef(node);
    setContainerNode(node as HTMLDivElement | null);
  };

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

  // 获取卡片类型对应的主题颜色
  const getCardThemeColor = () => {
    if (card.themeColor) return card.themeColor;
    return containerType === CardContainerType.EDITOR ? "#3b82f6" : "#6366f1";
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

  // 编辑器类型卡片的渲染
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div
        className={`editor-container card-editor-container ${isMobile ? "mobile-editor-container" : ""}`}
        style={getEditorContainerStyle(isHeadless, isMobile)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 标题栏切换按钮 */}
        {isHeadless && (
          <button
            type="button"
            onClick={handleToggleTitleBar}
            onKeyDown={handleToggleTitleBarKeyDown}
            style={getTitleBarToggleButtonStyle(showTitleBar, getCardThemeColor(), isMobile)}
            aria-label={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
            title={showTitleBar ? "隐藏标题栏" : "显示标题栏"}
          >
            {titleBarToggleIcon()}
          </button>
        )}

        {/* 无头卡片的悬浮标题栏 */}
        {isHeadless && onToggleCollapse && onTitleEdit && onAddButtonClick && (
          <div style={getFloatingTitleBarStyle(showTitleBar, isMobile)}>
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
            style={getTextareaStyle(isMobile)}
            placeholder="在此输入内容..."
            className="card-editor-textarea"
          />
        ) : (
          <textarea
            readOnly
            onClick={handleContentClick}
            onKeyDown={handleKeyDown}
            style={getTextareaStyle(isMobile)}
            aria-label="点击编辑内容"
            value={card.content || ""}
            className="card-editor-textarea-readonly"
          />
        )}

        {!card.content && !isEditingContent && (
          <div
            className="card-editor-placeholder"
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
              boxSizing: "border-box",
              maxWidth: "100%",
              overflow: "hidden",
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
      ref={setNodeRefWithSave}
      className={`collection-container card-collection-container ${isMobile ? "mobile-collection-container" : ""} ${
        layoutStyle === CollectionLayoutStyle.HORIZONTAL ? "horizontal-scroll-container" : ""
      } ${layoutStyle === CollectionLayoutStyle.GRID ? "grid-layout" : ""} ${
        layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "adaptive-layout" : ""
      } ${layoutStyle === CollectionLayoutStyle.VERTICAL ? "vertical-scroll-container" : ""} ${
        layoutStyle === CollectionLayoutStyle.LIST ? "list-scroll-container" : ""
      }`}
      style={getContainerStyleByLayout(layoutStyle)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 标题栏切换按钮 */}
      {isHeadless && (
        <button
          type="button"
          onClick={handleToggleTitleBar}
          onKeyDown={handleToggleTitleBarKeyDown}
          style={getTitleBarToggleButtonStyle(showTitleBar, getCardThemeColor(), isMobile)}
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
        <div style={getFloatingTitleBarStyle(showTitleBar, isMobile)}>
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
          className={`card-children-container ${
            layoutStyle === CollectionLayoutStyle.HORIZONTAL ? "horizontal-cards" : ""
          } ${layoutStyle === CollectionLayoutStyle.GRID ? "grid-cards" : ""} ${
            layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "adaptive-cards" : ""
          } ${layoutStyle === CollectionLayoutStyle.VERTICAL ? "vertical-cards" : ""} ${
            layoutStyle === CollectionLayoutStyle.LIST ? "list-cards" : ""
          }`}
          style={getCardChildrenContainerStyle(layoutStyle)}
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
                <div style={getContainerBorderStyle(layoutStyle, isMobile, containerNode)}>
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
                    isMobile={isMobile}
                  />
                </div>
              </DraggableCard>
            );
          })}
        </div>
      ) : (
        <div className="card-empty-container" style={getEmptyContainerStyle()}>
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
            className="card-empty-icon"
          >
            <title>添加卡片</title>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="8" x2="12" y2="16" />
          </svg>
          <p style={{ marginTop: "16px", fontSize: "16px", fontWeight: 500 }} className="card-empty-title">
            {isCollection ? "此集合中还没有卡片" : "点击此处开始编辑内容"}
          </p>
          <p
            style={{
              fontSize: "14px",
              opacity: 0.8,
              maxWidth: "100%",
              margin: "8px 0 0 0",
              overflowWrap: "break-word",
              wordBreak: "break-word",
            }}
            className="card-empty-description"
          >
            {isCollection ? "拖动卡片到此处或点击添加按钮创建新卡片" : "您可以在这里添加文本、笔记或任何需要的内容"}
          </p>
          {isCollection && onAddButtonClick && (
            <button
              type="button"
              onClick={onAddButtonClick}
              style={getEmptyButtonStyle(getCardThemeColor())}
              className="card-empty-add-button"
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
                className="card-empty-add-button-icon"
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

      {/* 添加拖拽提示和滚动条样式 */}
      <style>
        {`
          .collection-container.is-over {
            background-color: rgba(243, 244, 246, 0.9);
            border: 2px dashed #4a90e2;
          }
          
          ${getScrollbarStyles()}
          
          /* 确保垂直滚动容器正常工作 */
          .vertical-scroll-container, .list-scroll-container {
            overflow-y: auto;
            overflow-x: hidden;
          }

          /* 水平布局卡片样式 */
          .horizontal-cards {
            padding-bottom: 8px; /* 为滚动条留出空间 */
          }

          /* 网格布局卡片样式 */
          .grid-cards {
            padding-right: 8px; /* 为滚动条留出空间 */
            width: 100%;
          }

          /* 垂直布局卡片样式 */
          .vertical-cards, .list-cards {
            padding-right: 8px; /* 为滚动条留出空间 */
            width: 100%;
          }
          
          /* 自适应布局卡片样式 */
          .adaptive-cards {
            padding-right: 8px; /* 为滚动条留出空间 */
            width: 100%;
          }
          
          /* 确保卡片在垂直布局中宽度一致 */
          .vertical-cards > *, .list-cards > * {
            width: 100% !important;
          }
        `}
      </style>
    </div>
  );
}
