"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { ChevronDown, Edit2, Link, Plus, Trash2, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { DraggableCard } from "./draggable-card";

// 卡片类型枚举
export enum CardContainerType {
  EDITOR = "editor", // 编辑器类容器
  COLLECTION = "collection", // 卡片集合类容器
}

// 基础卡片接口
export interface BaseCardProps {
  id: string;
  title: string;
  content?: string;
  tag?: string; // 标签，用于接口添加时的归类
  type?: string; // 卡片类型，比如"角色"、"大纲"、"分卷"等
  isCollapsed: boolean;
  hideTitle?: boolean; // 是否隐藏标题部分
  isTitleFolded?: boolean; // 是否折叠标题栏(弃用，使用isCollapsed实现)
  containerType: CardContainerType; // 容器类型
  childCards?: BaseCardProps[]; // 子卡片（仅当containerType为COLLECTION时有效）
  relatedItem?: {
    // 关联项，比如关联章节、关联分卷等
    id: string;
    title: string;
    type: string; // 关联项类型，如"chapter", "volume"等
    isExternal?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  showEditButton?: boolean; // 是否显示编辑按钮
  showAddButton?: boolean; // 是否显示添加按钮
  showDeleteButton?: boolean; // 是否显示删除按钮
  showRelateButton?: boolean; // 是否显示关联按钮
  showFoldButton?: boolean; // 是否显示折叠按钮(弃用)
}

// 按钮配置接口
export interface CardButtonsConfig {
  showEditButton?: boolean;
  showAddButton?: boolean;
  showDeleteButton?: boolean;
  showRelateButton?: boolean;
}

// 添加卡片对话框属性
interface AddCardDialogProps {
  open: boolean;
  onClose: () => void;
  onAddEditorCard: (title?: string, hideTitle?: boolean) => void;
  onAddCollectionCard: (title?: string) => void;
  defaultTitle?: string;
  parentTag?: string; // 父卡片的标签
  attributeOptions?: Array<{ value: string; label: string }>; // 可用的属性选项
}

// 添加卡片对话框组件
function AddCardDialog({
  open,
  onClose,
  onAddEditorCard,
  onAddCollectionCard,
  defaultTitle = "",
  parentTag,
  attributeOptions = [],
}: AddCardDialogProps) {
  const [cardTitle, setCardTitle] = useState(defaultTitle);
  const [selectedType, setSelectedType] = useState<CardContainerType | null>(null);
  const [hideTitle, setHideTitle] = useState(true); // 默认隐藏标题
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [customTitle, setCustomTitle] = useState("");

  useEffect(() => {
    // 重置对话框状态
    if (open) {
      setCardTitle(defaultTitle);
      setSelectedType(null);
      setHideTitle(true); // 确保每次打开对话框时默认隐藏标题
      setSelectedAttribute("");
      setCustomTitle("");
    }
  }, [open, defaultTitle]);

  const handleTypeSelect = (type: CardContainerType) => {
    setSelectedType(type);
    // 编辑器类型自动设置为隐藏标题
    if (type === CardContainerType.EDITOR) {
      setHideTitle(true);
    }
  };

  const handleConfirm = () => {
    if (selectedType === CardContainerType.EDITOR) {
      // 如果不隐藏标题，使用选择的属性或自定义标题
      if (!hideTitle) {
        if (selectedAttribute) {
          // 从属性选项中选择标题
          const attributeLabel =
            attributeOptions.find((opt) => opt.value === selectedAttribute)?.label || selectedAttribute;
          onAddEditorCard(attributeLabel, hideTitle);
        } else if (customTitle.trim()) {
          // 使用自定义标题
          onAddEditorCard(customTitle.trim(), hideTitle);
        } else {
          // 如果都没有，使用默认标题
          onAddEditorCard("内容卡片", hideTitle);
        }
      } else {
        // 隐藏标题的情况
        onAddEditorCard(undefined, hideTitle);
      }
    } else if (selectedType === CardContainerType.COLLECTION) {
      onAddCollectionCard(cardTitle); // 集合类卡片传递标题
    }
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // 根据父卡片标签决定是否显示属性选择
  const showAttributeSelect =
    selectedType === CardContainerType.EDITOR && !hideTitle && parentTag === "role" && attributeOptions.length > 0;
  // 是否显示自定义标题输入框
  const showCustomTitle =
    selectedType === CardContainerType.EDITOR && !hideTitle && (!showAttributeSelect || !selectedAttribute);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-80 space-y-4">
        <h3 className="text-lg font-medium">选择卡片类型</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleTypeSelect(CardContainerType.EDITOR)}
              onKeyDown={(e) => handleKeyDown(e, () => handleTypeSelect(CardContainerType.EDITOR))}
              className={`w-full text-left p-3 rounded-lg border ${
                selectedType === CardContainerType.EDITOR
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              aria-label="选择编辑器卡片"
            >
              <div className="font-medium">编辑器卡片</div>
              <div className="text-xs text-gray-500 mt-1">用于编辑文本内容</div>
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect(CardContainerType.COLLECTION)}
              onKeyDown={(e) => handleKeyDown(e, () => handleTypeSelect(CardContainerType.COLLECTION))}
              className={`w-full text-left p-3 rounded-lg border ${
                selectedType === CardContainerType.COLLECTION
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              aria-label="选择集合卡片"
            >
              <div className="font-medium">集合卡片</div>
              <div className="text-xs text-gray-500 mt-1">用于添加多个子卡片</div>
            </button>
          </div>

          {selectedType === CardContainerType.EDITOR && (
            <div className="pt-2">
              <label className="flex items-center space-x-2 cursor-pointer" htmlFor="hideTitle">
                <input
                  type="checkbox"
                  id="hideTitle"
                  checked={hideTitle}
                  onChange={(e) => setHideTitle(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">隐藏标题部分</span>
              </label>
            </div>
          )}

          {showAttributeSelect && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="attributeSelect">
                选择标题
              </label>
              <select
                id="attributeSelect"
                value={selectedAttribute}
                onChange={(e) => setSelectedAttribute(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3"
              >
                <option value="">请选择标题</option>
                {attributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showCustomTitle && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="customTitle">
                自定义标题
              </label>
              <Input
                id="customTitle"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="输入卡片标题"
                className="w-full"
              />
            </div>
          )}

          {selectedType === CardContainerType.COLLECTION && (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cardTitle">
                卡片标题
              </label>
              <Input
                id="cardTitle"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder="输入卡片标题"
                className="w-full"
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} onKeyDown={(e) => handleKeyDown(e, onClose)}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            onKeyDown={(e) => handleKeyDown(e, handleConfirm)}
            disabled={selectedType === null || (selectedType === CardContainerType.COLLECTION && !cardTitle.trim())}
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

// 关联项对话框属性
interface RelateDialogProps {
  open: boolean;
  onClose: () => void;
  onRelateItem: (itemId: string, itemTitle: string, itemType: string) => void;
  availableItems?: Array<{ id: string; title: string; type: string }>;
}

// 关联项对话框组件
function RelateDialog({ open, onClose, onRelateItem, availableItems = [] }: RelateDialogProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    // 重置选择状态
    if (open) {
      setSelectedItem(null);
    }
  }, [open]);

  const handleConfirm = () => {
    if (selectedItem) {
      const item = availableItems.find((item) => item.id === selectedItem);
      if (item) {
        onRelateItem(item.id, item.title, item.type);
      }
    }
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-80 space-y-4">
        <h3 className="text-lg font-medium">关联项目</h3>
        <div className="space-y-3">
          {availableItems.length === 0 ? (
            <div className="text-center text-gray-500 py-2">暂无可关联项目</div>
          ) : (
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="relateItemSelect">
                选择关联项
              </label>
              <select
                id="relateItemSelect"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3"
              >
                <option value="">请选择关联项</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.type})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} onKeyDown={(e) => handleKeyDown(e, onClose)}>
            取消
          </Button>
          <Button onClick={handleConfirm} onKeyDown={(e) => handleKeyDown(e, handleConfirm)} disabled={!selectedItem}>
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

// 卡片组件Props
export interface CardComponentProps {
  card: BaseCardProps;
  onUpdate: (id: string, updates: Partial<BaseCardProps>) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => void;
  onRelate?: (id: string) => void;
  onUnrelate?: (id: string) => void;
  onEditContent?: (id: string, content: string) => void;
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

// 基础卡片组件
export function CardComponent({
  card,
  onUpdate,
  onDelete,
  onAddChild,
  onRelate,
  onUnrelate,
  onEditContent,
  index = 0,
  moveCard,
  className = "",
  renderCustomContent,
  renderChildCard,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
  },
  attributeOptions = [],
  availableRelateItems = [],
  parentId,
}: CardComponentProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRelateDialogOpen, setIsRelateDialogOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true); // 新增：控制标题区域显示/隐藏的状态
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // 新增：容器引用

  // 使用用户提供的按钮配置，如果没有则使用默认值
  const showEditButton = card.showEditButton ?? buttonsConfig.showEditButton;
  const showAddButton = card.showAddButton ?? buttonsConfig.showAddButton;
  const showDeleteButton = card.showDeleteButton ?? buttonsConfig.showDeleteButton;
  const showRelateButton = card.showRelateButton ?? buttonsConfig.showRelateButton;

  // 是否为编辑器类型卡片
  const isEditorCard = card.containerType === CardContainerType.EDITOR;

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
    }
  }, [isEditingContent]);

  const handleToggleCollapse = () => {
    onUpdate(card.id, { isCollapsed: !card.isCollapsed });
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(card.id, { title: e.target.value });
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleContentEdit = () => {
    setIsEditingContent(true);
  };

  const handleContentChange = (value: string) => {
    onUpdate(card.id, { content: value });
    if (onEditContent) {
      onEditContent(card.id, value);
    }
  };

  const handleContentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleContentChange(e.target.value);
  };

  const handleContentSave = () => {
    setIsEditingContent(false);
  };

  const handleAddButtonClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleAddEditorCard = useCallback(
    (title?: string, hideTitle = true) => {
      if (onAddChild) {
        // 传递标题和是否隐藏标题
        onAddChild(card.id, CardContainerType.EDITOR, title, hideTitle);
      }
    },
    [card.id, onAddChild],
  );

  const handleAddCollectionCard = useCallback(
    (title?: string) => {
      if (onAddChild) {
        // 集合类卡片需要标题
        onAddChild(card.id, CardContainerType.COLLECTION, title);
      }
    },
    [card.id, onAddChild],
  );

  const handleRelateItem = () => {
    if (onRelate) {
      setIsRelateDialogOpen(true);
    }
  };

  const handleRelateItemConfirm = (itemId: string, itemTitle: string, itemType: string) => {
    if (onRelate) {
      // 先保存当前内容，防止关联时覆盖
      const currentContent = card.content;

      // 更新卡片关联信息
      onUpdate(card.id, {
        relatedItem: {
          id: itemId,
          title: itemTitle,
          type: itemType,
        },
      });

      // 再次确保内容没有被覆盖
      if (currentContent) {
        onUpdate(card.id, { content: currentContent });
      }

      onRelate(card.id);
    }
  };

  const handleUnrelateItem = () => {
    if (onUnrelate) {
      onUnrelate(card.id);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // 渲染卡片标题部分
  const renderCardHeader = () => {
    // 编辑器卡片特殊处理
    if (isEditorCard && card.isCollapsed) {
      // 隐藏标题时的极简按钮
      if (card.hideTitle) {
        return (
          <button
            type="button"
            onClick={handleToggleCollapse}
            onKeyDown={(e) => handleKeyDown(e, handleToggleCollapse)}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-50"
            title="展开卡片"
            tabIndex={0}
            aria-label="展开卡片"
          />
        );
      }

      // 标题折叠时的样式，宽度自适应
      return (
        <button
          type="button"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => handleKeyDown(e, handleToggleCollapse)}
          className="flex items-center justify-center p-2 bg-gray-100 h-[38px]"
          title="展开卡片"
          tabIndex={0}
          aria-label="展开卡片"
        >
          <ChevronDown className="h-5 w-5 -rotate-90" />
          <div className="ml-2 text-sm font-medium truncate">
            {card.title}
            {card.relatedItem && <span className="text-xs text-gray-500 ml-1">({card.relatedItem.title})</span>}
          </div>
        </button>
      );
    }

    // 标题完全隐藏且未折叠时
    if (card.hideTitle && !card.isCollapsed) return null;

    return (
      <div className="flex items-center justify-between p-2 bg-gray-100">
        <button
          type="button"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => handleKeyDown(e, handleToggleCollapse)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
          tabIndex={0}
          aria-label={card.isCollapsed ? "展开卡片" : "折叠卡片"}
        >
          <ChevronDown
            className={`h-5 w-5 flex-shrink-0 transition-transform ${card.isCollapsed ? "-rotate-90" : ""}`}
          />
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <Input
                ref={titleInputRef}
                value={card.title}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === "Enter" && handleTitleSave()}
                className="h-7 text-sm w-full"
                autoFocus
              />
            ) : (
              <div className="font-medium text-sm truncate">
                {card.title}
                {card.type && <span className="text-gray-500 ml-2">({card.type})</span>}
              </div>
            )}
            {card.relatedItem && <div className="text-xs text-gray-500 truncate">关联: {card.relatedItem.title}</div>}
          </div>
        </button>
        <div className="flex items-center gap-1 ml-2">
          {showEditButton && !isEditingTitle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTitleEdit}
              onKeyDown={(e) => handleKeyDown(e, handleTitleEdit)}
              className="h-7 w-7 p-0"
              aria-label="编辑标题"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {showAddButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddButtonClick}
              onKeyDown={(e) => handleKeyDown(e, handleAddButtonClick)}
              className="h-7 w-7 p-0"
              aria-label="添加子卡片"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          {showRelateButton && !card.relatedItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRelateItem}
              onKeyDown={(e) => handleKeyDown(e, handleRelateItem)}
              className="h-7 w-7 p-0"
              aria-label="关联项目"
            >
              <Link className="h-4 w-4" />
            </Button>
          )}
          {showRelateButton && card.relatedItem && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnrelateItem}
              onKeyDown={(e) => handleKeyDown(e, handleUnrelateItem)}
              className="h-7 w-7 p-0 text-orange-500"
              aria-label="解除关联"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(card.id)}
              onKeyDown={(e) => handleKeyDown(e, () => onDelete(card.id))}
              className="text-destructive h-7 w-7 p-0"
              aria-label="删除卡片"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  // 渲染编辑器类容器内容
  const renderEditorContent = () => {
    if (renderCustomContent) {
      return renderCustomContent(card, isEditingContent, setIsEditingContent, handleContentChange);
    }

    const handleDeleteButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) {
        onDelete(card.id);
      }
    };

    const handleKeyboardDelete = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onDelete) {
          onDelete(card.id);
        }
      }
    };

    // 新增：处理编辑器区域的焦点事件
    const handleEditorFocus = () => {
      if (isEditorCard && !card.isCollapsed) {
        setIsHeaderVisible(false);
      }
    };

    // 新增：处理编辑器区域的点击事件
    const handleEditorClick = () => {
      handleContentEdit();
      handleEditorFocus();
    };

    // 新增：处理编辑器区域外的点击事件
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsHeaderVisible(true);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return isEditingContent ? (
      <div className="flex flex-col gap-2">
        <Textarea
          ref={contentTextareaRef}
          value={card.content || ""}
          onChange={handleContentInputChange}
          onBlur={handleContentSave}
          onFocus={handleEditorFocus}
          className="min-h-[100px] text-sm"
          placeholder="输入内容..."
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleContentSave}
            onKeyDown={(e) => handleKeyDown(e, handleContentSave)}
            aria-label="保存内容"
          >
            保存
          </Button>
        </div>
      </div>
    ) : (
      <div className="relative group/editor">
        <button
          type="button"
          className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded min-h-[38px] text-left w-full"
          onClick={handleEditorClick}
          onFocus={handleEditorFocus}
          onKeyDown={(e) => handleKeyDown(e, handleEditorClick)}
          aria-label="编辑内容"
        >
          {card.content || "点击添加内容"}
        </button>
        {showDeleteButton && onDelete && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDeleteButtonClick}
            onKeyDown={handleKeyboardDelete}
            className="absolute top-2 right-2 h-7 p-1 text-destructive opacity-0 group-hover/editor:opacity-100 hover:opacity-100 hover:bg-destructive hover:text-white transition-opacity"
            aria-label="删除内容"
          >
            <Trash2 className="h-4 w-4" />
            <span className="ml-1 text-xs">删除</span>
          </Button>
        )}
      </div>
    );
  };

  // 渲染集合类容器内容
  const renderCollectionContent = () => {
    if (!card.childCards || card.childCards.length === 0) {
      return <div className="text-center text-gray-400 py-4 text-sm">暂无内容，点击"+"按钮添加</div>;
    }

    console.log(`Rendering collection content for card ${card.id}, with ${card.childCards.length} children`);

    return (
      <div className="space-y-2 p-3">
        {card.childCards.map((childCard, childIndex) => {
          console.log(`Mapping child card ${childCard.id} at index ${childIndex}, parentId=${card.id}`);
          return renderChildCard ? (
            renderChildCard(childCard, childIndex)
          ) : (
            <CardComponent
              key={childCard.id}
              card={childCard}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onRelate={onRelate}
              onUnrelate={onUnrelate}
              index={childIndex}
              moveCard={moveCard}
              parentId={card.id}
              buttonsConfig={buttonsConfig}
              className="border rounded-lg bg-white shadow-sm overflow-hidden"
              attributeOptions={attributeOptions}
              availableRelateItems={availableRelateItems}
            />
          );
        })}
      </div>
    );
  };

  // 渲染卡片容器内容
  const renderCardContent = () => {
    // 集合类卡片折叠时不显示内容
    if (card.isCollapsed) {
      // 编辑器卡片折叠时特殊处理，显示在同一行
      if (isEditorCard) {
        const containerClass = "flex-1"; // 占据剩余宽度
        return (
          <div ref={containerRef} className={containerClass}>
            <div className="flex items-start w-full">
              {renderCardHeader()}
              {renderEditorContent()}
            </div>
          </div>
        );
      }
      // 集合类卡片折叠时只显示标题
      return null;
    }

    // 卡片展开时的样式
    const containerClass = "p-3";

    return (
      <div ref={containerRef} className={containerClass}>
        {(isHeaderVisible || !isEditorCard) && renderCardHeader()}
        {isEditorCard ? renderEditorContent() : renderCollectionContent()}
      </div>
    );
  };

  // 使用DraggableCard包装，如果提供了moveCard
  const cardContent = (
    <div ref={containerRef} className={`border rounded-lg overflow-hidden bg-white shadow-sm ${className}`}>
      {card.isCollapsed ? (
        // 折叠状态：编辑器卡片和集合卡片处理不同
        isEditorCard ? (
          <div className="flex items-start w-full">
            {renderCardHeader()}
            {renderEditorContent()}
          </div>
        ) : (
          // 集合卡片折叠时只显示标题
          renderCardHeader()
        )
      ) : (
        // 展开状态
        <>
          {(isHeaderVisible || !isEditorCard) && renderCardHeader()}
          {isEditorCard ? renderEditorContent() : renderCollectionContent()}
        </>
      )}

      <AddCardDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddEditorCard={(title, hideTitle) => {
          if (onAddChild) {
            onAddChild(card.id, CardContainerType.EDITOR, title, hideTitle);
          }
          setIsAddDialogOpen(false);
        }}
        onAddCollectionCard={(title) => {
          if (onAddChild) {
            onAddChild(card.id, CardContainerType.COLLECTION, title);
          }
          setIsAddDialogOpen(false);
        }}
        parentTag={card.tag}
        attributeOptions={attributeOptions}
      />

      <RelateDialog
        open={isRelateDialogOpen}
        onClose={() => setIsRelateDialogOpen(false)}
        onRelateItem={handleRelateItemConfirm}
        availableItems={availableRelateItems}
      />
    </div>
  );

  if (moveCard && typeof index === "number") {
    return (
      <DraggableCard id={card.id} index={index} moveCard={moveCard} parentId={parentId}>
        {cardContent}
      </DraggableCard>
    );
  }

  return cardContent;
}

// 卡片系统Props
export interface CardSystemProps {
  cards: BaseCardProps[];
  title: string;
  onAddCard: (containerType: CardContainerType, title?: string, hideTitle?: boolean) => void;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
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
}

// 卡片系统组件
export function CardSystem({
  cards,
  title,
  onAddCard,
  onUpdateCard,
  onDeleteCard,
  onAddChildCard,
  onRelateCard,
  onUnrelateCard,
  moveCard,
  renderCard,
  renderChildCard,
  renderCustomContent,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
  },
  isMobile = false,
  addButtonText = "添加",
  attributeOptions = [],
  availableRelateItems = [],
}: CardSystemProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const buttonClass = "flex items-center gap-1 text-xs sm:text-sm";

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  // 增强版的移动卡片处理函数，支持跨容器拖拽
  const handleMoveCard = (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
    console.log("CardSystem handleMoveCard called:", { dragIndex, hoverIndex, dragParentId, hoverParentId });

    // 确保 dragParentId 和 hoverParentId 有值
    const sourcePid = dragParentId || "root";
    const targetPid = hoverParentId || "root";

    console.log(`Moving card from ${sourcePid} to ${targetPid}, from index ${dragIndex} to ${hoverIndex}`);

    if (moveCard) {
      moveCard(dragIndex, hoverIndex, sourcePid, targetPid);
    } else {
      console.warn("No moveCard function provided to CardSystem");
    }
  };

  return (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? { enableMouseEvents: true } : undefined}
    >
      <div className="space-y-4 max-w-full">
        <div className="flex flex-wrap justify-between items-center gap-2 px-4 sm:px-0">
          <h3 className="text-lg font-medium">{title}</h3>
          <Button
            size={isMobile ? "sm" : "default"}
            onClick={() => onAddCard(CardContainerType.COLLECTION)}
            onKeyDown={(e) => handleKeyDown(e, () => onAddCard(CardContainerType.COLLECTION))}
            className={buttonClass}
            aria-label={`${addButtonText}`}
          >
            <Plus className="h-4 w-4" />
            {addButtonText}
          </Button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center text-gray-400 py-8 sm:py-12 border rounded-lg mx-4 sm:mx-0">
            暂无内容，点击"{addButtonText}"按钮创建
          </div>
        ) : (
          <div className="grid gap-4 px-4 sm:px-0">
            {cards.map((card, index) => {
              if (!card) return null; // 添加空值检查
              return renderCard ? (
                renderCard(card, index)
              ) : (
                <CardComponent
                  key={card.id}
                  card={card}
                  onUpdate={onUpdateCard}
                  onDelete={onDeleteCard}
                  onAddChild={onAddChildCard}
                  onRelate={onRelateCard}
                  onUnrelate={onUnrelateCard}
                  index={index}
                  moveCard={handleMoveCard}
                  renderCustomContent={renderCustomContent}
                  renderChildCard={renderChildCard}
                  buttonsConfig={buttonsConfig}
                  attributeOptions={attributeOptions}
                  availableRelateItems={availableRelateItems}
                  parentId="root" // 为顶级卡片设置一个特殊的父ID
                  className={`${card.hideTitle ? "no-margin" : ""} ${card.containerType === CardContainerType.COLLECTION ? "collection-card" : ""}`}
                />
              );
            })}
          </div>
        )}

        <AddCardDialog
          open={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddEditorCard={(title, hideTitle) => {
            onAddCard(CardContainerType.EDITOR, title, hideTitle);
            setIsAddDialogOpen(false);
          }}
          onAddCollectionCard={(title) => {
            onAddCard(CardContainerType.COLLECTION, title);
            setIsAddDialogOpen(false);
          }}
          attributeOptions={attributeOptions}
        />
      </div>
    </DndProvider>
  );
}
