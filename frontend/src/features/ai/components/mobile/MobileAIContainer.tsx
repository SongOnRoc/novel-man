'use client';

import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MobileAIFloatingBar } from './MobileAIFloatingBar';
import { MobileAIImmersive } from './MobileAIImmersive';
import { useMobileViewport } from './hooks/useMobileViewport';
import type { EditorTheme } from '@/types/editor';

/** Mobile AI Assistant display modes */
export type MobileAIMode = 'hidden' | 'floating' | 'immersive';

interface MobileAIContainerProps {
  /** Currently selected text from the editor */
  selectedText?: string;
  /** Callback when AI-generated content should be applied to editor */
  onApplyToEditor?: (text: string) => void;
  /** Optional work ID for context */
  workId?: number;
  /** Optional character IDs for context */
  characterIds?: number[];
  /** Initial mode (default: 'floating') */
  initialMode?: MobileAIMode;
  /** Callback when mode changes */
  onModeChange?: (mode: MobileAIMode) => void;
  /** Whether to show the container */
  isVisible?: boolean;
  /** Editor theme for styling consistency */
  theme?: EditorTheme;
}

/**
 * Mobile AI Assistant Container
 *
 * Manages the dual-mode architecture for mobile AI interaction:
 * - Floating mode: Compact bottom bar for quick interactions
 * - Immersive mode: Full-screen conversation interface
 */
export function MobileAIContainer({
  selectedText,
  onApplyToEditor,
  workId,
  characterIds,
  initialMode = 'floating',
  onModeChange,
  isVisible = true,
  theme = 'default',
}: MobileAIContainerProps) {
  const [mode, setMode] = useState<MobileAIMode>(initialMode);
  const viewport = useMobileViewport();

  // Handle mode switching
  const switchMode = useCallback(
    (newMode: MobileAIMode) => {
      setMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  // Switch to immersive mode
  const enterImmersive = useCallback(() => {
    switchMode('immersive');
  }, [switchMode]);

  // Switch to floating mode
  const exitImmersive = useCallback(() => {
    switchMode('floating');
  }, [switchMode]);

    // Don't render if hidden or not visible
    if (!isVisible || mode === 'hidden') {
      return null;
    }
  
    return (
      <>
        {/* Floating Bar - visible in floating mode */}
        <AnimatePresence>
          {mode === 'floating' && (
            <MobileAIFloatingBar
              selectedText={selectedText}
              onInputFocus={enterImmersive}
              onSwipeUp={enterImmersive}
              safeAreaBottom={viewport.safeAreaBottom}
              theme={theme}
            />
          )}
        </AnimatePresence>

      {/* Immersive Mode - full screen overlay */}
      <AnimatePresence>
        {mode === 'immersive' && (
          <MobileAIImmersive
            selectedText={selectedText}
            onApplyToEditor={onApplyToEditor}
            onClose={exitImmersive}
            onSwipeDown={exitImmersive}
            workId={workId}
            characterIds={characterIds}
            viewportHeight={viewport.height}
            isKeyboardVisible={viewport.isKeyboardVisible}
            keyboardHeight={viewport.keyboardHeight}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileAIContainer;