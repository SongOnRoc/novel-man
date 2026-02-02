/**
 * Mobile AI Assistant Components
 * 
 * This module provides mobile-optimized AI assistant components
 * featuring a dual-mode architecture:
 * - Floating mode: Compact bottom bar for quick interactions
 * - Immersive mode: Full-screen conversation interface
 */

export { MobileAIContainer, type MobileAIMode } from './MobileAIContainer';
export { MobileAIFloatingBar } from './MobileAIFloatingBar';
export { MobileAIImmersive } from './MobileAIImmersive';
export { MobileQuickActions } from './MobileQuickActions';
export { MobileCompactComposer } from './MobileCompactComposer';

// Hooks
export { useMobileViewport } from './hooks/useMobileViewport';