import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type React from "react";
import { ItemTypes } from "./drag-item-types";

interface DraggableCardDndKitProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  children: React.ReactNode;
  parentId?: string;
  layoutStyle?: string;
}

/**
 * 可拖拽卡片组件
 * 将卡片包装为可拖拽元素，提供拖拽手柄和必要的事件处理
 */
export function DraggableCardDndKit({
  id,
  index,
  moveCard,
  children,
  parentId,
  layoutStyle,
}: DraggableCardDndKitProps) {
  // 使用dnd-kit的useSortable hook，提供拖拽功能
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: {
      index,
      parentId,
      type: ItemTypes.CARD,
    },
  });

  // 应用基本样式，包括拖拽时的变换和透明度
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1000 : 1,
  };

  // 拖拽手柄图标
  const getDragHandleIcon = () => {
    return (
      <div
        className="drag-handle"
        style={{
          position: "absolute",
          top: "8px",
          left: "0px",
          cursor: "grab",
          opacity: 0.6,
          zIndex: 20,
          background: "#f3f4f6",
          padding: "4px",
          borderRadius: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
        }}
        {...listeners}
        {...attributes}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          role="img"
        >
          <title>拖拽手柄图标</title>
          <path d="M8 6H10V8H8V6Z" fill="currentColor" />
          <path d="M14 6H16V8H14V6Z" fill="currentColor" />
          <path d="M8 11H10V13H8V11Z" fill="currentColor" />
          <path d="M14 11H16V13H14V11Z" fill="currentColor" />
          <path d="M8 16H10V18H8V16Z" fill="currentColor" />
          <path d="M14 16H16V18H14V16Z" fill="currentColor" />
        </svg>
      </div>
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`draggable-card ${isDragging ? "is-dragging" : ""}`}
      data-card-id={id}
      data-card-index={index}
      data-parent-id={parentId || "root"}
    >
      {getDragHandleIcon()}
      {children}
    </div>
  );
}
