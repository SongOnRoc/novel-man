import type React from "react";
import { CollectionLayoutStyle } from "../types";

// 从 globals.css 迁移的卡片系统变量
export const CARD_SYSTEM_VARS = {
  containerPadding: "0.75rem",
  spacing: "1rem",
  borderColor: "rgba(203, 213, 225, 0.4)",
  shadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  hoverShadow: "0 8px 16px rgba(0, 0, 0, 0.12)",
  draggingShadow: "0 12px 24px rgba(0, 0, 0, 0.18)",
  containerHeight: "400px",
  containerHorizontalHeight: "300px",
  containerAdaptiveHeight: "500px",
  containerGridHeight: "500px",
};

// 卡片基础样式
export const BASE_CARD_STYLES: React.CSSProperties = {
  transition: "all 0.3s ease",
  borderRadius: "16px",
};

// 卡片悬停样式
export const CARD_HOVER_STYLES: React.CSSProperties = {
  boxShadow: "var(--card-hover-shadow)",
  transform: "translateY(-2px)",
};

// 卡片拖拽样式
export const CARD_DRAGGING_STYLES: React.CSSProperties = {
  cursor: "grabbing",
  boxShadow: "var(--card-dragging-shadow)",
};

// 卡片容器内边距
export const CARD_CONTAINER_PADDING: React.CSSProperties = {
  padding: "var(--card-container-padding, 0.75rem)",
};

// 滚动条样式
export const SCROLLBAR_STYLES: React.CSSProperties = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(203, 213, 225, 0.4) transparent",
};

// 布局容器样式
export const LAYOUT_CONTAINER_STYLES: Record<CollectionLayoutStyle, React.CSSProperties> = {
  [CollectionLayoutStyle.VERTICAL]: {
    overflowY: "auto",
    overflowX: "hidden",
    height: "auto",
    maxHeight: "none",
  },
  [CollectionLayoutStyle.HORIZONTAL]: {
    overflowX: "auto",
    overflowY: "hidden",
    whiteSpace: "nowrap",
  },
  [CollectionLayoutStyle.GRID]: {
    overflow: "visible",
  },
  [CollectionLayoutStyle.ADAPTIVE]: {
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
  },
  [CollectionLayoutStyle.LIST]: {
    overflowY: "auto",
    overflowX: "hidden",
    display: "flex",
    flexWrap: "wrap",
    alignContent: "flex-start",
  },
};

// 自适应布局卡片样式
export const ADAPTIVE_CARD_STYLES: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
};

export const ADAPTIVE_CARD_ITEM_STYLES: React.CSSProperties = {
  flex: "0 0 280px",
  marginBottom: "0",
};

/**
 * 动态计算卡片宽度的公共函数
 * 根据容器宽度和布局样式计算卡片宽度
 *
 * 函数功能说明：
 * 1. 仅在水平布局和自适应布局模式下计算容器内卡片宽度，如果不是这两种模式，则返回垂直布局的宽度100%
 * 2. 无论是哪种布局，容器内卡片的最小宽度为350px，容器内同一行在宽度足够时最多显示3个卡片
 * 3. 同一行显示3个卡片时，卡片宽度为容器宽度的30%与350px之间的最大值
 * 4. 同一行只能显示2个卡片式，卡片宽度为容器宽度的45%与350px之间的最大值
 * 5. 同一行只能显示1个卡片时，卡片宽度返回垂直布局的宽度100%
 * 6. 返回卡片宽度的计算结果和卡片数量
 *
 * @param containerElement 容器DOM元素
 * @param layoutStyle 布局样式
 * @returns 计算的卡片宽度和可放置的卡片数量
 */
export const calcCardWidth = (
  containerElement: HTMLElement | null,
  layoutStyle: CollectionLayoutStyle,
): { width: number; cardsCount: number; gapValue: number } => {
  // 默认返回值（垂直布局的宽度0，表示100%宽度，卡片数量为1）
  if (!containerElement) return { width: 0, cardsCount: 1, gapValue: 0 };

  // 只在水平布局或自适应布局下计算
  if (layoutStyle !== CollectionLayoutStyle.HORIZONTAL && layoutStyle !== CollectionLayoutStyle.ADAPTIVE) {
    return { width: 0, cardsCount: 1, gapValue: 0 }; // 返回0表示100%宽度，卡片数量为1
  }

  // 获取计算样式以考虑内边距和滚动条
  const computedStyle = window.getComputedStyle(containerElement);
  const paddingLeft = Number.parseFloat(computedStyle.paddingLeft);
  const paddingRight = Number.parseFloat(computedStyle.paddingRight);
  const gapValue = Number.parseFloat(computedStyle.gap) || 16; // 默认16px

  // 考虑滚动条宽度（大约17px）
  const scrollbarWidth = containerElement.offsetWidth - containerElement.clientWidth;
  const containerWidth = containerElement.clientWidth - paddingLeft - paddingRight - scrollbarWidth;
  const minWidth = 350; // 最小宽度

  // 计算不同比例的宽度
  const thirtyPercent = containerWidth * 0.3; // 3个卡片时使用
  const fortyFivePercent = containerWidth * 0.45; // 2个卡片时使用

  // 先尝试使用30%宽度，看能放几个卡片
  const widthForThree = Math.max(minWidth, thirtyPercent);
  const possibleCardsWithThirtyPercent = Math.floor(containerWidth / widthForThree);

  // 根据可能的卡片数量决定最终宽度
  // 计算实际可容纳的卡片数量（考虑间距）
  const gap = Number.parseFloat(computedStyle.gap) || 16; // 默认16px
  const availableWidth = containerWidth - gap;

  // 计算实际卡片数量（考虑最小宽度和间距）
  let actualCardsCount = Math.min(Math.floor(availableWidth / (minWidth + gap)), 3);

  // 确保至少显示1张卡片
  actualCardsCount = Math.max(actualCardsCount, 1);

  // 根据实际数量计算宽度
  if (actualCardsCount >= 3) {
    return { width: widthForThree, cardsCount: 3, gapValue };
  }
  if (actualCardsCount === 2) {
    return { width: Math.max(minWidth, fortyFivePercent), cardsCount: 2, gapValue };
  }

  // 只能放1个卡片，使用100%宽度
  return { width: containerWidth, cardsCount: 1, gapValue };
};

/**
 * 应用卡片布局样式的函数
 * 根据容器宽度和布局样式计算并返回样式对象
 *
 * 函数功能说明：
 * 1. 根据容器宽度和布局样式计算最佳的卡片展示方式
 * 2. 非水平布局的情况下，在容器宽度不足时如果样式不是垂直布局则自动切换为垂直布局
 * 3. 为水平布局提供特定的样式，包括滚动方向和卡片大小调整
 * 4. 为卡片和容器生成合适的CSS样式对象，包括宽度、溢出处理等
 * 5. 仅在水平布局和自适应布局模式下执行特殊计算
 *
 * @param containerElement 容器DOM元素
 * @param layoutStyle 布局样式
 * @returns 样式对象，包含卡片和容器样式
 */
export const calculateCardStyles = (
  containerElement: HTMLElement | null,
  layoutStyle: CollectionLayoutStyle,
): {
  containerStyles: React.CSSProperties;
  cardItemStyles: React.CSSProperties;
  useVerticalLayout: boolean;
} => {
  // 默认返回值
  const defaultResult = {
    containerStyles: {},
    cardItemStyles: {},
    useVerticalLayout: false,
  };

  if (!containerElement) return defaultResult;

  // 只在水平布局或自适应布局下计算
  if (layoutStyle !== CollectionLayoutStyle.HORIZONTAL && layoutStyle !== CollectionLayoutStyle.ADAPTIVE) {
    return defaultResult;
  }

  // 计算卡片宽度（同时获取间距值）
  const { width, cardsCount, gapValue } = calcCardWidth(containerElement, layoutStyle);
  const useVerticalLayout = cardsCount === 1;

  // 容器和卡片样式对象
  let containerStyles: React.CSSProperties = {};
  let cardItemStyles: React.CSSProperties = {};

  if (useVerticalLayout) {
    // 如果容器宽度不足以放两张卡片，使用垂直布局样式
    cardItemStyles = {
      width: "100%",
      minWidth: "100%",
      flexShrink: "0",
      flexGrow: "1",
    };

    // 如果是水平布局，调整父容器样式以适应垂直排列
    if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
      containerStyles = {
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
      };
    }
  } else {
    // 如果容器宽度足够放两张或更多卡片，使用计算的宽度
    cardItemStyles = {
      width: `${width}px`,
      minWidth: "350px",
      flexShrink: 1, // 允许收缩
      boxSizing: "border-box", // 确保尺寸包含内边距
    };

    // 恢复水平布局样式
    if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
      Object.assign(cardItemStyles, {
        flexShrink: "0",
        flexGrow: "0",
        marginBottom: "0",
      });

      containerStyles = {
        flexDirection: "row",
        overflowX: "auto",
        overflowY: "hidden",
        width: `calc(100% + ${gapValue}px)`, // 补偿间距
        paddingRight: `${gapValue}px`, // 防止内容被截断
      };
    }
  }

  return {
    containerStyles,
    cardItemStyles,
    useVerticalLayout,
  };
};

/**
 * 应用样式到DOM元素
 *
 * 函数功能说明：
 * 1. 将计算好的样式直接应用到DOM元素上，实现即时样式更新
 * 2. 分别处理容器元素和内部卡片元素的样式应用
 * 3. 根据布局样式自动调整容器的滚动方向和卡片的尺寸
 * 4. 支持动态响应容器尺寸变化，自动调整最佳显示效果
 *
 * @param containerElement 容器DOM元素
 * @param layoutStyle 布局样式
 */
export const applyCardStyles = (containerElement: HTMLElement | null, layoutStyle: CollectionLayoutStyle): void => {
  if (!containerElement) return;

  // 计算样式
  const { containerStyles, cardItemStyles } = calculateCardStyles(containerElement, layoutStyle);

  // 应用容器样式
  if (Object.keys(containerStyles).length > 0) {
    Object.entries(containerStyles).forEach(([key, value]) => {
      // @ts-ignore: 动态设置样式属性
      containerElement.style[key] = value;
    });
  }

  // 应用卡片样式
  const cardItems = containerElement.querySelectorAll(".card-container-item");
  cardItems.forEach((item: Element) => {
    if (item instanceof HTMLElement && Object.keys(cardItemStyles).length > 0) {
      Object.entries(cardItemStyles).forEach(([key, value]) => {
        // @ts-ignore: 动态设置样式属性
        item.style[key] = value;
      });
    }
  });
};

/**
 * 根据布局样式获取容器基础样式
 *
 * 函数功能说明： 作用于集合类卡片的容器部分的样式，集合类卡片独有
 * 1. 为不同的布局模式提供专门优化的容器样式，处于同一个容器内的卡片宽度相等，每张卡片只会有一个样式。
 * 2. 垂直布局：容器内的卡片上下排列，固定宽度，卡片数量过多超出容器高度可以在容器内上下滑动查看。
 * 3. 水平布局：固定高度，单列排布，卡片数量过多，超出容器宽度可以横向滑动。
 * 4. 自适应布局：智能换行的网格排布模式，先水平排列宽度不够时自动换行，卡片数量过多，超出容器高度可以上下滑动。
 * 4. 网格布局：保留样式，暂时不额外实现，效果与自适应布局相同
 * 4. 列表布局：保留样式，暂时不额外实现，效果与自适应布局相同
 *
 * @param layoutStyle 布局样式
 * @returns 容器样式对象
 */
export const getContainerStyleByLayout = (layoutStyle: CollectionLayoutStyle): React.CSSProperties => {
  // 基础样式
  const baseStyle: React.CSSProperties = {
    boxSizing: "border-box",
    padding: "0.75rem",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "thin",
    scrollbarColor: "rgba(203, 213, 225, 0.4) transparent",
  };

  // 根据布局样式应用不同的样式
  switch (layoutStyle) {
    case CollectionLayoutStyle.HORIZONTAL:
      // 水平布局：固定高度，单列排布，可横向滑动
      return {
        ...baseStyle,
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        overflow: "auto hidden", // 水平可滚动，垂直隐藏
        maxHeight: "var(--card-container-horizontal-height, 300px)", // 水平布局时高度固定
        scrollSnapType: "x mandatory", // 滚动对齐
      };

    case CollectionLayoutStyle.GRID:
    case CollectionLayoutStyle.LIST:
    // 网格布局和列表布局暂时与自适应布局效果相同
    case CollectionLayoutStyle.ADAPTIVE:
      // 自适应布局：网格排布，先水平排列再换行，可上下滑动
      return {
        ...baseStyle,
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap", // 关键：允许换行
        overflow: "auto", // 允许垂直滚动
        maxHeight: "var(--card-container-adaptive-height, 500px)",
      };

    default:
      // 垂直布局（默认）：卡片上下排列，固定宽度，可上下滑动
      return {
        ...baseStyle,
        display: "flex",
        flexDirection: "column",
        overflow: "auto", // 允许垂直滚动
        maxHeight: "var(--card-container-height, 400px)",
      };
  }
};

/**
 * 获取卡片子容器样式
 * 根据布局样式返回适合的子容器样式
 *
 * @param layoutStyle 布局样式
 * @returns 子容器样式对象
 */
export const getCardChildrenContainerStyle = (layoutStyle: CollectionLayoutStyle): React.CSSProperties => {
  return {
    display: layoutStyle === CollectionLayoutStyle.GRID ? "grid" : "flex",
    gridTemplateColumns:
      layoutStyle === CollectionLayoutStyle.GRID ? "repeat(auto-fill, minmax(280px, 1fr))" : undefined,
    flexDirection:
      layoutStyle === CollectionLayoutStyle.VERTICAL || layoutStyle === CollectionLayoutStyle.LIST ? "column" : "row",
    flexWrap: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "wrap" : "nowrap",
    gap: layoutStyle === CollectionLayoutStyle.LIST ? "8px" : "16px",
    width: "100%",
    boxSizing: "border-box",
    maxWidth: "100%",
    transition: "all 0.3s ease",
    alignItems: "stretch", // 确保卡片宽度一致
    alignContent: layoutStyle === CollectionLayoutStyle.ADAPTIVE ? "flex-start" : "normal", // 自适应布局时从顶部开始排列
  };
};

/**
 * 获取卡片容器边框样式
 * 根据布局类型设置不同的样式
 *
 * @param layoutStyle 布局样式
 * @param isMobile 是否为移动端
 * @returns 容器边框样式对象
 */
export const getContainerBorderStyle = (
  layoutStyle: CollectionLayoutStyle,
  isMobile: boolean,
  containerElement?: HTMLElement | null,
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
  };

  // 计算卡片宽度
  const cardWidthInfo = containerElement ? calcCardWidth(containerElement, layoutStyle) : { width: 0, cardsCount: 1 };

  const width = cardWidthInfo.width;

  // 最小宽度，保证卡片有基本的显示空间
  const minWidth = 280;

  // 根据布局类型设置不同的样式
  if (layoutStyle === CollectionLayoutStyle.HORIZONTAL) {
    return {
      ...baseStyle,
      width: width ? `${width}px` : "350px",
      minWidth: `${minWidth}px`,
      flexShrink: 0,
      scrollSnapAlign: "start",
    };
  }

  if (layoutStyle === CollectionLayoutStyle.ADAPTIVE) {
    return {
      ...baseStyle,
      width: width ? `${width}px` : "350px",
      minWidth: `${minWidth}px`,
      flexShrink: 0,
    };
  }

  // 默认垂直布局
  return {
    ...baseStyle,
    width: "100%",
  };
};

/**
 * 获取编辑器容器样式
 *
 * @param isHeadless 是否为无头卡片
 * @param isMobile 是否为移动端
 * @returns 编辑器容器样式对象
 */
export const getEditorContainerStyle = (isHeadless: boolean, isMobile: boolean): React.CSSProperties => {
  return {
    padding: isMobile ? "12px" : "16px",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: isHeadless ? (isMobile ? "10px" : "12px") : isMobile ? "0 0 10px 10px" : "0 0 16px 16px",
    minHeight: "120px",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    backdropFilter: "blur(8px)",
    cursor: "pointer", // 编辑器类型的卡片默认可点击
    transition: "background-color 0.2s ease",
    maxWidth: "100%", // 确保不超出父容器宽度
    overflow: "hidden", // 防止内容溢出
  };
};

/**
 * 获取文本区域样式
 *
 * @param isMobile 是否为移动端
 * @returns 文本区域样式对象
 */
export const getTextareaStyle = (isMobile: boolean): React.CSSProperties => {
  return {
    width: "100%",
    minHeight: "100px",
    padding: isMobile ? "12px" : "16px",
    border: "1px solid #e2e8f0",
    borderRadius: isMobile ? "8px" : "10px",
    resize: "vertical",
    outline: "none",
    fontSize: isMobile ? "16px" : "15px", // 移动端使用16px避免iOS缩放
    lineHeight: "1.5",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.04)",
    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
    fontFamily: "inherit",
    boxSizing: "border-box",
    maxWidth: "100%",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  };
};

/**
 * 获取空容器样式
 *
 * @returns 空容器样式对象
 */
export const getEmptyContainerStyle = (): React.CSSProperties => {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    color: "#64748b",
    textAlign: "center",
    minHeight: "180px",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "rgba(249, 250, 251, 0.7)",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
    backdropFilter: "blur(4px)",
    boxShadow: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
    maxWidth: "100%",
    overflow: "hidden",
  };
};

/**
 * 获取空容器按钮样式
 *
 * @param themeColor 主题颜色
 * @returns 按钮样式对象
 */
export const getEmptyButtonStyle = (themeColor: string): React.CSSProperties => {
  return {
    marginTop: "20px",
    padding: "8px 16px",
    backgroundColor: themeColor,
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    boxSizing: "border-box",
    maxWidth: "100%",
    overflow: "hidden",
  };
};

/**
 * 获取悬浮标题栏样式
 *
 * @param showTitleBar 是否显示标题栏
 * @param isMobile 是否为移动端
 * @returns 悬浮标题栏样式对象
 */
export const getFloatingTitleBarStyle = (showTitleBar: boolean, isMobile: boolean): React.CSSProperties => {
  return {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    zIndex: showTitleBar ? 10 : -1, // 当隐藏时，将z-index设置为-1，使其位于容器底部
    opacity: showTitleBar ? 1 : 0, // 根据showTitleBar状态决定是否显示
    transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    borderRadius: isMobile ? "10px 10px 0 0" : "12px 12px 0 0",
    pointerEvents: showTitleBar ? "auto" : "none", // 当隐藏时，禁用鼠标事件
  };
};

/**
 * 获取标题栏切换按钮样式
 *
 * @param showTitleBar 是否显示标题栏
 * @param themeColor 主题颜色
 * @param isMobile 是否为移动端
 * @returns 标题栏切换按钮样式对象
 */
export const getTitleBarToggleButtonStyle = (
  showTitleBar: boolean,
  themeColor: string,
  isMobile: boolean,
): React.CSSProperties => {
  return {
    position: "absolute",
    top: isMobile ? "6px" : "8px",
    right: isMobile ? "6px" : "8px",
    width: isMobile ? "32px" : "28px",
    height: isMobile ? "32px" : "28px",
    borderRadius: "50%",
    backgroundColor: showTitleBar ? themeColor : "rgba(255, 255, 255, 0.9)",
    color: showTitleBar ? "white" : "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    zIndex: 15, // 确保按钮始终位于最上层
    transition: "background-color 0.3s ease, transform 0.3s ease",
    transform: showTitleBar ? "rotate(180deg)" : "rotate(0deg)",
    padding: "0",
    outline: "none",
    touchAction: "manipulation", // 优化移动端触摸体验
  };
};

// 统一卡片间距样式
export const getCardSpacingStyle = (): React.CSSProperties => ({
  marginBottom: "var(--card-spacing, 1rem)",
});

// 容器滚动条样式
export const getScrollbarStyles = (): string => `
  .collection-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .collection-container::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .collection-container::-webkit-scrollbar-thumb {
    background-color: rgba(203, 213, 225, 0.4);
    border-radius: 20px;
    border: 3px solid transparent;
  }
  
  .collection-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(203, 213, 225, 0.6);
  }
  
  .horizontal-scroll-container::-webkit-scrollbar {
    height: 6px;
  }
`;
