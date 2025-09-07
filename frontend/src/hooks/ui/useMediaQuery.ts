"use client";

import { useMediaQuery as useResponsive } from "react-responsive";

export const useMediaQuery = (query: string) => {
  return useResponsive({ query });
};