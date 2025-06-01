import type { Identifier } from "dnd-core";
import { useEffect, useRef, useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "./drag-item-types"; // 从新文件导入

interface DragItem {
  index: number;
  id: string;
  parentId?: string;
  type: string;
  targetParentId?: string; // 添加目标容器ID属性
  originalIndex?: number; // 原始索引，用于回弹
  dragOperation?: "sort" | "move-to-container"; // 拖拽操作类型
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
  const [isOverContainer, setIsOverContainer] = useState(false);
  const [isDraggingOut, setIsDraggingOut] = useState(false);
  const [dragDirection, setDragDirection] = useState<"up" | "down" | "left" | "right" | null>(null);
  const lastMoveTime = useRef<number>(0);
  const isDragInitialized = useRef<boolean>(false);
  const currentDragOperation = useRef<"sort" | "move-to-container" | null>(null);

  // 新增：跟踪拖拽方向
  const dragDirectionRef = useRef<"up" | "down" | "left" | "right" | null>(null);
  // 新增：记录上一次鼠标位置，用于计算拖拽方向
  const lastMousePositionRef = useRef<{ x: number; y: number } | null>(null);
  // 新增：跟踪跨容器拖拽的目标容器ID
  const targetContainerRef = useRef<string | null>(null);
  // 新增：防抖定时器
  const moveDebounceTimerRef = useRef<number | null>(null);
  // 新增：拖拽指示器的位置
  const [indicatorPosition, setIndicatorPosition] = useState<"top" | "bottom" | "left" | "right" | null>(null);

  // 重置拖拽状态
  useEffect(() => {
    // 组件卸载时重置状态
    return () => {
      isDragInitialized.current = false;
      currentDragOperation.current = null;
      dragDirectionRef.current = null;
      lastMousePositionRef.current = null;
      targetContainerRef.current = null;
      if (moveDebounceTimerRef.current !== null) {
        window.clearTimeout(moveDebounceTimerRef.current);
        moveDebounceTimerRef.current = null;
      }
    };
  }, []);

  // 将字符串布局样式转换为枚举值
  const normalizedLayoutStyle = layoutStyle ? layoutStyle.toUpperCase() : "ADAPTIVE";

  const [{ handlerId, isOver }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null; isOver: boolean }>({
    accept: ItemTypes.CARD, // 使用统一的卡片类型
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
        isOverCurrent: monitor.isOver({ shallow: true }),
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

      // 记录原始索引，用于回弹
      if (item.originalIndex === undefined) {
        item.originalIndex = dragIndex;
      }

      // 如果拖拽的是自己，不做任何处理
      if (dragIndex === hoverIndex && dragParentId === hoverParentId) {
        return;
      }

      // 防止自我循环引用
      if (item.id === hoverParentId) {
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

      // 计算鼠标距离卡片中心的距离
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;

      // 新增：更新拖拽方向
      if (lastMousePositionRef.current) {
        if (
          Math.abs(clientOffset.y - lastMousePositionRef.current.y) >
          Math.abs(clientOffset.x - lastMousePositionRef.current.x)
        ) {
          // 垂直移动更明显
          const newDirection = clientOffset.y < lastMousePositionRef.current.y ? "up" : "down";
          dragDirectionRef.current = newDirection;
          setDragDirection(newDirection);
        } else {
          // 水平移动更明显
          const newDirection = clientOffset.x < lastMousePositionRef.current.x ? "left" : "right";
          dragDirectionRef.current = newDirection;
          setDragDirection(newDirection);
        }
      }
      lastMousePositionRef.current = { x: clientOffset.x, y: clientOffset.y };

      // 拖拽行为判断 - 只在同一容器内才做排序操作
      const isSameContainer = dragParentId === hoverParentId;

      // 设置当前拖拽操作类型
      if (!isDragInitialized.current) {
        currentDragOperation.current = isSameContainer ? "sort" : "move-to-container";
        isDragInitialized.current = true;
        item.dragOperation = currentDragOperation.current;
      }

      // 如果是跨容器拖拽，记录目标容器ID
      if (!isSameContainer) {
        targetContainerRef.current = hoverParentId || null;
        return;
      }

      // 从这里开始是排序操作逻辑
      // 调整阈值，使向上拖动更灵敏
      const upwardThreshold = 0.15; // 向上拖动时使用更小的阈值
      const downwardThreshold = 0.25; // 向下拖动保持原有阈值
      const horizontalThreshold = 0.25; // 水平拖动阈值

      // 更新拖拽指示器位置
      if (normalizedLayoutStyle === "VERTICAL" || normalizedLayoutStyle === "ADAPTIVE") {
        if (hoverClientY < hoverMiddleY) {
          setIndicatorPosition("top");
        } else {
          setIndicatorPosition("bottom");
        }
      } else if (normalizedLayoutStyle === "HORIZONTAL") {
        if (hoverClientX < hoverMiddleX) {
          setIndicatorPosition("left");
        } else {
          setIndicatorPosition("right");
        }
      }

      // 根据布局样式限制拖动方向
      if (normalizedLayoutStyle === "VERTICAL") {
        // 垂直布局：判断Y轴方向的移动
        const yRatio = Math.abs(hoverClientY - hoverMiddleY) / hoverMiddleY;

        // 根据拖动方向使用不同的阈值
        const threshold = dragIndex > hoverIndex ? upwardThreshold : downwardThreshold;

        // 如果移动距离不够，不做任何处理
        if (yRatio < threshold) {
          return;
        }

        // 向下拖动：只有当鼠标位置超过中点时才处理
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }
        // 向上拖动：只有当鼠标位置小于中点时才处理
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      } else if (normalizedLayoutStyle === "HORIZONTAL") {
        // 水平布局：判断X轴方向的移动
        const xRatio = Math.abs(hoverClientX - hoverMiddleX) / hoverMiddleX;

        // 如果移动距离不够，不做任何处理
        if (xRatio < horizontalThreshold) {
          return;
        }

        // 向右拖动：只有当鼠标位置超过中点时才处理
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
        // 向左拖动：只有当鼠标位置小于中点时才处理
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
      } else {
        // 自适应布局：判断主要移动方向
        const xRatio = Math.abs(hoverClientX - hoverMiddleX) / hoverMiddleX;
        const yRatio = Math.abs(hoverClientY - hoverMiddleY) / hoverMiddleY;

        // 根据拖动方向使用不同的阈值
        const yThreshold = dragDirectionRef.current === "up" ? upwardThreshold : downwardThreshold;

        // 如果两个方向的移动都不够，不做任何处理
        if (xRatio < horizontalThreshold && yRatio < yThreshold) {
          return;
        }

        // 判断主要移动方向
        if (xRatio > yRatio) {
          // 主要是水平移动
          if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
            return;
          }
          if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
            return;
          }
        } else {
          // 主要是垂直移动
          if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
            return;
          }
          if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
            return;
          }
        }
      }

      // 优化节流处理，根据拖拽方向调整节流时间
      const now = Date.now();
      // 向上拖动时使用更短的节流时间，提高响应速度
      const throttleTime = dragDirectionRef.current === "up" ? 80 : 120;

      if (now - lastMoveTime.current < throttleTime) {
        return;
      }
      lastMoveTime.current = now;

      // 执行卡片排序，使用防抖处理避免过于频繁的状态更新
      if (moveDebounceTimerRef.current !== null) {
        window.clearTimeout(moveDebounceTimerRef.current);
      }

      moveDebounceTimerRef.current = window.setTimeout(() => {
        moveCard(dragIndex, hoverIndex, dragParentId, hoverParentId);
        // 更新拖拽项的索引
        item.index = hoverIndex;
        moveDebounceTimerRef.current = null;
        // 移动后清除指示器
        setIndicatorPosition(null);
      }, 10); // 短暂延迟，但足够合并频繁操作
    },
    drop(item: DragItem) {
      // 移除指示器
      setIndicatorPosition(null);
      // 我们不在这里处理放入容器的逻辑，只清理状态
      return undefined;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD, // 使用统一的卡片类型
    item: () => {
      console.log(`开始拖拽卡片: ${id}, 索引: ${index}, 父容器: ${parentId || "root"}`);
      lastMoveTime.current = Date.now();
      isDragInitialized.current = false;
      currentDragOperation.current = null;
      dragDirectionRef.current = null;
      lastMousePositionRef.current = null;
      return { id, index, parentId, type: ItemTypes.CARD, originalIndex: index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item: DragItem, monitor) => {
      // 清除防抖定时器
      if (moveDebounceTimerRef.current !== null) {
        window.clearTimeout(moveDebounceTimerRef.current);
        moveDebounceTimerRef.current = null;
      }

      // 清除指示器
      setIndicatorPosition(null);

      const dropResult = monitor.getDropResult() as { containerId?: string; success?: boolean; error?: string } | null;

      // 跨容器拖拽优化：如果有目标容器但没有成功放置，尝试强制移动
      if (!monitor.didDrop() && targetContainerRef.current && item.parentId !== targetContainerRef.current) {
        try {
          // 尝试将卡片移动到目标容器的第一个位置
          moveCard(item.index, 0, item.parentId, targetContainerRef.current);
          console.log(`强制移动卡片 ${item.id} 到目标容器 ${targetContainerRef.current}`);
          // 重置状态
          setIsDraggingOut(false);
          setIsOverContainer(false);
          isDragInitialized.current = false;
          currentDragOperation.current = null;
          dragDirectionRef.current = null;
          lastMousePositionRef.current = null;
          targetContainerRef.current = null;
          return;
        } catch (error) {
          console.error("强制移动卡片失败:", error);
        }
      }

      if (monitor.didDrop()) {
        if (dropResult?.containerId) {
          // 卡片被放入新容器
          if (dropResult.success === false) {
            console.error(`拖拽失败: ${dropResult.error || "未知错误"}`);
            // 这里可以添加显示错误提示的代码
            alert(dropResult.error || "拖拽操作失败");
          } else {
            console.log(`卡片 ${item.id} 成功移动到新容器 ${dropResult.containerId}`);
          }
        } else {
          console.log(`拖拽排序完成: ${item.id}`);
        }
      } else {
        console.log(`拖拽取消: ${item.id}`);
        // 回弹逻辑：如果有原始索引，恢复到原始位置
        if (item.originalIndex !== undefined && item.originalIndex !== item.index) {
          try {
            moveCard(item.index, item.originalIndex, item.parentId, item.parentId);
          } catch (error) {
            console.error("回弹卡片出错:", error);
          }
        }
      }
      // 重置状态
      setIsDraggingOut(false);
      setIsOverContainer(false);
      isDragInitialized.current = false;
      currentDragOperation.current = null;
      dragDirectionRef.current = null;
      lastMousePositionRef.current = null;
      targetContainerRef.current = null;
    },
  });

  // 使用更明显的视觉效果表示拖拽状态
  const opacity = isDragging ? 0.4 : 1; // 半透明表示正在拖拽

  // 应用拖放引用
  drag(drop(ref));

  // 添加拖拽动画效果
  const animationClass = isDragging
    ? "transition-transform duration-200 scale-105 shadow-lg"
    : isOverContainer
      ? "transition-transform duration-100 scale-102"
      : "transition-all duration-200";

  // 根据是否拖出容器添加回弹效果
  const transformStyle = isDraggingOut ? "scale(0.98)" : "scale(1)";

  // 拖拽指示器样式
  const getIndicatorStyle = () => {
    if (!isOver || !indicatorPosition || isDragging) return {};

    const baseStyle = {
      position: "absolute",
      backgroundColor: "#3b82f6", // 蓝色
      zIndex: 1000,
      transition: "all 0.1s ease-in-out",
    };

    switch (indicatorPosition) {
      case "top":
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          transform: "translateY(-50%)",
          borderRadius: "3px",
        };
      case "bottom":
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          transform: "translateY(50%)",
          borderRadius: "3px",
        };
      case "left":
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          bottom: 0,
          width: "3px",
          transform: "translateX(-50%)",
          borderRadius: "3px",
        };
      case "right":
        return {
          ...baseStyle,
          top: 0,
          right: 0,
          bottom: 0,
          width: "3px",
          transform: "translateX(50%)",
          borderRadius: "3px",
        };
      default:
        return {};
    }
  };

  // 拖拽指示图标
  const getDragHandleIcon = () => {
    return (
      <div
        className="absolute top-0 right-0 p-1 bg-gray-100 rounded-bl text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
        style={{ fontSize: "14px" }}
        title="拖拽手柄"
        aria-label="拖拽手柄"
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
      ref={ref}
      style={{
        opacity,
        transform: isDragging ? transformStyle : "none",
        transition: "transform 0.2s, opacity 0.2s",
        position: "relative",
        zIndex: isDragging ? 1000 : 1,
      }}
      data-handler-id={handlerId}
      className={`group cursor-move border-2 ${isDragging ? "border-blue-400" : isOver ? "border-blue-300" : "border-gray-300"} rounded-lg bg-white shadow-sm ${animationClass} ${isDragging ? "dragging z-50" : ""}`}
      data-card-id={id}
      data-card-index={index}
      data-parent-id={parentId || "root"}
      data-drag-direction={dragDirection}
    >
      {/* 拖拽指示器 */}
      {isOver && !isDragging && indicatorPosition && <div style={getIndicatorStyle() as React.CSSProperties} />}

      {/* 拖拽手柄图标 */}
      {getDragHandleIcon()}

      {children}
    </div>
  );
}
