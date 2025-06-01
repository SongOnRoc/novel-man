import { useEffect, useRef, useState } from "react";
import { useDrop } from "react-dnd";
import { CardComponent } from "../card-component";
import type { BaseCardProps, CardButtonsConfig, CardProperty } from "../types";
import { CardContainerType, CollectionLayoutStyle } from "../types";
import { ItemTypes } from "./drag-item-types";
import { DraggableCard } from "./draggable-card";

interface ContainerProps {
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
}

interface DropItem {
  id: string;
  parentId?: string;
  index: number;
  type: string;
}

export function Container({
  card,
  containerType,
  layoutStyle = CollectionLayoutStyle.VERTICAL,
  onUpdateCard,
  onDeleteCard,
  onAddCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
  },
  attributeOptions = [],
  availableRelateItems = [],
  moveCard,
}: ContainerProps) {
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const [isOverContainer, setIsOverContainer] = useState(false);
  const [dropErrorMessage, setDropErrorMessage] = useState<string | null>(null);
  const [isOverEmpty, setIsOverEmpty] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const emptyAreaRef = useRef<HTMLDivElement | null>(null);

  // 编辑器获取焦点
  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
    }
  }, [isEditingContent]);

  // 处理内容编辑
  const handleContentEdit = () => setIsEditingContent(true);
  const handleContentChange = (value: string) => onUpdateCard(card.id, { content: value });
  const handleContentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleContentChange(e.target.value);
  const handleContentSave = () => setIsEditingContent(false);

  // 处理点击外部关闭编辑器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingContent && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsEditingContent(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditingContent]);

  // 错误提示消失
  useEffect(() => {
    if (dropErrorMessage) {
      const timer = setTimeout(() => setDropErrorMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [dropErrorMessage]);

  // 设置容器为可放置区域，用于接收拖拽的卡片
  const [{ isOver: isOverCurrent }, drop] = useDrop<DropItem, unknown, { isOver: boolean }>({
    accept: ItemTypes.CARD,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    hover: (item, monitor) => {
      // 只在状态变化时更新isOver，避免频繁重渲染
      const isCurrentlyOver = monitor.isOver({ shallow: true });

      // 从同一父容器拖拽的卡片不处理hover事件 - 这是排序操作
      if (item.parentId === card.id) {
        return;
      }

      // 编辑器类卡片不接受其他卡片
      if (containerType === CardContainerType.EDITOR) {
        setIsOver(false);
        return;
      }

      // 防止卡片拖入自己的容器（避免循环引用）
      if (item.id === card.id) {
        setIsOver(false);
        return;
      }

      if (isOver !== isCurrentlyOver) {
        setIsOver(isCurrentlyOver);
      }

      // 增强跨容器拖拽体验：当悬停在容器上时，增加视觉反馈
      if (isCurrentlyOver && item.parentId !== card.id) {
        // 添加强调样式，通过状态控制
        setIsOverContainer(true);
      } else {
        setIsOverContainer(false);
      }
    },
    drop: (item: DropItem, monitor) => {
      // 如果不是直接放置在当前容器上，则忽略
      if (!monitor.isOver({ shallow: true })) {
        return;
      }

      // 从同一父容器拖拽的卡片不处理drop事件 - 这是排序操作
      if (item.parentId === card.id) {
        return;
      }

      // 编辑器类卡片不能接收其他卡片
      if (containerType === CardContainerType.EDITOR) {
        setDropErrorMessage("编辑器卡片不能包含其他卡片");
        return {
          containerId: card.id,
          success: false,
          error: "编辑器卡片不能包含其他卡片",
        };
      }

      // 防止卡片拖入自己的容器（避免循环引用）
      if (item.id === card.id) {
        console.error(`禁止将卡片拖入自己的容器中: 卡片ID=${item.id}`);
        setDropErrorMessage("不能将卡片拖入自己的容器中");
        return {
          containerId: card.id,
          success: false,
          error: "不能将卡片拖入自己的容器中",
        };
      }

      // 处理跨容器拖拽 - 这是放入容器操作
      console.log(`卡片 ${item.id} 被拖放到容器 ${card.id}`);

      // 触发跨容器拖拽，将卡片移动到新容器
      if (moveCard) {
        try {
          // 目标容器中的第一个位置（索引0）
          const targetIndex = 0;
          moveCard(item.index, targetIndex, item.parentId, card.id);

          // 添加成功反馈
          setIsOverContainer(false);
          // 添加成功动画效果
          const containerElement = containerRef.current;
          if (containerElement) {
            containerElement.classList.add("drop-success");
            setTimeout(() => {
              containerElement.classList.remove("drop-success");
            }, 500);
          }
        } catch (error) {
          console.error("跨容器拖拽错误:", error);
          setDropErrorMessage("拖拽操作失败");
          return {
            containerId: card.id,
            success: false,
            error: "拖拽操作失败",
          };
        }
      }

      return { containerId: card.id, success: true };
    },
  });

  // 为空区域添加单独的拖放处理，增强拖入体验
  const [{ isOver: isOverEmptyArea }, dropEmpty] = useDrop<DropItem, unknown, { isOver: boolean }>({
    accept: ItemTypes.CARD,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item, monitor) => {
      // 编辑器类卡片不接受其他卡片
      if (containerType === CardContainerType.EDITOR) {
        return;
      }

      // 防止卡片拖入自己的容器（避免循环引用）
      if (item.id === card.id) {
        return;
      }

      // 从同一父容器拖拽的卡片不处理hover事件 - 这是排序操作
      if (item.parentId === card.id) {
        return;
      }
    },
    drop: (item: DropItem, monitor) => {
      // 编辑器类卡片不能接收其他卡片
      if (containerType === CardContainerType.EDITOR) {
        setDropErrorMessage("编辑器卡片不能包含其他卡片");
        return {
          containerId: card.id,
          success: false,
          error: "编辑器卡片不能包含其他卡片",
        };
      }

      // 防止卡片拖入自己的容器（避免循环引用）
      if (item.id === card.id) {
        setDropErrorMessage("不能将卡片拖入自己的容器中");
        return {
          containerId: card.id,
          success: false,
          error: "不能将卡片拖入自己的容器中",
        };
      }

      // 处理跨容器拖拽 - 这是放入容器操作
      console.log(`卡片 ${item.id} 被拖放到容器空白区域 ${card.id}`);

      // 触发跨容器拖拽，将卡片移动到新容器
      if (moveCard) {
        try {
          // 目标容器中的最后一个位置
          const targetIndex = card.childCards?.length || 0;
          moveCard(item.index, targetIndex, item.parentId, card.id);

          // 添加成功动画效果
          const emptyElement = emptyAreaRef.current;
          if (emptyElement) {
            emptyElement.classList.add("drop-success");
            setTimeout(() => {
              emptyElement.classList.remove("drop-success");
            }, 500);
          }
        } catch (error) {
          console.error("跨容器拖拽错误:", error);
          setDropErrorMessage("拖拽操作失败");
          return {
            containerId: card.id,
            success: false,
            error: "拖拽操作失败",
          };
        }
      }

      return { containerId: card.id, success: true };
    },
  });

  // 处理子卡片移动
  const handleMoveCard = (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
    if (moveCard) {
      moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);
    }
  };

  // 容器基础样式
  const containerStyle = {
    border: "1px solid #ccc",
    borderTop: "none", // 移除顶部边框，避免与标题栏边框重叠
    width: "100%",
    padding: "16px",
    boxSizing: "border-box" as const,
    transition: "background-color 0.2s",
    backgroundColor: isOver ? "rgba(59, 130, 246, 0.05)" : "transparent", // 拖拽悬停时显示背景色
  };

  // 编辑器容器样式
  const editorContainerStyle = {
    ...containerStyle,
  };

  // 集合容器样式
  const collectionContainerStyle = {
    ...containerStyle,
    padding: "12px",
  };

  // 成功拖放动画样式
  const dropSuccessStyle = `
    .drop-success {
      animation: pulse-success 0.5s ease-in-out;
    }
    
    @keyframes pulse-success {
      0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
      50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
    }
    
    .drop-zone {
      position: relative;
    }
    
    .drop-zone::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 2px dashed transparent;
      border-radius: 0.5rem;
      pointer-events: none;
      transition: all 0.2s ease-in-out;
    }
    
    .drop-zone.active::after {
      border-color: #3b82f6;
      background-color: rgba(59, 130, 246, 0.05);
    }
  `;

  // 应用拖放引用
  drop(containerRef);

  // 渲染编辑器容器
  if (containerType === CardContainerType.EDITOR) {
    return (
      <div style={editorContainerStyle} ref={containerRef}>
        {dropErrorMessage && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm">{dropErrorMessage}</div>}
        {isEditingContent ? (
          <textarea
            ref={contentTextareaRef}
            value={card.content || ""}
            onChange={handleContentInputChange}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              minHeight: "100px",
              outline: "none",
            }}
            placeholder="在此输入内容..."
          />
        ) : (
          <button
            type="button"
            onClick={handleContentEdit}
            style={{
              width: "100%",
              textAlign: "left",
              minHeight: "40px",
              padding: "8px",
              background: "none",
              border: "none",
              cursor: "text",
            }}
          >
            {card.content || "点击添加内容"}
          </button>
        )}
      </div>
    );
  }

  // 渲染集合容器
  if (containerType === CardContainerType.COLLECTION) {
    // 根据布局样式设置容器样式
    let contentLayoutStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      overflowY: "auto",
      maxHeight: "500px",
    };

    if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
      contentLayoutStyle = {
        display: "flex",
        flexDirection: "row",
        gap: "16px",
        overflowX: "auto",
        maxHeight: "none",
      };
    } else if (layoutStyle === CollectionLayoutStyle.ADAPTIVE) {
      contentLayoutStyle = {
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        maxHeight: "none",
      };
    }

    // 添加拖拽相关的样式
    const dropZoneClass = isOverCurrent ? "border-2 border-dashed border-blue-400 bg-blue-50" : "";
    const emptyDropZoneClass = isOverEmptyArea ? "border-blue-400 bg-blue-50" : "";

    // 检查是否有可见的子卡片
    const childCards = card.childCards || [];
    const hasChildCards = childCards.filter((child) => child && child.isVisible !== false).length > 0;

    // 添加全局样式到文档
    useEffect(() => {
      // 创建样式元素
      const styleElement = document.createElement("style");
      styleElement.textContent = dropSuccessStyle;
      document.head.appendChild(styleElement);

      // 清理函数
      return () => {
        document.head.removeChild(styleElement);
      };
    }, []);

    return (
      <div
        style={collectionContainerStyle}
        ref={containerRef}
        className={`transition-all duration-200 drop-zone ${isOverCurrent || isOverContainer ? "active" : ""} ${dropZoneClass} ${isOverContainer ? "ring-2 ring-blue-500" : ""}`}
        title={isOverCurrent || isOverContainer ? "放置卡片到此容器" : ""}
      >
        {dropErrorMessage && <div className="bg-red-100 text-red-700 p-2 mb-2 rounded text-sm">{dropErrorMessage}</div>}
        <div style={contentLayoutStyle}>
          {hasChildCards ? (
            childCards
              .filter((childCard) => childCard && childCard.isVisible !== false)
              .map((childCard, index) => (
                <DraggableCard
                  key={childCard.id}
                  id={childCard.id}
                  index={index}
                  moveCard={handleMoveCard}
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
                    layoutStyle={layoutStyle}
                    moveCard={moveCard}
                  />
                </DraggableCard>
              ))
          ) : (
            <div
              ref={dropEmpty}
              style={{
                padding: "16px",
                textAlign: "center",
                color: "#6b7280",
                border: "1px dashed #d1d5db",
                borderRadius: "4px",
                backgroundColor: isOverEmptyArea ? "rgba(59, 130, 246, 0.1)" : "transparent",
                transition: "all 0.2s",
                minHeight: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              className={`${emptyDropZoneClass} min-h-[100px] drop-zone ${isOverEmptyArea ? "active" : ""}`}
              title="拖拽卡片到此处"
            >
              <div className="flex flex-col items-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-2 text-gray-400"
                >
                  <title>拖拽提示图标</title>
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                </svg>
                点击"+"按钮添加卡片或拖拽卡片到此处
              </div>
            </div>
          )}
        </div>

        {/* 额外的空白拖拽区域，只在拖拽悬停时显示 */}
        {hasChildCards && (
          <div
            ref={dropEmpty}
            className={`border-0 overflow-hidden transition-all duration-500 ease-in-out ${isOverEmptyArea ? "mt-3 border border-dashed rounded text-center border-blue-400 bg-blue-50 drop-zone active" : "drop-zone"}`}
            style={{
              height: isOverEmptyArea ? "50px" : "0px", // 增加高度，更容易拖入
              opacity: isOverEmptyArea ? 1 : 0,
              padding: isOverEmptyArea ? "5px 8px" : "0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: isOverEmptyArea ? "translateY(0)" : "translateY(-10px)",
            }}
            title="拖拽卡片到此处"
          >
            {isOverEmptyArea && (
              <div className="flex items-center text-xs text-blue-500 transition-opacity duration-300">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-1"
                >
                  <title>拖拽提示图标</title>
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor" />
                </svg>
                将卡片拖放到这里
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
