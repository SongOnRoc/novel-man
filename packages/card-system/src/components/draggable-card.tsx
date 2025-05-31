import type { Identifier } from "dnd-core";
import { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "./drag-item-types"; // 从新文件导入

interface DragItem {
  index: number;
  id: string;
  parentId?: string;
  type: string;
  targetParentId?: string; // 添加目标容器ID属性
}

interface DraggableCardProps {
  id: string;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  children: React.ReactNode;
  parentId?: string;
  layoutStyle?: string; // 添加布局样式属性
}

export function DraggableCard({ id, index, moveCard, children, parentId, layoutStyle }: DraggableCardProps) {
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
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

      // 确定鼠标位置
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // 根据布局样式限制拖动方向
      if (layoutStyle === "VERTICAL") {
        // 上下排列：只允许垂直方向移动
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      } else if (layoutStyle === "HORIZONTAL") {
        // 左右排列：只允许水平方向移动
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
      } else {
        // 自适应排列：同时考虑水平和垂直方向
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY && hoverClientX < hoverMiddleX) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY && hoverClientX > hoverMiddleX) {
          return;
        }
      }

      // 执行移动
      console.log(`同容器拖拽: 在 ${dragParentId || "root"} 中从 ${dragIndex} 到 ${hoverIndex}`);
      moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);

      // 更新拖拽项的索引
      item.index = hoverIndex;
    },
    drop(item: DragItem, monitor) {
      // 处理跨容器拖拽
      const dragParentId = item.parentId;
      const hoverParentId = parentId;
      
      if (dragParentId !== hoverParentId) {
        console.log(
          `跨容器放置: 从 ${dragParentId || "root"} 到 ${hoverParentId || "root"}`
        );
        // 存储目标容器ID用于end回调
        item.targetParentId = hoverParentId;
      }
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
    end: (item: DragItem, monitor) => {
      if (monitor.didDrop()) {
        if (item.targetParentId && item.targetParentId !== item.parentId) {
          console.log(`卡片 ${item.id} 移动到新容器 ${item.targetParentId}`);
        } else {
          console.log(`拖拽完成: ${item.id}`);
        }
      } else {
        console.log(`拖拽取消: ${item.id}, 回弹到原位置`);
        // 回弹逻辑：通知父组件恢复位置（需在父组件实现）
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
