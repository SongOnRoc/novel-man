import { useState, useEffect, useCallback } from "react";

/**
 * A custom React hook to track the scroll position of a specific element.
 * It returns a boolean indicating whether the element has been scrolled past a certain threshold.
 *
 * @param {number} [threshold=10] - The scroll threshold in pixels.
 * The hook will return `true` if the element's `scrollTop` is greater than this value.
 * Defaults to 10.
 *
 * @returns {boolean} `true` if the element is scrolled past the threshold, otherwise `false`.
 *
 * @example
 * // In your component:
 * const isScrolled = useScroll(20);
 *
 * // ...
 *
 * <header className={isScrolled ? "scrolled" : ""}>
 *   ...
 * </header>
 */
export function useScroll(threshold: number = 10): boolean {
  const [scrolled, setScrolled] = useState(false);

  /**
   * Memoized scroll handler.
   * Checks the scroll position of the 'main-content' element and updates the state.
   */
  const handleScroll = useCallback(() => {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      const isScrolled = mainContent.scrollTop > threshold;
      setScrolled(isScrolled);
    }
  }, [threshold]);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      // Add event listener on mount
      mainContent.addEventListener("scroll", handleScroll, { passive: true });

      // Initial check in case the page is already scrolled
      handleScroll();

      // Clean up the event listener on unmount
      return () => {
        mainContent.removeEventListener("scroll", handleScroll);
      };
    }
  }, [handleScroll]);

  return scrolled;
}