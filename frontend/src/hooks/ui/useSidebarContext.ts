"use client";

import { createContext, useContext } from "react";

interface SidebarContextType {
  closeSheet?: () => void;
}

export const SidebarContext = createContext<SidebarContextType>({});

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};
