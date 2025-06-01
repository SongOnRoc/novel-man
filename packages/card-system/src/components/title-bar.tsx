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
  onToggleVisibility?: (id: string) => void;
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
  onOpenAddDialog,
  onToggleVisibility,
}: TitleBarProps) {
  const config = buttonsConfig || {
    showEditButton: true,
    showAddButton: true,
    showDeleteButton: true,
    showRelateButton: false,
    showLayoutStyleButton: false,
    showVisibilityButton: false,
  };

  const showEditButton = card.showEditButton ?? config.showEditButton;
  const showAddButton = card.showAddButton ?? config.showAddButton;
  const showDeleteButton = card.showDeleteButton ?? config.showDeleteButton;
  const showRelateButton = card.showRelateButton ?? config.showRelateButton;
  const showLayoutStyleButton = card.showLayoutStyleButton ?? config.showLayoutStyleButton;
  const showVisibilityButton = card.showVisibilityButton ?? config.showVisibilityButton;

  const {
    handleAddButtonClick,
    handleEditButtonClick,
    handleDeleteButtonClick,
    handleRelateItem,
    handleUnrelateItem,
    handleLayoutStyleConfirm,
  } = useCardActions(card, {
    onAddCard: (containerType, options) => onAddButtonClick(),
    onUpdateCard: (id, updates) => {
      // 如果是更新折叠状态，调用onToggleCollapse
      if (updates.isCollapsed !== undefined) {
        onToggleCollapse();
      } else {
        // 否则调用onTitleEdit
        onTitleEdit();
      }
    },
    onDeleteCard,
    onRelateCard: onRelateItem,
    onUnrelateCard: onUnrelateItem,
    onChangeLayoutStyle: onLayoutStyleChange ? (id, style) => onLayoutStyleChange(style) : undefined,
  });

  // 标题栏样式
  const titleBarStyle = {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 10px", // 减小内边距
    backgroundColor: "#f3f4f6",
    border: "1px solid #ccc",
    width: "100%",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    boxSizing: "border-box" as const,
    minHeight: "32px", // 确保标题栏有足够的高度
  };

  // 左侧区域样式
  const leftSideStyle = {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    minWidth: 0,
    flexShrink: 1,
    flexWrap: "nowrap" as const,
    overflow: "hidden",
  };

  // 右侧区域样式
  const rightSideStyle = {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "6px", // 减小按钮之间的间距
    flexShrink: 0,
    marginLeft: "10px",
    flexWrap: "nowrap" as const,
  };

  // 按钮基础样式
  const buttonStyle = {
    padding: "2px", // 减小按钮内边距
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "18px", // 固定按钮宽度
    height: "18px", // 固定按钮高度
  };

  // 标题文本样式
  const titleTextStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    minWidth: 0,
  };

  return (
    <div style={titleBarStyle}>
      {/* 左侧区域 - 折叠按钮和标题 */}
      <div style={leftSideStyle}>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{ ...buttonStyle, marginRight: "8px", color: "#6b7280" }}
          aria-label={card.isCollapsed ? "展开卡片" : "折叠卡片"}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <title>{card.isCollapsed ? "展开卡片" : "折叠卡片"}</title>
            {card.isCollapsed ? (
              <path d="M5.25 4.5l5.5 3.5-5.5 3.5V4.5z" />
            ) : (
              <path d="M4.5 5.25l3.5 5.5 3.5-5.5H4.5z" />
            )}
          </svg>
        </button>

        {card.relatedItem ? (
          <button
            type="button"
            onClick={() => console.log(`跳转到关联内容: ${card.relatedItem?.id}`)}
            style={{ ...buttonStyle, ...titleTextStyle, color: "#3b82f6" }}
          >
            {card.title}
          </button>
        ) : (
          <span style={titleTextStyle}>{card.title}</span>
        )}
      </div>

      {/* 右侧区域 - 功能按钮 */}
      <div style={rightSideStyle}>
        {showEditButton && (
          <button
            type="button"
            onClick={handleEditButtonClick}
            style={{ ...buttonStyle, color: "#6b7280" }}
            aria-label="编辑标题"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>编辑标题</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {showAddButton && isCollectionCard && (
          <button
            type="button"
            onClick={onAddButtonClick}
            style={{ ...buttonStyle, color: "#6b7280" }}
            aria-label="添加子卡片"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>添加子卡片</title>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        {showDeleteButton && onDeleteCard && (
          <button
            type="button"
            onClick={handleDeleteButtonClick}
            style={{ ...buttonStyle, color: "#6b7280" }}
            aria-label="删除卡片"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>删除卡片</title>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}

        {showRelateButton && isEditorCard && (
          <>
            {card.relatedItem ? (
              <button
                type="button"
                onClick={handleUnrelateItem}
                style={{ ...buttonStyle, color: "#3b82f6" }}
                aria-label="解除关联"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <title>解除关联</title>
                  <path d="M15 7h2a5 5 0 0 1 0 10h-2m-6 0H7A5 5 0 0 1 7 7h2" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRelateItem}
                style={{ ...buttonStyle, color: "#6b7280" }}
                aria-label="关联内容"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <title>关联内容</title>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            )}
          </>
        )}

        {showLayoutStyleButton && isCollectionCard && onLayoutStyleChange && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // 通知父组件打开布局样式对话框
              onLayoutStyleChange(CollectionLayoutStyle.ADAPTIVE);
            }}
            style={{ ...buttonStyle, color: "#6b7280" }}
            aria-label="更改布局样式"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>更改布局样式</title>
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        )}

        {showVisibilityButton && isCollectionCard && onToggleVisibility && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(card.id);
            }}
            style={{ ...buttonStyle, color: "#6b7280" }}
            aria-label="切换可见性"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <title>切换可见性</title>
              <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z" />
              <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
