"use client";

import { useEffect, useState } from "react";

const DEFAULT_COLLAPSE_OFFSET = 120;

export function useWorkHeaderCollapse(offset = DEFAULT_COLLAPSE_OFFSET): boolean {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const onScroll = (): void => {
      setIsCollapsed(window.scrollY > offset);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [offset]);

  return isCollapsed;
}
