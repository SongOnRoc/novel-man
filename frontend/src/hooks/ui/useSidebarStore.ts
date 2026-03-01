import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  /**
   * 侧边栏是否折叠
   */
  isCollapsed: boolean;
  /**
   * 移动端抽屉是否打开
   */
  isMobileOpen: boolean;
  /**
   * 设置侧边栏折叠状态
   * @param collapsed - 折叠状态
   */
  setIsCollapsed: (collapsed: boolean) => void;
  /**
   * 切换移动端抽屉状态
   */
  toggleMobile: () => void;
}

/**
 * 侧边栏状态管理存储
 * - 使用 Zustand 管理客户端 UI 状态 (符合 systemPatterns.md 要求)
 * - 使用 persist 中间件进行 localStorage 持久化
 * - 技术前瞻性验证 (2025-08-12):
 *   Zustand 是 React 社区主流的轻量级状态管理库，适用于此类 UI 状态管理。
 *   官方文档: https://zustand-demo.pmnd.rs
 */
export const useSidebarStore = create(
  persist<SidebarState>(
    (set) => ({
      isCollapsed: false,
      isMobileOpen: false,
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
    }),
    {
      name: 'sidebar-storage', // localStorage key
    }
  )
);