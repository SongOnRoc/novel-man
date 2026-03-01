/**
 * @file useSelectedPromptStore
 * @description Zustand store for managing selected prompt ID across components
 */

import { create } from 'zustand';

interface SelectedPromptState {
  /**当前选中的提示词 ID */
  selectedPromptId: number | null;
  /** 设置选中的提示词 ID */
  setSelectedPromptId: (id: number | null) => void;
  /** 清除选中状态 */
  clearSelectedPrompt: () => void;
}

export const useSelectedPromptStore = create<SelectedPromptState>((set) => ({
  selectedPromptId: null,
  setSelectedPromptId: (id) => set({ selectedPromptId: id }),
  clearSelectedPrompt: () => set({ selectedPromptId: null }),
}));

/**
 * 获取当前选中的提示词 ID（非响应式，用于回调）
 */
export const getSelectedPromptId = (): number | null => {
  return useSelectedPromptStore.getState().selectedPromptId;
};

/**
 * 清除选中的提示词
 */
export const clearSelectedPrompt = (): void => {
  useSelectedPromptStore.getState().clearSelectedPrompt();
};

export default useSelectedPromptStore;