import { useEffect, useMemo, useState } from "react";
import {
  getDeviceOrientation,
  getDevicePixelRatio,
  getDeviceType,
  getSafeAreaInsets,
  isAndroidDevice,
  isIOSDevice,
  isPWA,
  isTouchDevice,
} from "../utils/mobile-utils";

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  deviceType: "mobile" | "tablet" | "desktop";
  windowWidth: number;
  windowHeight: number;
  isIOS: boolean;
  isAndroid: boolean;
  orientation: "portrait" | "landscape";
  devicePixelRatio: number;
  isPWA: boolean;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * 响应式钩子，用于在组件中处理移动端适配
 * @returns 响应式状态对象
 */
export const useResponsive = (): ResponsiveState => {
  // 初始状态
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    deviceType: "desktop",
    windowWidth: typeof window !== "undefined" ? window.innerWidth : 1200,
    windowHeight: typeof window !== "undefined" ? window.innerHeight : 800,
    isIOS: false,
    isAndroid: false,
    orientation: "portrait",
    devicePixelRatio: 1,
    isPWA: false,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  useEffect(() => {
    // 初始化状态
    const updateState = () => {
      const deviceType = getDeviceType();
      const width = window.innerWidth;
      const height = window.innerHeight;
      const orientation = getDeviceOrientation();
      const isIOS = isIOSDevice();
      const isAndroid = isAndroidDevice();
      const pixelRatio = getDevicePixelRatio();
      const pwaMode = isPWA();
      const safeArea = getSafeAreaInsets();

      setState({
        isMobile: deviceType === "mobile",
        isTablet: deviceType === "tablet",
        isDesktop: deviceType === "desktop",
        isTouchDevice: isTouchDevice(),
        deviceType,
        windowWidth: width,
        windowHeight: height,
        isIOS,
        isAndroid,
        orientation,
        devicePixelRatio: pixelRatio,
        isPWA: pwaMode,
        safeAreaInsets: safeArea,
      });
    };

    // 首次渲染时更新状态
    updateState();

    // 监听窗口大小变化
    const handleResize = () => {
      updateState();
    };

    // 添加事件监听
    window.addEventListener("resize", handleResize);

    // 监听设备方向变化（移动设备特有）
    window.addEventListener("orientationchange", handleResize);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return state;
};

/**
 * 获取响应式样式
 * @param mobileStyles 移动端样式
 * @param tabletStyles 平板样式
 * @param desktopStyles 桌面端样式
 * @returns 根据当前设备类型返回对应的样式
 */
export const getResponsiveStyles = <T extends Record<string, unknown>>(
  mobileStyles: T,
  tabletStyles: T = {} as T,
  desktopStyles: T = {} as T,
): T => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return mobileStyles;
    case "tablet":
      return { ...mobileStyles, ...tabletStyles };
    default:
      return { ...mobileStyles, ...tabletStyles, ...desktopStyles };
  }
};

/**
 * 获取基于屏幕宽度的响应式值
 * @param mobileValue 移动端值
 * @param tabletValue 平板值
 * @param desktopValue 桌面端值
 * @returns 根据当前设备类型返回对应的值
 */
export const getResponsiveValue = <T>(
  mobileValue: T,
  tabletValue: T = mobileValue,
  desktopValue: T = tabletValue,
): T => {
  const deviceType = getDeviceType();

  switch (deviceType) {
    case "mobile":
      return mobileValue;
    case "tablet":
      return tabletValue;
    default:
      return desktopValue;
  }
};

/**
 * 响应式布局钩子
 * @param breakpoints 断点配置，默认为 { mobile: 480, tablet: 1024 }
 * @returns 响应式布局状态
 */
export const useResponsiveLayout = (
  breakpoints = { mobile: 480, tablet: 1024 },
): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: "mobile" | "tablet" | "desktop";
} => {
  const { windowWidth } = useResponsive();

  return useMemo(() => {
    const isMobile = windowWidth <= breakpoints.mobile;
    const isTablet = windowWidth > breakpoints.mobile && windowWidth <= breakpoints.tablet;
    const isDesktop = windowWidth > breakpoints.tablet;

    let currentBreakpoint: "mobile" | "tablet" | "desktop" = "desktop";
    if (isMobile) currentBreakpoint = "mobile";
    else if (isTablet) currentBreakpoint = "tablet";

    return {
      isMobile,
      isTablet,
      isDesktop,
      currentBreakpoint,
    };
  }, [windowWidth, breakpoints.mobile, breakpoints.tablet]);
};
