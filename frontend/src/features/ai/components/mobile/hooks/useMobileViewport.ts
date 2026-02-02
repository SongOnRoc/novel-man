'use client';

import { useState, useEffect, useCallback } from 'react';

interface ViewportDimensions {
  /** Current viewport height in pixels */
  height: number;
  /** Current viewport width in pixels */
  width: number;
  /** Whether the virtual keyboard is currently visible */
  isKeyboardVisible: boolean;
  /** Keyboard height when visible (0 when hidden) */
  keyboardHeight: number;
  /** Safe area inset bottom (for devices with home indicator/notch) */
  safeAreaBottom: number;
}

/**
 * Hook for handling dynamic viewport height on mobile devices.
 * 
 * Addresses iOS Safari100vh issues by using visualViewport API
 * and CSS dvh units fallback. Also detects virtual keyboard state.
 * 
 * @returns ViewportDimensions object with reactive viewport measurements
 */
export function useMobileViewport(): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    isKeyboardVisible: false,
    keyboardHeight: 0,
    safeAreaBottom: 0,
  }));

  const updateDimensions = useCallback(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    
    // Use visualViewport API if available (better for keyboard detection)
    const currentHeight = visualViewport?.height ?? window.innerHeight;
    const currentWidth = visualViewport?.width ?? window.innerWidth;
    const fullHeight = window.innerHeight;
    
    // Keyboard is considered visible if viewport height is significantly smaller than window height
    // Threshold of 150px accounts for small address bar changes
    const heightDifference = fullHeight - currentHeight;
    const isKeyboardVisible = heightDifference > 150;
    const keyboardHeight = isKeyboardVisible ? heightDifference : 0;

    // Get safe area inset from CSS environment variable
    const safeAreaBottom = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0',
      10
    ) || getSafeAreaInsetFromEnv();

    setDimensions({
      height: currentHeight,
      width: currentWidth,
      isKeyboardVisible,
      keyboardHeight,
      safeAreaBottom,
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set CSS custom property for viewport height (fallback for dvh)
    const updateCssVh = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--mobile-vh', `${vh * 0.01}px`);
    };

    // Initial update
    updateDimensions();
    updateCssVh();

    // Set up safe area CSS custom property
    setupSafeAreaProperty();

    // Listen to visualViewport events if available
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateDimensions);
      visualViewport.addEventListener('resize', updateCssVh);
      visualViewport.addEventListener('scroll', updateDimensions);
    }

    // Fallback to window resize for browsers without visualViewport
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('resize', updateCssVh);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateDimensions);
        visualViewport.removeEventListener('resize', updateCssVh);
        visualViewport.removeEventListener('scroll', updateDimensions);
      }
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('resize', updateCssVh);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, [updateDimensions]);

  return dimensions;
}

/**
 * Gets safe area inset bottom from CSS environment variable
 */
function getSafeAreaInsetFromEnv(): number {
  if (typeof document === 'undefined') return 0;
  
  // Create a temporary element to measure the env() value
  const testEl = document.createElement('div');
  testEl.style.cssText = 'position:fixed;bottom:0;height:env(safe-area-inset-bottom,0px);pointer-events:none;visibility:hidden;';
  document.body.appendChild(testEl);
  const height = testEl.offsetHeight;
  document.body.removeChild(testEl);
  
  return height;
}

/**
 * Sets up CSS custom property for safe area inset
 */
function setupSafeAreaProperty(): void {
  if (typeof document === 'undefined') return;
  
  const safeArea = getSafeAreaInsetFromEnv();
  document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeArea}px`);
}

export default useMobileViewport;