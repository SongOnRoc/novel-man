import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { CardSystemDemo } from "../src/manual-test/demo";
import { DndKitToggleDemo } from "../src/manual-test/demo-dndkit-toggle";

// 主应用组件，提供切换功能
const App = () => {
  const [showDndKitDemo, setShowDndKitDemo] = useState(false);

  return (
    <div>
      <div style={{ padding: "10px", marginBottom: "20px", borderBottom: "1px solid #ccc" }}>
        <button
          type="button"
          style={{
            padding: "8px 16px",
            marginRight: "10px",
            backgroundColor: !showDndKitDemo ? "#4CAF50" : "#f0f0f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => setShowDndKitDemo(false)}
        >
          原始 React-DnD 演示
        </button>
        <button
          type="button"
          style={{
            padding: "8px 16px",
            backgroundColor: showDndKitDemo ? "#2196F3" : "#f0f0f0",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
          onClick={() => setShowDndKitDemo(true)}
        >
          DnD-Kit 演示
        </button>
      </div>

      {showDndKitDemo ? <DndKitToggleDemo initialUseDndKit={true} /> : <CardSystemDemo />}
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
