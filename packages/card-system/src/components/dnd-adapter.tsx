import type React from "react";

interface DndAdapterProps {
  children: React.ReactNode;
  isMobile?: boolean;
}

/**
 * DndAdapter 组件
 *
 * 在dnd-kit版本中，这只是一个简单的包装器，因为所有的拖拽功能都由dnd-kit提供
 */
export function DndAdapter({ children }: DndAdapterProps) {
  return <>{children}</>;
}
