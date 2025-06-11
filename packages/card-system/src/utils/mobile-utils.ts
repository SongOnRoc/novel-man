/**
 * 移动端工具函数
 */

/**
 * 检测当前设备是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
export const isMobileDevice = (): boolean => {
  // 检查用户代理
  const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  // 检查屏幕宽度
  const isMobileWidth = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  return mobileRegex.test(userAgent) || isMobileWidth;
};

/**
 * 检测当前设备是否为触摸设备
 * @returns {boolean} 是否为触摸设备
 */
export const isTouchDevice = (): boolean => {
  return typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
};

/**
 * 获取设备类型
 * @returns {string} 设备类型: 'mobile', 'tablet', 或 'desktop'
 */
export const getDeviceType = (): "mobile" | "tablet" | "desktop" => {
  if (typeof window === "undefined") return "desktop"; // 默认为桌面

  const width = window.innerWidth;

  if (width <= 480) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
};

/**
 * 检测是否为iOS设备
 * @returns {boolean} 是否为iOS设备
 */
export const isIOSDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent;
  return /iPhone|iPad|iPod/i.test(userAgent) && !/Windows Phone/i.test(userAgent);
};

/**
 * 检测是否为Android设备
 * @returns {boolean} 是否为Android设备
 */
export const isAndroidDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android/i.test(window.navigator.userAgent);
};

/**
 * 为移动端优化的防抖函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
};

/**
 * 为移动端优化的节流函数
 * @param fn 要执行的函数
 * @param limit 限制时间（毫秒）
 * @returns 节流处理后的函数
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 移动端长按事件处理
 * @param callback 长按触发的回调函数
 * @param duration 长按持续时间（毫秒），默认为500ms
 * @returns 事件处理器对象
 */
export const useLongPress = (
  callback: () => void,
  duration = 500,
): {
  onTouchStart: () => void;
  onTouchEnd: () => void;
  onTouchMove: () => void;
} => {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let isMoving = false;

  const onTouchStart = () => {
    isMoving = false;
    timerId = setTimeout(() => {
      if (!isMoving) {
        callback();
      }
    }, duration);
  };

  const onTouchEnd = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const onTouchMove = () => {
    isMoving = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
  };
};

/**
 * 计算移动端适合的字体大小
 * @param baseSize 基础字体大小
 * @param minSize 最小字体大小
 * @returns 适合当前设备的字体大小
 */
export const getResponsiveFontSize = (baseSize: number, minSize = 12): number => {
  if (typeof window === "undefined") return baseSize;

  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return Math.max(baseSize - 2, minSize);
    case "tablet":
      return Math.max(baseSize - 1, minSize);
    default:
      return baseSize;
  }
};

/**
 * 获取移动端适合的内边距
 * @param basePadding 基础内边距
 * @returns 适合当前设备的内边距
 */
export const getResponsivePadding = (basePadding: number): number => {
  if (typeof window === "undefined") return basePadding;

  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return Math.max(basePadding / 2, 8);
    case "tablet":
      return Math.max(basePadding * 0.75, 10);
    default:
      return basePadding;
  }
};

/**
 * 检测设备方向
 * @returns {'portrait' | 'landscape'} 设备方向
 */
export const getDeviceOrientation = (): "portrait" | "landscape" => {
  if (typeof window === "undefined") return "portrait";
  return window.innerHeight > window.innerWidth ? "portrait" : "landscape";
};

/**
 * 检测是否支持触摸事件
 * @returns {boolean} 是否支持触摸事件
 */
export const hasTouchSupport = (): boolean => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * 获取移动端适合的按钮尺寸
 * @param baseSize 基础尺寸
 * @returns 适合当前设备的按钮尺寸
 */
export const getResponsiveButtonSize = (baseSize: number): number => {
  if (typeof window === "undefined") return baseSize;

  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return Math.max(baseSize * 1.2, 40); // 移动端按钮更大，方便点击
    case "tablet":
      return Math.max(baseSize * 1.1, 36);
    default:
      return baseSize;
  }
};

/**
 * 获取设备像素比
 * @returns {number} 设备像素比
 */
export const getDevicePixelRatio = (): number => {
  if (typeof window === "undefined") return 1;
  return window.devicePixelRatio || 1;
};

/**
 * 添加移动端触摸反馈
 * @param element DOM元素
 * @returns 清理函数
 */
export const addTouchFeedback = (element: HTMLElement): (() => void) => {
  if (!element) return () => {};

  const touchStartHandler = () => {
    element.style.transform = "scale(0.97)";
    element.style.opacity = "0.9";
  };

  const touchEndHandler = () => {
    element.style.transform = "scale(1)";
    element.style.opacity = "1";
  };

  element.addEventListener("touchstart", touchStartHandler);
  element.addEventListener("touchend", touchEndHandler);
  element.addEventListener("touchcancel", touchEndHandler);

  return () => {
    element.removeEventListener("touchstart", touchStartHandler);
    element.removeEventListener("touchend", touchEndHandler);
    element.removeEventListener("touchcancel", touchEndHandler);
  };
};

/**
 * 检测是否为PWA模式
 * @returns {boolean} 是否为PWA模式
 */
export const isPWA = (): boolean => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari on iOS特有属性，需要类型断言
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

/**
 * 获取安全区域内边距
 * @returns {{top: number, right: number, bottom: number, left: number}} 安全区域内边距
 */
export const getSafeAreaInsets = (): { top: number; right: number; bottom: number; left: number } => {
  if (typeof window === "undefined") {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  // 获取CSS变量
  const style = getComputedStyle(document.documentElement);

  return {
    top: Number.parseInt(style.getPropertyValue("--sat") || "0", 10),
    right: Number.parseInt(style.getPropertyValue("--sar") || "0", 10),
    bottom: Number.parseInt(style.getPropertyValue("--sab") || "0", 10),
    left: Number.parseInt(style.getPropertyValue("--sal") || "0", 10),
  };
};
