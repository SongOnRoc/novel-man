import { useCardActions } from "../hooks/useCardActions";
import type { BaseCardProps, CardButtonsConfig } from "../types";

interface TitleBarProps {
  card: BaseCardProps;
  buttonsConfig?: CardButtonsConfig;
  isEditorCard: boolean;
  isCollectionCard: boolean;
  onToggleCollapse: () => void;
  onTitleEdit: () => void; // This triggers the editing mode
  onAddButtonClick: () => void;
  onDeleteCard: ((id: string) => void) | undefined;
  onRelateItem: (id: string) => void;
  onUnrelateItem: (id: string) => void;
  onLayoutStyleChange: (() => void) | undefined; // Changed to simple callback
  onNavigateToRelated?: (id?: string) => void; // 新增：跳转到关联内容
  onOpenAddDialog?: (parentId: string) => void;
  onToggleVisibility?: (id: string) => void;
  isEditingTitle?: boolean; // New prop to indicate if title is being edited
  onTitleInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; // New prop for title input change
  onTitleInputSave?: () => void; // New prop for saving title changes
  isTemporaryVisible?: boolean; // 新增：无头卡片折叠时临时显示标题栏
  hasToggleButton?: boolean; // 新增：是否有标题栏切换按钮
  onUpdateCard?: (id: string, updates: Partial<BaseCardProps>) => void; // 添加更新卡片属性的回调
  onCollapseAllCards?: (id: string) => void; // 新增：一键折叠所有子卡片的回调
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
  onNavigateToRelated, // 添加解构
  onOpenAddDialog,
  onToggleVisibility,
  isEditingTitle,
  onTitleInputChange,
  onTitleInputSave,
  isTemporaryVisible = false, // 默认为false
  hasToggleButton = false, // 默认为false
  onUpdateCard, // 添加解构
  onCollapseAllCards, // 添加解构
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
  // 一键折叠按钮仅在集合类卡片中显示
  const showCollapseAllButton = isCollectionCard && onCollapseAllCards && card.childCards && card.childCards.length > 0;

  const {
    handleAddButtonClick,
    handleEditButtonClick,
    handleDeleteButtonClick,
    handleRelateItem,
    handleUnrelateItem,
    handleLayoutStyleConfirm,
  } = useCardActions(card, {
    onAddCard: (_containerType, _options) => onAddButtonClick(),
    onUpdateCard: (_id, updates) => {
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
    onChangeLayoutStyle: undefined, // Corrected: TitleBar's onLayoutStyleChange is for opening dialog, not applying style here.
  });

  // 获取卡片类型对应的主题颜色
  const getCardThemeColor = () => {
    if (card.themeColor) return card.themeColor;
    return isEditorCard ? "#3b82f6" : "#6366f1";
  };

  // 标题栏样式
  const titleBarStyle = {
    display: "flex",
    flexDirection: "row" as const,
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 18px",
    paddingRight: hasToggleButton ? "40px" : "18px",
    backgroundColor: isTemporaryVisible ? "rgba(249, 250, 251, 0.95)" : "#f8fafc",
    borderBottom: isTemporaryVisible ? "1px dashed #e2e8f0" : "1px solid #e2e8f0",
    width: "100%",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    boxSizing: "border-box" as const,
    minHeight: "48px",
    position: "relative" as React.CSSProperties["position"],
    transition: "all 0.3s ease",
    backdropFilter: "blur(8px)",
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
    paddingLeft: "4px",
  };

  // 右侧区域样式
  const rightSideStyle = {
    display: "flex",
    flexDirection: "row" as const,
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
    marginLeft: "10px",
    flexWrap: "nowrap" as const,
    position: "relative" as React.CSSProperties["position"],
    zIndex: 1,
  };

  // 根据是否有切换按钮动态调整标题栏样式
  const dynamicTitleBarStyle = {
    ...titleBarStyle,
    // 只有当标题栏不是临时显示的情况下才应用额外的右侧内边距
    paddingRight: hasToggleButton && !isTemporaryVisible ? "40px" : "18px",
  };

  // 按钮基础样式
  const buttonStyle = {
    padding: "6px",
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    transition: "all 0.2s ease",
    color: "#64748b",
    ":hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      color: "#334155",
      transform: "translateY(-1px)",
    },
  };

  // 标题文本样式
  const titleTextStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    minWidth: 0,
    fontSize: "15px",
    fontWeight: 600,
    color: "#334155",
    letterSpacing: "-0.01em",
  };

  // 折叠按钮样式
  const collapseButtonStyle = {
    ...buttonStyle,
    marginRight: "10px",
    color: getCardThemeColor(),
    backgroundColor: card.isCollapsed ? `${getCardThemeColor()}15` : "transparent",
    transform: card.isCollapsed ? "rotate(0deg)" : "rotate(180deg)",
    transition: "transform 0.3s ease, background-color 0.2s ease, color 0.2s ease",
  };

  // 在SVG中添加有意义的title内容
  const getLinkIconTitle = () => `链接到${card.relatedItem?.title || "关联内容"}`;

  // 处理一键折叠所有子卡片
  const handleCollapseAllCards = () => {
    if (onCollapseAllCards) {
      onCollapseAllCards(card.id);
    }
  };

  return (
    <div style={dynamicTitleBarStyle}>
      {/* 左侧区域 - 折叠按钮和标题 */}
      <div style={leftSideStyle}>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={collapseButtonStyle}
          aria-label={card.isCollapsed ? "展开卡片" : "折叠卡片"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>{card.isCollapsed ? "展开卡片" : "折叠卡片"}</title>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isEditingTitle && onTitleInputChange && onTitleInputSave ? (
          <input
            type="text"
            value={card.title}
            onChange={onTitleInputChange}
            onBlur={onTitleInputSave}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onTitleInputSave();
              } else if (e.key === "Escape") {
                // Optionally, handle Esc to cancel editing, though onBlur handles saving
                onTitleInputSave(); // For now, Esc also saves
              }
            }}
            style={{
              ...titleTextStyle,
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "6px 10px",
              flexGrow: 1,
              minWidth: "80px",
              outline: "none",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
          />
        ) : card.relatedItem ? (
          <a
            href={`#${card.relatedItem?.id}`}
            onClick={(e) => {
              e.preventDefault();
              // 实际跳转逻辑将在父组件实现
              onNavigateToRelated?.(card.relatedItem?.id);
            }}
            style={{
              ...titleTextStyle,
              color: getCardThemeColor(),
              textDecoration: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "color 0.2s ease",
              padding: "2px 0",
              borderBottom: `1px dashed ${getCardThemeColor()}50`,
            }}
            title={card.relatedItem.title}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>{getLinkIconTitle()}</title>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {card.relatedItem.title}
          </a>
        ) : (
          <span style={titleTextStyle} title={card.title}>
            {card.title}
          </span>
        )}
      </div>

      {/* 右侧区域 - 功能按钮 */}
      <div style={rightSideStyle}>
        {/* 一键折叠所有子卡片按钮 */}
        {showCollapseAllButton && (
          <button
            type="button"
            onClick={handleCollapseAllCards}
            style={{
              ...buttonStyle,
              color: "#64748b",
            }}
            aria-label="折叠所有子卡片"
            className="title-bar-button"
            title="折叠所有子卡片"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>折叠所有子卡片</title>
              <path d="M4 14h6v6M4 10h10v10M20 10h-6V4M20 14h-10V4" />
            </svg>
          </button>
        )}

        {showEditButton && (
          <button
            type="button"
            onClick={handleEditButtonClick}
            style={buttonStyle}
            aria-label="编辑标题"
            className="title-bar-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>编辑标题</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}

        {showAddButton && (
          <button
            type="button"
            onClick={onAddButtonClick}
            style={{
              ...buttonStyle,
              color: getCardThemeColor(),
              backgroundColor: `${getCardThemeColor()}10`,
            }}
            aria-label="添加子卡片"
            className="title-bar-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>添加子卡片</title>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        {showRelateButton && (
          <>
            {card.relatedItem ? (
              <button
                type="button"
                onClick={() => onUnrelateItem(card.id)}
                style={buttonStyle}
                aria-label="解除关联"
                className="title-bar-button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>解除关联</title>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onRelateItem(card.id)}
                style={buttonStyle}
                aria-label="关联内容"
                className="title-bar-button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <title>关联内容</title>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </button>
            )}
          </>
        )}

        {showLayoutStyleButton && onLayoutStyleChange && (
          <button
            type="button"
            onClick={onLayoutStyleChange}
            style={buttonStyle}
            aria-label="布局样式"
            className="title-bar-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>布局样式</title>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </button>
        )}

        {showVisibilityButton && onToggleVisibility && (
          <button
            type="button"
            onClick={() => onToggleVisibility(card.id)}
            style={buttonStyle}
            aria-label={card.isVisible === false ? "显示卡片" : "隐藏卡片"}
            className="title-bar-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>{card.isVisible === false ? "显示卡片" : "隐藏卡片"}</title>
              {card.isVisible === false ? (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              )}
            </svg>
          </button>
        )}

        {showDeleteButton && onDeleteCard && (
          <button
            type="button"
            onClick={() => onDeleteCard(card.id)}
            style={{
              ...buttonStyle,
              color: "#ef4444",
              transition: "all 0.2s ease, transform 0.1s ease",
            }}
            aria-label="删除卡片"
            className="title-bar-button delete-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>删除卡片</title>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* 标题栏切换按钮 - 仅在有切换按钮标记时显示 */}
      {hasToggleButton && !isTemporaryVisible && onUpdateCard && (
        <button
          type="button"
          onClick={() => onUpdateCard(card.id, { hideTitle: !card.hideTitle })}
          style={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: "rgba(203, 213, 225, 0.5)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            color: "#64748b",
            fontSize: "10px",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
          }}
          aria-label={card.hideTitle ? "显示标题栏" : "隐藏标题栏"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>{card.hideTitle ? "显示标题栏" : "隐藏标题栏"}</title>
            {card.hideTitle ? <polyline points="6 9 12 15 18 9" /> : <polyline points="18 15 12 9 6 15" />}
          </svg>
        </button>
      )}

      {/* 添加CSS样式 */}
      <style>
        {`
          .title-bar-button {
            opacity: 0.7;
            transition: all 0.2s ease;
          }
          .title-bar-button:hover {
            opacity: 1;
            transform: translateY(-1px);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          .delete-button:hover {
            animation: shake 0.5s ease-in-out;
          }
          @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-2px); }
            40% { transform: translateX(2px); }
            60% { transform: translateX(-1px); }
            80% { transform: translateX(1px); }
            100% { transform: translateX(0); }
          }
        `}
      </style>
    </div>
  );
}
