"use client";

import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

// 拖拽项类型
export const ItemTypes = {
  CARD: "card",
};

// 定义拖拽项接口
interface DragItem {
  id: string;
  index: number;
  parentId?: string; // 添加父容器ID
}

// 拖拽卡片接口
interface DraggableCardProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  parentId?: string; // 添加父容器ID
  children: React.ReactNode;
}

// 拖拽卡片组件
export function DraggableCard({ id, index, moveCard, parentId, children }: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      const dragParentId = item.parentId;
      const hoverParentId = parentId;

      console.log("DraggableCard hover:", { dragIndex, hoverIndex, dragParentId, hoverParentId });

      // 不要替换自己
      if (dragIndex === hoverIndex && dragParentId === hoverParentId) {
        return;
      }

      // 确定卡片边界
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // 获取卡片中心垂直位置
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // 获取鼠标位置
      const clientOffset = monitor.getClientOffset();

      // 如果clientOffset为空，不处理
      if (!clientOffset) {
        return;
      }

      // 获取鼠标在卡片上的垂直位置
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 如果是跨容器拖拽，不需要检查越过一半的条件
      if (dragParentId !== hoverParentId) {
        console.log("Cross-container drag detected");
        // 执行跨容器移动
        moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);
        // 更新item的索引和父容器ID
        item.index = hoverIndex;
        item.parentId = hoverParentId;
        return;
      }

      // 仅在鼠标越过卡片一半高度时执行移动
      // 向下拖动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        console.log("Dragging down, but not past middle - ignoring");
        return;
      }
      // 向上拖动
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        console.log("Dragging up, but not past middle - ignoring");
        return;
      }

      console.log("Executing move card");
      // 执行移动
      moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);
      // 注意：这里我们直接修改 item.index，因为useDrag API本身不提供更新item的方法
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      console.log(`Starting drag for card ${id} at index ${index} in parent ${parentId || "root"}`);
      return { id, index, parentId };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      data-card-id={id}
      data-card-index={index}
      data-parent-id={parentId || "root"}
    >
      {children}
    </div>
  );
}
