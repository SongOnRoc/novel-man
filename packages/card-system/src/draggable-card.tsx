import type { Identifier } from "dnd-core";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";

// 统一的卡片类型
export const ItemTypes = {
  CARD: "card",
};

interface DragItem {
  index: number;
  id: string;
  parentId?: string;
  type: string;
}

interface DraggableCardProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  children: React.ReactNode;
  parentId?: string;
}

export function DraggableCard({ id, index, moveCard, children, parentId }: DraggableCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: ItemTypes.CARD, // 使用统一的卡片类型
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

      // 如果拖拽的是自己，不做任何处理
      if (dragIndex === hoverIndex && dragParentId === hoverParentId) {
        return;
      }

      // 确定矩形范围
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // 获取垂直中点
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // 确定鼠标位置
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // 跨容器拖拽的情况
      if (dragParentId !== hoverParentId) {
        // 不需要判断越过一半的逻辑，直接执行移动
        console.log(
          `跨容器拖拽: 从 ${dragParentId || "root"}[${dragIndex}] 到 ${hoverParentId || "root"}[${hoverIndex}]`,
        );
        moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);

        // 更新拖拽项的索引和父ID
        item.index = hoverIndex;
        item.parentId = hoverParentId;
        return;
      }

      // 只有当鼠标越过目标卡片的一半时才执行移动
      // 向下拖动
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // 向上拖动
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // 执行移动
      console.log(`同容器拖拽: 在 ${dragParentId || "root"} 中从 ${dragIndex} 到 ${hoverIndex}`);
      moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);

      // 更新拖拽项的索引
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD, // 使用统一的卡片类型
    item: () => {
      console.log(`开始拖拽卡片: ${id}, 索引: ${index}, 父容器: ${parentId || "root"}`);
      return { id, index, parentId, type: ItemTypes.CARD };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        console.log(`拖拽取消: ${id}`);
      } else {
        console.log(`拖拽完成: ${id}`);
      }
    },
  });

  // 使用更明显的视觉效果表示拖拽状态
  const opacity = isDragging ? 0 : 1; // 完全隐藏正在拖拽的卡片原位置
  drag(drop(ref));

  return (
    <div
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`cursor-move ${isDragging ? "dragging" : ""}`}
      data-card-id={id}
      data-card-index={index}
      data-parent-id={parentId || "root"}
    >
      {children}
    </div>
  );
}
