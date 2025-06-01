/**
 * 定义系统中使用的z-index常量，确保组件层级关系正确
 */
export const Z_INDEX = {
  // 基础层级
  BASE: 1,

  // 卡片相关层级
  CARD_NORMAL: 1,
  CARD_HOVER: 5,
  CARD_DRAGGING: 10,

  // 容器相关层级
  CONTAINER: 2,
  CONTAINER_HOVER: 3,

  // 对话框层级 - 始终在最上层
  DIALOG: 9999,

  // 提示和通知层级
  TOOLTIP: 8000,
  NOTIFICATION: 8500,
};
