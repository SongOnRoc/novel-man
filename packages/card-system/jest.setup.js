require("@testing-library/jest-dom");

// Mock react-dnd and its backends globally
jest.mock("react-dnd", () => ({
  DndProvider: ({ children }) => children,
  useDrag: jest.fn(() => [{}, jest.fn()]),
  useDrop: jest.fn(() => [{}, jest.fn()]),
}));

jest.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: jest.fn(),
}));

jest.mock("react-dnd-touch-backend", () => ({
  TouchBackend: jest.fn(),
}));
