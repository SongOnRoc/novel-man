import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  isMobile?: boolean; // 新增：移动端标志
}

// 添加图标组件
const DeleteIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>删除</title>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const EditIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>编辑</title>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const AddIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>添加</title>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const RelateIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>关联</title>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LayoutIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>布局</title>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const VisibilityIcon = ({ isMobile, isVisible }: { isMobile?: boolean; isVisible?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>{isVisible !== false ? "隐藏" : "显示"}</title>
    {isVisible !== false ? (
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
);

const CollapseIcon = ({ isMobile, isCollapsed }: { isMobile?: boolean; isCollapsed?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    style={{ transform: isCollapsed ? "rotate(0deg)" : "rotate(180deg)" }}
    role="img"
  >
    <title>{isCollapsed ? "展开" : "折叠"}</title>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CollapseAllIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>全部折叠</title>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
  </svg>
);

// 添加更多按钮图标
const MoreIcon = ({ isMobile }: { isMobile?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={isMobile ? "20" : "18"}
    height={isMobile ? "20" : "18"}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isMobile ? "mobile-icon" : ""}
    role="img"
  >
    <title>更多操作</title>
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
    <circle cx="5" cy="12" r="1" />
  </svg>
);

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
  isMobile = false, // 默认为false
}: TitleBarProps) {
  // 添加折叠菜单状态
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // 添加菜单引用
  const buttonRef = useRef<HTMLButtonElement>(null); // 添加按钮引用

  // 添加菜单位置状态
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

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

  // 根据卡片类型确定哪些按钮直接显示，哪些放入更多菜单
  const getButtonVisibility = () => {
    // 非移动端模式下所有按钮都直接显示
    if (!isMobile) {
      return {
        showAddDirectly: showAddButton,
        showEditDirectly: showEditButton,
        showRelateDirectly: showRelateButton,
        showDeleteDirectly: showDeleteButton && !!onDeleteCard,
        hasMoreMenu: false,
      };
    }

    // 移动端模式下的按钮显示逻辑
    if (isCollectionCard) {
      // 容器类卡片：只直接显示添加和删除按钮
      return {
        showAddDirectly: showAddButton,
        showEditDirectly: false,
        showRelateDirectly: false,
        showDeleteDirectly: showDeleteButton && !!onDeleteCard,
        hasMoreMenu: [
          showEditButton,
          showRelateButton,
          showLayoutStyleButton,
          showVisibilityButton,
          showCollapseAllButton,
        ].some(Boolean),
      };
    }

    if (isEditorCard) {
      // 编辑器类卡片：只直接显示关联和删除按钮
      return {
        showAddDirectly: false,
        showEditDirectly: false,
        showRelateDirectly: showRelateButton,
        showDeleteDirectly: showDeleteButton && !!onDeleteCard,
        hasMoreMenu: [showAddButton, showEditButton, showLayoutStyleButton, showVisibilityButton].some(Boolean),
      };
    }

    // 默认卡片：保留添加、编辑和删除按钮
    return {
      showAddDirectly: showAddButton,
      showEditDirectly: showEditButton,
      showRelateDirectly: false,
      showDeleteDirectly: showDeleteButton && !!onDeleteCard,
      hasMoreMenu: [showRelateButton, showLayoutStyleButton, showVisibilityButton, showCollapseAllButton].some(Boolean),
    };
  };

  const buttonVisibility = getButtonVisibility();

  // 计算是否需要显示更多按钮
  const shouldShowMoreButton = isMobile && buttonVisibility.hasMoreMenu;

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

  // 标题文本样式
  const titleTextStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: isMobile ? "15px" : "15px",
    fontWeight: 600,
    color: "#334155",
    letterSpacing: "-0.01em",
    flexShrink: 1,
    flexGrow: 1, // 让标题尽可能占据更多空间
    minWidth: "0",
    maxWidth: "100%",
  };

  // 左侧区域样式
  const leftSideStyle = {
    display: "flex",
    alignItems: "center",
    minWidth: "0",
    flexGrow: 1, // 让左侧区域占据更多空间
    flexShrink: 1,
    overflow: "hidden",
  };

  // 右侧区域样式
  const rightSideStyle = {
    display: "flex",
    alignItems: "center",
    gap: isMobile ? "6px" : "8px",
    flexShrink: 0,
    marginLeft: "auto", // 将按钮推到最右侧
    position: "relative" as const, // 添加定位以支持下拉菜单
  };

  // 标题栏样式
  const titleBarStyle = {
    display: "flex",
    alignItems: "center",
    padding: isMobile ? "10px 14px" : "12px 16px",
    paddingRight: hasToggleButton ? (isMobile ? "36px" : "40px") : isMobile ? "14px" : "16px",
    backgroundColor: isTemporaryVisible ? "rgba(249, 250, 251, 0.95)" : "#f8fafc",
    borderBottom: isTemporaryVisible ? "1px dashed #e2e8f0" : "1px solid #e2e8f0",
    width: "100%",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    boxSizing: "border-box" as const,
    minHeight: isMobile ? "48px" : "48px",
    position: "relative" as React.CSSProperties["position"],
    transition: "all 0.3s ease",
    borderTopLeftRadius: isMobile ? "10px" : "12px",
    borderTopRightRadius: isMobile ? "10px" : "12px",
  };

  // 按钮基础样式
  const buttonStyle = {
    padding: isMobile ? "0" : "0",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: isMobile ? "34px" : "30px",
    height: isMobile ? "34px" : "30px",
    minWidth: isMobile ? "34px" : "30px",
    borderRadius: "6px",
    transition: "background-color 0.2s ease, transform 0.2s ease",
    color: "#64748b",
  };

  // 折叠按钮样式
  const collapseButtonStyle = {
    ...buttonStyle,
    marginRight: isMobile ? "8px" : "10px",
    color: "#6366f1",
  };

  // 更多按钮菜单样式，直接根据showMoreMenu状态控制显示
  const moreMenuStyle = {
    position: "absolute" as const,
    bottom: "calc(100% + 8px)", // 增加距离
    right: "0",
    marginBottom: "4px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)", // 增强阴影
    padding: "6px",
    zIndex: 1000, // 确保在最上层
    minWidth: "160px", // 增加宽度
    display: showMoreMenu ? "flex" : "none",
    flexDirection: "column" as const,
    gap: "4px",
    maxHeight: "60vh", // 限制最大高度
    overflowY: "auto" as const,
    border: "1px solid rgba(226, 232, 240, 0.8)", // 添加边框
  };

  // 菜单项样式
  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#334155",
    fontSize: "14px",
    fontWeight: 500,
    gap: "8px",
    transition: "background-color 0.2s ease",
    backgroundColor: "transparent",
    border: "none",
    width: "100%",
    textAlign: "left" as const,
    minHeight: "40px",
    WebkitTapHighlightColor: "transparent",
  };

  // 菜单项悬停样式
  const menuItemHoverStyle = {
    ...menuItemStyle,
    backgroundColor: "rgba(226, 232, 240, 0.6)",
  };

  // 在SVG中添加有意义的title内容
  const getLinkIconTitle = () => `链接到${card.relatedItem?.title || "关联内容"}`;

  // 处理一键折叠所有子卡片
  const handleCollapseAllCards = () => {
    if (onCollapseAllCards) {
      onCollapseAllCards(card.id);
      setShowMoreMenu(false); // 关闭菜单
    }
  };

  // 切换更多菜单显示状态
  const toggleMoreMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // 阻止默认行为
    console.log("更多按钮被点击", !showMoreMenu);

    // 计算菜单位置
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // 计算菜单位置，确保菜单显示在按钮上方
      setMenuPosition({
        top: rect.top - 200, // 菜单高度约为200px，放在按钮上方
        right: window.innerWidth - rect.right + 5, // 右对齐并略微偏移
      });

      if (!showMoreMenu) {
        buttonRef.current.classList.add("active");
      } else {
        buttonRef.current.classList.remove("active");
      }
    }

    setShowMoreMenu((prevState) => {
      const newState = !prevState;
      console.log("菜单状态更新为:", newState);

      // 如果菜单打开，添加点击外部关闭事件
      if (newState) {
        setTimeout(() => {
          if (menuRef.current) {
            // 强制重绘菜单元素
            menuRef.current.style.opacity = "1";
            // 检查菜单是否超出视窗顶部，如果是则调整位置
            const menuRect = menuRef.current.getBoundingClientRect();
            if (menuRect.top < 10) {
              const newTop = 10; // 距离顶部10px
              menuRef.current.style.top = `${newTop}px`;
            }
          }
        }, 10);
      }

      return newState;
    });
  };

  // 点击文档其他地方关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        showMoreMenu &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        console.log("点击外部区域，关闭菜单");
        closeMoreMenu();
      }
    };

    // 添加菜单关闭的ESC键监听
    const handleEscKey = (event: KeyboardEvent) => {
      if (showMoreMenu && event.key === "Escape") {
        console.log("按下ESC键，关闭菜单");
        closeMoreMenu();
      }
    };

    // 使用捕获阶段确保事件处理优先级
    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside, true);
      document.addEventListener("touchstart", handleClickOutside, true);
      document.addEventListener("keydown", handleEscKey, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleEscKey, true);
    };
  }, [showMoreMenu]);

  // 关闭更多菜单
  const closeMoreMenu = () => {
    console.log("关闭菜单");
    setShowMoreMenu(false);

    // 移除按钮激活状态
    if (buttonRef.current) {
      buttonRef.current.classList.remove("active");
    }
  };

  // 根据是否有切换按钮动态调整标题栏样式
  const dynamicTitleBarStyle = {
    ...titleBarStyle,
    // 只有当标题栏不是临时显示的情况下才应用额外的右侧内边距
    paddingRight: hasToggleButton && !isTemporaryVisible ? (isMobile ? "36px" : "40px") : isMobile ? "14px" : "18px",
  };

  // 添加渲染调试信息
  useEffect(() => {
    console.log("菜单显示状态:", showMoreMenu);
    console.log("菜单样式:", moreMenuStyle);
  }, [showMoreMenu]);

  return (
    <div style={dynamicTitleBarStyle} className={isMobile ? "mobile-title-bar" : ""}>
      {/* 左侧区域 - 折叠按钮和标题 */}
      <div style={leftSideStyle} className="title-left-side">
        <button
          type="button"
          onClick={onToggleCollapse}
          style={collapseButtonStyle}
          aria-label={card.isCollapsed ? "展开卡片" : "折叠卡片"}
          className="title-bar-button collapse-button"
        >
          <CollapseIcon isMobile={isMobile} isCollapsed={card.isCollapsed} />
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
              padding: "4px 8px",
              flexGrow: 1,
              minWidth: "80px",
              outline: "none",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
              fontSize: isMobile ? "14px" : "15px",
              transition: "all 0.2s ease",
            }}
            className="title-text"
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
              gap: "4px",
              transition: "color 0.2s ease",
              padding: "2px 0",
              borderBottom: `1px dashed ${getCardThemeColor()}50`,
            }}
            title={card.relatedItem.title}
            className="title-text"
          >
            <RelateIcon isMobile={isMobile} />
            {card.relatedItem.title}
          </a>
        ) : (
          <span style={titleTextStyle} title={card.title} className="title-text">
            {card.title}
          </span>
        )}
      </div>

      {/* 右侧区域 - 功能按钮 */}
      <div style={rightSideStyle} className="title-bar-buttons">
        {/* 移动端直接显示的按钮 */}
        {buttonVisibility.showAddDirectly && (
          <button
            type="button"
            onClick={onAddButtonClick}
            style={buttonStyle}
            aria-label="添加子卡片"
            className="title-bar-button"
          >
            <AddIcon isMobile={isMobile} />
          </button>
        )}

        {buttonVisibility.showEditDirectly && (
          <button
            type="button"
            onClick={handleEditButtonClick}
            style={buttonStyle}
            aria-label="编辑标题"
            className="title-bar-button"
          >
            <EditIcon isMobile={isMobile} />
          </button>
        )}

        {buttonVisibility.showRelateDirectly && (
          <button
            type="button"
            onClick={() => (card.relatedItem ? onUnrelateItem(card.id) : onRelateItem(card.id))}
            style={buttonStyle}
            aria-label={card.relatedItem ? "解除关联" : "关联内容"}
            className="title-bar-button"
          >
            <RelateIcon isMobile={isMobile} />
          </button>
        )}

        {/* 移动端显示更多按钮 */}
        {shouldShowMoreButton && (
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleMoreMenu}
            style={{
              ...buttonStyle,
              backgroundColor: showMoreMenu ? "rgba(226, 232, 240, 0.6)" : "transparent",
              color: showMoreMenu ? getCardThemeColor() : "#64748b",
            }}
            aria-label="更多操作"
            aria-expanded={showMoreMenu}
            aria-haspopup="true"
            className="title-bar-button more-button"
          >
            <MoreIcon isMobile={isMobile} />
          </button>
        )}

        {/* 使用Portal渲染菜单到body */}
        {shouldShowMoreButton &&
          showMoreMenu &&
          createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
                backgroundColor: "white",
                borderRadius: "8px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
                padding: "8px",
                zIndex: 9999,
                minWidth: "180px",
                maxWidth: "90vw", // 限制最大宽度
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                maxHeight: "60vh",
                overflowY: "auto",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                transform: "translateZ(0)", // 强制硬件加速
                WebkitBackfaceVisibility: "hidden", // 优化移动端渲染
                backfaceVisibility: "hidden",
              }}
              className="more-menu show"
            >
              {/* 菜单项内容不变 */}
              {showAddButton && !buttonVisibility.showAddDirectly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddButtonClick();
                    closeMoreMenu();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <AddIcon isMobile={true} />
                  <span style={{ marginLeft: "8px" }}>添加子卡片</span>
                </button>
              )}

              {showEditButton && !buttonVisibility.showEditDirectly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditButtonClick();
                    closeMoreMenu();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <EditIcon isMobile={true} />
                  <span style={{ marginLeft: "8px" }}>编辑标题</span>
                </button>
              )}

              {showRelateButton && !buttonVisibility.showRelateDirectly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    card.relatedItem ? onUnrelateItem(card.id) : onRelateItem(card.id);
                    closeMoreMenu();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <RelateIcon isMobile={true} />
                  <span style={{ marginLeft: "8px" }}>{card.relatedItem ? "解除关联" : "关联内容"}</span>
                </button>
              )}

              {showLayoutStyleButton && onLayoutStyleChange && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLayoutStyleChange();
                    closeMoreMenu();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <LayoutIcon isMobile={true} />
                  <span style={{ marginLeft: "8px" }}>布局样式</span>
                </button>
              )}

              {showVisibilityButton && onToggleVisibility && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(card.id);
                    closeMoreMenu();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <VisibilityIcon isMobile={true} isVisible={card.isVisible !== false} />
                  <span style={{ marginLeft: "8px" }}>{card.isVisible === false ? "显示卡片" : "隐藏卡片"}</span>
                </button>
              )}

              {showCollapseAllButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCollapseAllCards();
                  }}
                  style={menuItemStyle}
                  className="menu-item"
                >
                  <CollapseAllIcon isMobile={true} />
                  <span style={{ marginLeft: "8px" }}>折叠所有子卡片</span>
                </button>
              )}
            </div>,
            document.body,
          )}

        {/* 非移动端显示所有按钮 */}
        {!isMobile && (
          <>
            {/* 在非移动端模式下，只有当buttonVisibility.showRelateDirectly为false时才显示关联按钮 */}
            {showRelateButton && !buttonVisibility.showRelateDirectly && (
              <>
                {card.relatedItem ? (
                  <button
                    type="button"
                    onClick={() => onUnrelateItem(card.id)}
                    style={buttonStyle}
                    aria-label="解除关联"
                    className="title-bar-button"
                  >
                    <RelateIcon isMobile={isMobile} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRelateItem(card.id)}
                    style={buttonStyle}
                    aria-label="关联内容"
                    className="title-bar-button"
                  >
                    <RelateIcon isMobile={isMobile} />
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
                <LayoutIcon isMobile={isMobile} />
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
                <VisibilityIcon isMobile={isMobile} isVisible={card.isVisible !== false} />
              </button>
            )}

            {showCollapseAllButton && (
              <button
                type="button"
                onClick={handleCollapseAllCards}
                style={buttonStyle}
                aria-label="折叠所有子卡片"
                className="title-bar-button"
                title="折叠所有子卡片"
              >
                <CollapseAllIcon isMobile={isMobile} />
              </button>
            )}
          </>
        )}

        {/* 删除按钮始终显示在最后 */}
        {buttonVisibility.showDeleteDirectly && onDeleteCard && (
          <button
            type="button"
            onClick={() => onDeleteCard(card.id)}
            style={buttonStyle}
            aria-label="删除卡片"
            className="title-bar-button delete-button"
          >
            <DeleteIcon isMobile={isMobile} />
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
            width: isMobile ? "24px" : "24px",
            height: isMobile ? "24px" : "24px",
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
          className="title-toggle-button"
        >
          <svg
            width={isMobile ? "14" : "14"}
            height={isMobile ? "14" : "14"}
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
    </div>
  );
}
