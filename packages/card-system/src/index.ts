// 导出类型
export * from "./types";

// 导出组件
export { CardSystem } from "./card-system";
export { CardComponent } from "./card-component";
export { DraggableCard } from "./components/draggable-card";
export { ItemTypes } from "./components/drag-item-types";
export { AddCardDialog, RelateDialog, LayoutStyleDialog } from "./components/dialogs";
export { DndAdapter } from "./components/dnd-adapter";
export { DefaultCardFactory } from "./card-factory";
export { CardSystemDndKit } from "./card-system-dndkit";

// 导出类型定义
export type {
  BaseCardProps,
  CardProperty,
  CardButtonsConfig,
  CardComponentProps,
  CardSystemProps,
} from "./types";

// 导出枚举
export { CardContainerType, CollectionLayoutStyle } from "./types";

// 导出移动端工具函数和钩子
export { isMobileDevice, isTouchDevice, getDeviceType } from "./utils/mobile-utils";
export { useResponsive, getResponsiveStyles, getResponsiveValue } from "./hooks/useResponsive";

// 导入样式文件
import "./styles/mobile.css";
