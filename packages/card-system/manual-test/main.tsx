import React from "react";
import ReactDOM from "react-dom/client";
// CardSystemDemo is no longer needed as react-dnd is removed.
// DndKitToggleDemo is the main demo now.
import { DndKitToggleDemo } from "../src/manual-test/demo-dndkit-toggle";

// 主应用组件
const App = () => {
  // The toggle logic between react-dnd and dnd-kit is no longer needed.
  // DndKitToggleDemo itself handles the mobile/PC toggle.
  return (
    <div>
      {/* The library toggle buttons are removed. */}
      {/* DndKitToggleDemo is rendered directly. initialUseDndKit prop is also removed from DndKitToggleDemo */}
      <DndKitToggleDemo />
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  console.error("Root element not found");
}
