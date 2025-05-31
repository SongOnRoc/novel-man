import { useCardActions } from "../hooks/useCardActions";
import { CollectionLayoutStyle } from "../types";
import type { BaseCardProps, CardButtonsConfig } from "../types";

interface TitleBarProps {
  card: BaseCardProps;
  buttonsConfig?: CardButtonsConfig;
  isEditorCard: boolean;
  isCollectionCard: boolean;
  onToggleCollapse: () => void;
  onTitleEdit: () => void;
  onAddButtonClick: () => void;
  onDeleteCard: ((id: string) => void) | undefined;
  onRelateItem: () => void;
  onUnrelateItem: () => void;
  onLayoutStyleChange: ((style: CollectionLayoutStyle) => void) | undefined;
  onOpenAddDialog?: (parentId: string) => void;
}

export function TitleBar({
  card,
  buttonsConfig,
  isEditorCard,
  isCollectionCard,
  onToggleCollapse,
  onTitleEdit,
  onAddButtonClick,
  onDeleteCard,
  onRelateItem,
  onUnrelateItem,
  onLayoutStyleChange,
}: TitleBarProps) {
  // 为buttonsConfig提供默认值
  const config = buttonsConfig || {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
  };

  const showEditButton = card.showEditButton ?? config.showEditButton;
  const showAddButton = card.showAddButton ?? config.showAddButton;
  const showDeleteButton = card.showDeleteButton ?? config.showDeleteButton;
  const showRelateButton = card.showRelateButton ?? config.showRelateButton;
  const showLayoutStyleButton = card.showLayoutStyleButton ?? config.showLayoutStyleButton;

  const {
    handleAddButtonClick,
    handleEditButtonClick,
    handleDeleteButtonClick,
    handleRelateItem,
    handleUnrelateItem,
    handleLayoutStyleConfirm,
  } = useCardActions(card, {
    onAddChildCard: onAddButtonClick,
    onUpdateCard: onTitleEdit,
    onDeleteCard,
    onRelateCard: onRelateItem,
    onUnrelateCard: onUnrelateItem,
    onChangeLayoutStyle: onLayoutStyleChange
      ? (id, style) => onLayoutStyleChange(style)
      : undefined,
  });

  return (
    <div className="flex items-center justify-between p-2 bg-gray-100 gap-1">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1 text-gray-500 hover:text-gray-700 group"
          aria-label={card.isCollapsed ? "展开卡片" : "折叠卡片"}
          data-testid="collapse-button"
        >
          <span
            className={`transition-transform ${card.isCollapsed ? "" : "rotate-90"} text-gray-500 group-hover:text-gray-700`}
          >
            ▶
          </span>
        </button>
        
        {card.relatedItem ? (
          <button
            type="button"
            onClick={() => console.log(`跳转到关联内容: ${card.relatedItem?.id}`)}
            className="truncate text-blue-500 hover:underline text-left"
          >
            {card.title}
          </button>
        ) : (
          <span className="truncate">{card.title}</span>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {showEditButton && (
          <button
            type="button"
            onClick={handleEditButtonClick}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="编辑标题"
            title="编辑标题"
          >
            ✏️
          </button>
        )}

        {showAddButton && isCollectionCard && (
          <button
            type="button"
            onClick={onAddButtonClick}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="添加子卡片"
            title="添加子卡片"
          >
            ➕
          </button>
        )}

        {showDeleteButton && onDeleteCard && (
          <button
            type="button"
            onClick={handleDeleteButtonClick}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="删除卡片"
            title="删除卡片"
          >
            🗑️
          </button>
        )}

        {showRelateButton && isEditorCard && (
          <>
            {card.relatedItem ? (
              <button
                type="button"
                onClick={handleUnrelateItem}
                className="p-1 text-blue-500 hover:text-blue-700"
                aria-label="解除关联"
                title="解除关联"
              >
                🔗❌
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRelateItem}
                className="p-1 text-gray-500 hover:text-gray-700"
                aria-label="关联内容"
                title="关联内容"
              >
                🔗
              </button>
            )}
          </>
        )}

        {showLayoutStyleButton && isCollectionCard && onLayoutStyleChange && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLayoutStyleConfirm(CollectionLayoutStyle.ADAPTIVE);
            }}
            className="p-1 text-gray-500 hover:text-gray-700"
            aria-label="更改布局样式"
            title="更改布局样式"
            data-testid="layout-button"
          >
            📐
          </button>
        )}
      </div>
    </div>
  );
}
