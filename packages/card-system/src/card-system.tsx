import { CardSystemDndKit } from "./card-system-dndkit";
import type { BaseCardProps, CardButtonsConfig } from "./types";

interface CardSystemProps {
  // 初始卡片数据，可选
  initialCards?: BaseCardProps[];
  // 卡片系统标题
  title: string;
  // 外部状态同步回调，可选
  onCardsChange?: (cards: BaseCardProps[]) => void;
  // 样式配置
  isMobile?: boolean;
  buttonsConfig?: CardButtonsConfig;
  addButtonText?: string;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  defaultCollapsed?: boolean;
  // useDndKit 属性不再需要，默认为true
}

// 卡片系统组件
export function CardSystem(props: CardSystemProps) {
  // 默认使用dnd-kit版本的实现
  return <CardSystemDndKit {...props} />;
}
