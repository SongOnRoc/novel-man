import type { ReactNode } from "react";

// 卡片容器类型枚举
export enum CardContainerType {
  EDITOR = "editor", // 编辑器类容器
  COLLECTION = "collection", // 卡片集合类容器
}

// 集合卡片的排列样式
export enum CollectionLayoutStyle {
  VERTICAL = "vertical", // 上下排列
  HORIZONTAL = "horizontal", // 左右排列
  ADAPTIVE = "adaptive", // 自适应排列
}

// 卡片属性接口
export interface CardProperty {
  name: string;
  value: string;
}

// 基础卡片接口
export interface BaseCardProps {
  id: string;
  title: string;
  content?: string;
  tag?: string; // 标签，用于接口添加时的归类
  type?: string; // 卡片类型，比如"角色"、"大纲"、"分卷"等
  isCollapsed: boolean;
  isVisible?: boolean; // 是否在容器中可见
  hideTitle?: boolean; // 是否隐藏标题部分
  containerType: CardContainerType; // 容器类型
  childCards?: BaseCardProps[]; // 子卡片（仅当containerType为COLLECTION时有效）
  layoutStyle?: CollectionLayoutStyle; // 集合卡片的排列样式
  relatedItem?: {
    // 关联项，比如关联章节、关联分卷等
    id: string;
    title: string;
    type: string; // 关联项类型，如"chapter", "volume"等
    isExternal?: boolean;
  };
  parent?: string; // 父卡片的ID
  props?: CardProperty[]; // 卡片的属性列表
  createdAt?: Date;
  updatedAt?: Date;
  showEditButton?: boolean; // 是否显示编辑按钮
  showAddButton?: boolean; // 是否显示添加按钮
  showDeleteButton?: boolean; // 是否显示删除按钮
  showRelateButton?: boolean; // 是否显示关联按钮
  showLayoutStyleButton?: boolean; // 是否显示样式按钮
}

// 按钮配置接口
export interface CardButtonsConfig {
  showEditButton?: boolean;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  showRelateButton?: boolean;
  showLayoutStyleButton?: boolean;
}

// 卡片组件Props
export interface CardComponentProps {
  card: BaseCardProps;
  onUpdate: (id: string, updates: Partial<BaseCardProps>) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (
    parentId: string,
    containerType: CardContainerType,
    title?: string,
    hideTitle?: boolean,
    props?: CardProperty[],
  ) => void;
  onRelate?: (id: string) => void;
  onUnrelate?: (id: string) => void;
  onEditContent?: (id: string, content: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
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
  buttonsConfig?: CardButtonsConfig;
  attributeOptions?: Array<{ value: string; label: string }>; // 添加属性选项
  availableRelateItems?: Array<{ id: string; title: string; type: string }>; // 可关联的项目
  parentId?: string;
}

// 卡片系统Props
export interface CardSystemProps {
  cards: BaseCardProps[];
  title: string;
  onAddCard: (containerType: CardContainerType, title?: string, hideTitle?: boolean, props?: CardProperty[]) => void;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: (
    parentId: string,
    containerType: CardContainerType,
    title?: string,
    hideTitle?: boolean,
    props?: CardProperty[],
  ) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  moveCard?: (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => void;
  renderCard?: (card: BaseCardProps, index: number) => ReactNode;
  renderChildCard?: (card: BaseCardProps, index: number) => ReactNode;
  renderCustomContent?: (
    card: BaseCardProps,
    isEditingContent: boolean,
    setIsEditingContent: (value: boolean) => void,
    handleContentChange: (value: string) => void,
  ) => ReactNode;
  buttonsConfig?: CardButtonsConfig;
  isMobile?: boolean;
  addButtonText?: string;
  attributeOptions?: Array<{ value: string; label: string }>; // 添加属性选项
  availableRelateItems?: Array<{ id: string; title: string; type: string }>; // 可关联的项目
  defaultCollapsed?: boolean; // 新创建的卡片是否默认折叠
}

// 添加卡片对话框属性
export interface AddCardDialogProps {
  open: boolean;
  onClose: () => void;
  onAddEditorCard: (title?: string, hideTitle?: boolean, props?: CardProperty[]) => void;
  onAddCollectionCard: (title?: string, props?: CardProperty[]) => void;
  defaultTitle?: string;
  parentTag?: string; // 父卡片的标签
  parentProps?: CardProperty[]; // 父卡片的属性
  attributeOptions?: Array<{ value: string; label: string }>; // 可用的属性选项
}

// 关联项对话框属性
export interface RelateDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (itemId: string, itemTitle: string, itemType: string) => void;
  availableItems?: Array<{ id: string; title: string; type: string }>;
}

// 布局样式选择对话框属性
export interface LayoutStyleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (style: CollectionLayoutStyle) => void;
  currentStyle?: CollectionLayoutStyle;
}

// 卡片工厂接口，用于创建卡片
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
