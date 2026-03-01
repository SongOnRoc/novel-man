// Polyfill for PointerEvent and related Element methods
if (typeof window !== "undefined") {
  if (!window.PointerEvent) {
    class PointerEvent extends MouseEvent {
      constructor(type: string, params: PointerEventInit) {
        super(type, params);
      }
    }
    window.PointerEvent = PointerEvent as any;
  }

  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function (
      pointerId: number,
    ): boolean {
      return false;
    };
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function (
      pointerId: number,
    ): void {};
  }
}

import { vi } from "vitest";

// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
