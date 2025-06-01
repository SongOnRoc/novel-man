import type { ReactNode } from "react";

export enum CardContainerType {
  EDITOR = "editor",
  COLLECTION = "collection",
}

export enum CollectionLayoutStyle {
  VERTICAL = "vertical",
  HORIZONTAL = "horizontal",
  ADAPTIVE = "adaptive",
  GRID = "grid",
  LIST = "list",
}

export interface CardProperty {
  name: string;
  value: string;
}

export interface BaseCardProps {
  id: string;
  title: string;
  content?: string;
  tag?: string;
  type?: string;
  isCollapsed: boolean;
  isEditing?: boolean;
  isVisible?: boolean;
  hideTitle?: boolean;
  hideBorder?: boolean; // 新增：控制是否隐藏边框
  containerType: CardContainerType;
  childCards?: BaseCardProps[];
  layoutStyle?: CollectionLayoutStyle;
  relatedItem?: {
    id: string;
    title: string;
    type: string;
    isExternal?: boolean;
  };
  parent?: string;
  props?: CardProperty[];
  createdAt?: Date;
  updatedAt?: Date;
  showEditButton?: boolean;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  showRelateButton?: boolean;
  showLayoutStyleButton?: boolean;
}

export interface CardButtonsConfig {
  showEditButton?: boolean;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  showRelateButton?: boolean;
  showLayoutStyleButton?: boolean;
}

export interface CardCallbacks {
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: <T extends CardProperty[] | number = CardProperty[]>(
    parentId: string,
    containerType: CardContainerType,
    options?: {
      title?: string;
      hideTitle?: boolean;
      props?: T extends CardProperty[] ? T : never;
      parentCardCount?: T extends number ? T : never;
    }
  ) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  onToggleCollapse?: (id: string) => void;
  onLayoutStyleChange?: (style: CollectionLayoutStyle) => void;
}

export interface CardCommonProps {
  buttonsConfig?: CardButtonsConfig;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  isMobile?: boolean;
}

export interface CardComponentProps extends CardCallbacks, CardCommonProps {
  card: BaseCardProps;
  index?: number;
  moveCard?: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  className?: string;
  renderCustomContent?: (
    card: BaseCardProps,
    isEditingContent: boolean,
    setIsEditingContent: (value: boolean) => void,
    handleContentChange: (value: string) => void,
  ) => ReactNode;
  renderChildCard?: (card: BaseCardProps, index: number) => ReactNode;
  parentId?: string;
  layoutStyle?: CollectionLayoutStyle;
  onOpenAddDialog?: (parentId: string) => void;
}

export interface CardSystemProps extends CardCallbacks, CardCommonProps {
  cards: BaseCardProps[];
  title: string;
  onAddCard: (containerType: CardContainerType, options?: {
    title?: string;
    hideTitle?: boolean;
    props?: CardProperty[];
  }) => void;
  moveCard?: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  addButtonText?: string;
  defaultCollapsed?: boolean;
}

export interface AddCardDialogProps {
  open: boolean;
  onClose: () => void;
  onAddEditorCard: (title?: string, hideTitle?: boolean, props?: CardProperty[]) => void;
  onAddCollectionCard: (title?: string, props?: CardProperty[]) => void;
  defaultTitle?: string;
  parentTag?: string;
  parentProps?: CardProperty[];
  attributeOptions?: Array<{ value: string; label: string }>;
}

export interface RelateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, itemTitle: string, itemType: string) => void;
  availableItems?: Array<{ id: string; title: string; type: string }>;
}

export interface LayoutStyleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (style: CollectionLayoutStyle) => void;
  currentStyle?: CollectionLayoutStyle;
}

export interface CardFactory {
  createCard: (options: {
    title: string;
    containerType: CardContainerType;
    tag?: string;
    parent?: string;
    props?: CardProperty[];
    hideTitle?: boolean;
    isCollapsed?: boolean;
  }) => BaseCardProps;
}
