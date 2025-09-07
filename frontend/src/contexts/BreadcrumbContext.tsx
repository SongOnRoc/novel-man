"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useCallback,
} from "react";

// 1. 定义状态和Action的类型
type BreadcrumbState = {
  breadcrumbs: Record<string, string>;
};

type Action = { type: 'SET_BREADCRUMB'; payload: { key: string; value: string } };

// 2. 定义上下文提供的值的类型
interface BreadcrumbContextProps {
  state: BreadcrumbState;
  setBreadcrumb: (key: string, value: string) => void;
}

// 3. 创建上下文，并设置一个默认值以避免类型错误
const BreadcrumbContext = createContext<BreadcrumbContextProps | undefined>(undefined);

// 4. 创建Reducer函数
const breadcrumbReducer = (state: BreadcrumbState, action: Action): BreadcrumbState => {
  switch (action.type) {
    case 'SET_BREADCRUMB':
      return {
        ...state,
        breadcrumbs: {
          ...state.breadcrumbs,
          [action.payload.key]: action.payload.value,
        },
      };
    default:
      return state;
  }
};

// 5. 创建Provider组件
export const BreadcrumbProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(breadcrumbReducer, { breadcrumbs: {} });

  const setBreadcrumb = useCallback(
    (key: string, value: string) => {
      dispatch({ type: "SET_BREADCRUMB", payload: { key, value } });
    },
    [dispatch]
  );

  return (
    <BreadcrumbContext.Provider value={{ state, setBreadcrumb }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

// 6. 创建自定义Hook以方便使用
export const useBreadcrumb = (): BreadcrumbContextProps => {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};