import { useCallback, useEffect, useRef, useState } from "react";
import { AddCardDialog, LayoutStyleDialog, RelateDialog } from "./dialogs";
import { type BaseCardProps, type CardButtonsConfig, CardContainerType, CollectionLayoutStyle } from "./types";

interface CardComponentProps {
  card: BaseCardProps;
  onUpdateCard: (id: string, updates: Partial<BaseCardProps>) => void;
  onDeleteCard?: (id: string) => void;
  onAddChildCard?: (parentId: string, containerType: CardContainerType, title?: string, hideTitle?: boolean) => void;
  onRelateCard?: (id: string) => void;
  onUnrelateCard?: (id: string) => void;
  onChangeLayoutStyle?: (id: string, style: CollectionLayoutStyle) => void;
  isMobile?: boolean;
  buttonsConfig?: CardButtonsConfig;
  attributeOptions?: Array<{ value: string; label: string }>;
  availableRelateItems?: Array<{ id: string; title: string; type: string }>;
  onOpenAddDialog?: (parentId: string) => void;
}

// 基础卡片组件
export function CardComponent({
  card,
  onUpdateCard,
  onDeleteCard,
  onAddChildCard,
  onRelateCard,
  onUnrelateCard,
  onChangeLayoutStyle,
  isMobile = false,
  buttonsConfig = {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
  },
  attributeOptions = [],
  availableRelateItems = [],
}: CardComponentProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRelateDialogOpen, setIsRelateDialogOpen] = useState(false);
  const [isLayoutStyleDialogOpen, setIsLayoutStyleDialogOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(!card.hideTitle); // 控制标题区域显示/隐藏的状态
  const titleInputRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 使用用户提供的按钮配置，如果没有则使用默认值
  const showEditButton = card.showEditButton ?? buttonsConfig.showEditButton;
  const showAddButton = card.showAddButton ?? buttonsConfig.showAddButton;
  const showDeleteButton = card.showDeleteButton ?? buttonsConfig.showDeleteButton;
  const showRelateButton = card.showRelateButton ?? buttonsConfig.showRelateButton;
  const showLayoutStyleButton = card.showLayoutStyleButton ?? buttonsConfig.showLayoutStyleButton;

  // 是否为编辑器类型卡片
  const isEditorCard = card.containerType === CardContainerType.EDITOR;
  // 是否为集合类型卡片
  const isCollectionCard = card.containerType === CardContainerType.COLLECTION;

  // 在编辑器获取焦点时
  useEffect(() => {
    if (isEditingContent && contentTextareaRef.current) {
      contentTextareaRef.current.focus();
    }
  }, [isEditingContent]);

  // 在标题编辑时获取焦点
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleToggleCollapse = () => {
    onUpdateCard(card.id, { isCollapsed: !card.isCollapsed });
  };

  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateCard(card.id, { title: e.target.value });
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
  };

  const handleContentEdit = () => {
    setIsEditingContent(true);
  };

  const handleContentChange = (value: string) => {
    onUpdateCard(card.id, { content: value });
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

  const handleUnrelateItem = () => {
    if (onUnrelateCard) {
      onUnrelateCard(card.id);
    }
  };

  // 处理布局样式变更
  const handleLayoutStyleChange = () => {
    setIsLayoutStyleDialogOpen(true);
  };

  const handleLayoutStyleConfirm = (style: CollectionLayoutStyle) => {
    if (onChangeLayoutStyle) {
      onChangeLayoutStyle(card.id, style);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      callback();
    }
  };

  const handleAddEditorCard = useCallback(
    (title?: string, hideTitle = true) => {
      if (onAddChildCard) {
        // 传递标题和是否隐藏标题
        onAddChildCard(card.id, CardContainerType.EDITOR, title, hideTitle);

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddChildCard, onUpdateCard],
  );

  const handleAddCollectionCard = useCallback(
    (title?: string) => {
      if (onAddChildCard) {
        // 集合类卡片需要标题
        onAddChildCard(card.id, CardContainerType.COLLECTION, title);

        // 添加卡片后自动展开当前卡片
        if (card.isCollapsed) {
          onUpdateCard(card.id, { isCollapsed: false });
        }
      }
    },
    [card.id, card.isCollapsed, onAddChildCard, onUpdateCard],
  );

  const handleRelateItem = () => {
    if (onRelateCard) {
      setIsRelateDialogOpen(true);
    }
  };

  const handleRelateItemConfirm = (itemId: string, itemTitle: string, itemType: string) => {
    if (onRelateCard) {
      // 先保存当前内容，防止关联时覆盖
      const currentContent = card.content;

      // 更新卡片关联信息
      onUpdateCard(card.id, {
        relatedItem: {
          id: itemId,
          title: itemTitle,
          type: itemType,
        },
      });

      // 再次确保内容没有被覆盖
      if (currentContent) {
        onUpdateCard(card.id, { content: currentContent });
      }

      onRelateCard(card.id);
    }
  };

  // 渲染卡片标题部分
  const renderCardHeader = () => {
    // 编辑器卡片特殊处理
    if (isEditorCard && card.isCollapsed) {
      // 编辑器卡片折叠时只显示折叠图标
      return (
        <button
          type="button"
          onClick={handleToggleCollapse}
          onKeyDown={(e) => handleKeyDown(e, handleToggleCollapse)}
          className="w-6 h-6 flex items-center justify-center hover:bg-gray-50"
          title="展开卡片"
          tabIndex={0}
          aria-label="展开卡片"
        >
          {/* 折叠图标 */}
          <span>▶</span>
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
          data-testid="collapse-button"
        >
          {/* 折叠/展开图标 */}
          <span className={`transition-transform ${card.isCollapsed ? "" : "rotate-90"}`}>▶</span>
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={card.title}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                className="w-full p-0 bg-transparent border-0 focus:outline-none focus:ring-0"
              />
            ) : (
              <div className="truncate">
                {card.relatedItem ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // 这里可以添加跳转到关联内容的逻辑
                      console.log(`跳转到关联内容: ${card.relatedItem?.id}`);
                    }}
                    className="text-blue-500 hover:underline text-left"
                  >
                    {card.title}
                  </button>
                ) : (
                  card.title
                )}
              </div>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1">
          {/* 编辑标题按钮 */}
          {showEditButton && !isEditingTitle && (
            <button
              type="button"
              onClick={handleTitleEdit}
              onKeyDown={(e) => handleKeyDown(e, handleTitleEdit)}
              className="p-1 text-gray-500 hover:text-gray-700"
              aria-label="编辑标题"
              title="编辑标题"
            >
              <span>✏️</span>
            </button>
          )}

          {/* 添加子卡片按钮 */}
          {showAddButton && isCollectionCard && onAddChildCard && (
            <button
              type="button"
              onClick={handleAddButtonClick}
              onKeyDown={(e) => handleKeyDown(e, handleAddButtonClick)}
              className="p-1 text-gray-500 hover:text-gray-700"
              aria-label="添加子卡片"
              title="添加子卡片"
            >
              <span>➕</span>
            </button>
          )}

          {/* 删除卡片按钮 */}
          {showDeleteButton && onDeleteCard && (
            <button
              type="button"
              onClick={() => onDeleteCard(card.id)}
              onKeyDown={(e) => handleKeyDown(e, () => onDeleteCard(card.id))}
              className="p-1 text-gray-500 hover:text-gray-700"
              aria-label="删除卡片"
              title="删除卡片"
            >
              <span>🗑️</span>
            </button>
          )}

          {/* 关联按钮 - 仅在编辑器类卡片中显示 */}
          {showRelateButton && isEditorCard && onRelateCard && (
            <>
              {card.relatedItem ? (
                <button
                  type="button"
                  onClick={handleUnrelateItem}
                  onKeyDown={(e) => handleKeyDown(e, handleUnrelateItem)}
                  className="p-1 text-blue-500 hover:text-blue-700"
                  aria-label="解除关联"
                  title="解除关联"
                >
                  <span>🔗❌</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRelateItem}
                  onKeyDown={(e) => handleKeyDown(e, handleRelateItem)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  aria-label="关联内容"
                  title="关联内容"
                >
                  <span>🔗</span>
                </button>
              )}
            </>
          )}

          {/* 布局样式按钮 - 仅在集合类卡片中显示 */}
          {showLayoutStyleButton && isCollectionCard && onChangeLayoutStyle && (
            <button
              type="button"
              onClick={handleLayoutStyleChange}
              onKeyDown={(e) => handleKeyDown(e, handleLayoutStyleChange)}
              className="p-1 text-gray-500 hover:text-gray-700"
              aria-label="更改布局样式"
              title="更改布局样式"
              data-testid="layout-button"
            >
              <span>📐</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染编辑器类型卡片的内容
  const renderEditorContent = () => {
    // 如果卡片已折叠，不显示内容
    if (card.isCollapsed) return null;

    // 删除按钮处理
    const handleDeleteButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDeleteCard) {
        onDeleteCard(card.id);
      }
    };

    // 键盘删除处理
    const handleKeyboardDelete = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (onDeleteCard) {
          onDeleteCard(card.id);
        }
      }
    };

    // 编辑器获取焦点
    const handleEditorFocus = () => {
      if (!isEditingContent) {
        setIsEditingContent(true);
      }
    };

    // 编辑器点击
    const handleEditorClick = () => {
      if (!isEditingContent) {
        setIsEditingContent(true);
      }
    };

    // 处理点击外部关闭编辑器
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isEditingContent && containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsEditingContent(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isEditingContent]);

    return (
      <div className="p-4" ref={containerRef}>
        {isEditingContent ? (
          <textarea
            ref={contentTextareaRef}
            value={card.content || ""}
            onChange={handleContentInputChange}
            className="w-full p-2 border rounded min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="在此输入内容..."
          />
        ) : (
          <button
            type="button"
            onClick={handleEditorClick}
            className="w-full text-left min-h-[40px] p-2 hover:bg-gray-50 rounded"
          >
            {card.content || "点击添加内容"}
          </button>
        )}
        {showDeleteButton && onDeleteCard && (
          <button
            type="button"
            onClick={handleDeleteButtonClick}
            onKeyDown={handleKeyboardDelete}
            className="mt-2 text-xs text-red-500 hover:underline"
            aria-label="删除卡片"
          >
            删除
          </button>
        )}

        {/* 关联项展示 */}
        {card.relatedItem && (
          <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">关联: </span>
              <span>{card.relatedItem.title}</span>
            </div>
            {onUnrelateCard && (
              <button type="button" onClick={handleUnrelateItem} className="text-xs text-red-500 hover:underline">
                解除关联
              </button>
            )}
          </div>
        )}

        {/* 关联按钮 */}
        {showRelateButton && onRelateCard && !card.relatedItem && (
          <button type="button" onClick={handleRelateItem} className="mt-2 text-xs text-blue-500 hover:underline">
            关联项目
          </button>
        )}
      </div>
    );
  };

  // 渲染集合类型卡片的内容
  const renderCollectionContent = () => {
    if (card.isCollapsed) return null;

    // 根据布局样式设置容器类名
    let layoutClassName = "flex flex-col gap-4 p-2 overflow-y-auto max-h-[500px]"; // 默认垂直布局

    if (card.layoutStyle === "horizontal") {
      layoutClassName = "flex overflow-x-auto gap-4 py-2"; // 水平布局
    } else if (card.layoutStyle === "adaptive") {
      layoutClassName = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-2"; // 自适应布局
    }

    return (
      <div className={`bg-white ${layoutClassName}`}>
        {card.childCards && card.childCards.length > 0 ? (
          card.childCards
            .filter((childCard) => childCard.isVisible !== false)
            .map((childCard) => (
              <div key={childCard.id} className="min-w-[250px]">
                <CardComponent
                  card={childCard}
                  onUpdateCard={onUpdateCard}
                  onDeleteCard={onDeleteCard}
                  onAddChildCard={onAddChildCard}
                  onRelateCard={onRelateCard}
                  onUnrelateCard={onUnrelateCard}
                  onChangeLayoutStyle={onChangeLayoutStyle}
                  isMobile={isMobile}
                  buttonsConfig={buttonsConfig}
                  attributeOptions={attributeOptions}
                  availableRelateItems={availableRelateItems}
                />
              </div>
            ))
        ) : (
          <div className="text-center p-4 text-gray-500">点击"+"按钮添加卡片</div>
        )}
      </div>
    );
  };

  // 根据卡片类型渲染内容
  const renderCardContent = () => {
    if (card.containerType === CardContainerType.EDITOR) {
      return renderEditorContent();
    }
    if (card.containerType === CardContainerType.COLLECTION) {
      return renderCollectionContent();
    }
    return null;
  };

  // 如果卡片被设置为不可见，则不渲染
  if (card.isVisible === false) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden shadow-sm">
      {/* 卡片标题部分 */}
      {isHeaderVisible && renderCardHeader()}

      {/* 卡片内容部分 */}
      {renderCardContent()}

      {/* 添加卡片对话框 */}
      <AddCardDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddEditorCard={handleAddEditorCard}
        onAddCollectionCard={handleAddCollectionCard}
        attributeOptions={attributeOptions}
        parentTag={card.tag}
      />

      {/* 关联项对话框 */}
      <RelateDialog
        open={isRelateDialogOpen}
        onClose={() => setIsRelateDialogOpen(false)}
        onConfirm={handleRelateItemConfirm}
        availableItems={availableRelateItems}
      />

      {/* 布局样式对话框 */}
      <LayoutStyleDialog
        open={isLayoutStyleDialogOpen}
        onClose={() => setIsLayoutStyleDialogOpen(false)}
        onConfirm={handleLayoutStyleConfirm}
        currentStyle={(card.layoutStyle as CollectionLayoutStyle) || CollectionLayoutStyle.VERTICAL}
      />
    </div>
  );
}
