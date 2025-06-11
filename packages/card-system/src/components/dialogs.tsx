import { useState } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "../constants";
import { CollectionLayoutStyle } from "../types";
import type { AddCardDialogProps, CardProperty, LayoutStyleDialogProps, RelateDialogProps } from "../types";

// 对话框基础样式
const dialogBaseStyles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: Z_INDEX.DIALOG,
    padding: "16px",
    animation: "fadeIn 0.3s ease",
  },
  content: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "28px",
    width: "480px",
    maxWidth: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    position: "relative" as const,
    boxSizing: "border-box" as const,
    overflow: "hidden" as const,
    maxHeight: "90vh",
    overflowY: "auto" as const,
    animation: "slideUp 0.3s ease",
  },
  header: {
    fontSize: "20px",
    fontWeight: 600,
    marginBottom: "24px",
    color: "#1e293b",
    letterSpacing: "-0.01em",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "28px",
  },
  button: {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  secondaryButton: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "8px",
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    backgroundColor: "white",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    outline: "none",
    appearance: "none" as const,
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "40px",
  },
  checkbox: {
    marginRight: "10px",
    width: "18px",
    height: "18px",
    accentColor: "#3b82f6",
  },
  optionBox: {
    display: "flex",
    alignItems: "flex-start",
    padding: "16px",
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    marginBottom: "16px",
    transition: "all 0.2s ease",
    cursor: "pointer",
  },
  optionBoxSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "#3b82f6",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  optionContent: {
    display: "flex",
    flexDirection: "column" as const,
  },
  optionTitle: {
    fontSize: "15px",
    fontWeight: 500,
    marginBottom: "4px",
    color: "#1e293b",
  },
  optionDescription: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
    lineHeight: "1.5",
  },
};

// 添加全局样式
const globalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .dialog-overlay {
    animation: fadeIn 0.3s ease;
  }
  
  .dialog-content {
    animation: slideUp 0.3s ease;
  }
  
  .dialog-primary-button:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .dialog-secondary-button:hover {
    background-color: #e2e8f0;
    transform: translateY(-1px);
  }
  
  .dialog-input:focus, .dialog-select:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
  
  .dialog-option-box:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }
`;

// 添加卡片对话框组件
export function AddCardDialog({
  open,
  onClose,
  onAddEditorCard,
  onAddCollectionCard,
  defaultTitle = "",
  parentTag,
  parentProps = [],
  attributeOptions = [],
}: AddCardDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [hideTitle, setHideTitle] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [customProps, setCustomProps] = useState<CardProperty[]>([]);

  // 处理属性选择
  const handleAttributeSelect = (value: string) => {
    setSelectedAttribute(value);
    // 如果选择了属性，将其设置为标题并生成tag
    if (value && value !== "custom") {
      const matchingAttribute = attributeOptions.find((attr) => attr.value === value);
      if (matchingAttribute) {
        setTitle(matchingAttribute.label);
      }
    }
  };

  // 生成props数组
  const generateProps = (): CardProperty[] => {
    if (selectedAttribute && selectedAttribute !== "custom") {
      return [{ name: selectedAttribute, value: title }];
    }
    return customProps;
  };

  // 重置表单
  const resetForm = () => {
    setTitle(defaultTitle);
    setHideTitle(false);
    setSelectedAttribute("");
    setCustomProps([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddEditor = () => {
    onAddEditorCard(title, hideTitle, generateProps());
    handleClose();
  };

  const handleAddCollection = () => {
    const props = generateProps();
    // 根据选择的属性生成tag
    let tag = "";
    if (selectedAttribute) {
      tag = selectedAttribute.replace(/\s+/g, "-").toLowerCase();
    }

    // 添加tag属性
    const finalProps = tag ? [...props, { name: "tag", value: tag }] : props;

    // 传递标题、属性数组和hideTitle参数
    onAddCollectionCard(title, finalProps, hideTitle);
    handleClose();
  };

  // 处理隐藏标题选项的点击
  const handleHideTitleClick = () => {
    setHideTitle(!hideTitle);
  };

  // 处理隐藏标题选项的键盘事件
  const handleHideTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setHideTitle(!hideTitle);
    }
  };

  if (!open) return null;

  // 创建对话框内容
  const dialogContent = (
    <div style={dialogBaseStyles.overlay} className="dialog-overlay">
      <div style={dialogBaseStyles.content} className="dialog-content">
        <h3 style={dialogBaseStyles.header}>添加新卡片</h3>

        <div>
          <div style={dialogBaseStyles.inputGroup}>
            <label htmlFor="card-title" style={dialogBaseStyles.label}>
              卡片标题
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={dialogBaseStyles.input}
              className="dialog-input"
              placeholder="输入卡片标题"
            />
          </div>

          {/* 属性选择 */}
          {attributeOptions.length > 0 && (
            <div style={dialogBaseStyles.inputGroup}>
              <label htmlFor="card-attribute" style={dialogBaseStyles.label}>
                选择属性
              </label>
              <select
                id="card-attribute"
                value={selectedAttribute}
                onChange={(e) => handleAttributeSelect(e.target.value)}
                style={dialogBaseStyles.select}
                className="dialog-select"
              >
                <option value="">不指定</option>
                {attributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">自定义</option>
              </select>
            </div>
          )}

          {/* 隐藏标题选项 */}
          <button
            type="button"
            style={{
              ...dialogBaseStyles.optionBox,
              ...(hideTitle ? dialogBaseStyles.optionBoxSelected : {}),
              width: "100%",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
            }}
            className="dialog-option-box"
            onClick={handleHideTitleClick}
            onKeyDown={handleHideTitleKeyDown}
          >
            <input
              id="hide-title"
              type="checkbox"
              checked={hideTitle}
              onChange={(e) => setHideTitle(e.target.checked)}
              style={dialogBaseStyles.checkbox}
            />
            <div style={dialogBaseStyles.optionContent}>
              <label htmlFor="hide-title" style={dialogBaseStyles.optionTitle}>
                创建无头卡片（隐藏标题栏）
              </label>
              <p style={dialogBaseStyles.optionDescription}>
                无头卡片只显示容器部分，隐藏标题栏。适用于需要简洁界面或作为其他卡片的容器。
              </p>
            </div>
          </button>
        </div>

        <div style={dialogBaseStyles.buttonGroup}>
          <button
            type="button"
            onClick={handleClose}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.secondaryButton }}
            className="dialog-secondary-button"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleAddEditor}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.primaryButton }}
            className="dialog-primary-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>添加编辑器卡片</title>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            添加编辑器卡片
          </button>
          <button
            type="button"
            onClick={handleAddCollection}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.primaryButton }}
            className="dialog-primary-button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>添加集合卡片</title>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            添加集合卡片
          </button>
        </div>
      </div>
      <style>{globalStyles}</style>
    </div>
  );

  // 使用Portal渲染到body
  return createPortal(dialogContent, document.body);
}

// 关联对话框组件
export function RelateDialog({ open, onClose, onRelateItem, availableRelateItems = [] }: RelateDialogProps) {
  const [selectedItem, setSelectedItem] = useState("");

  // 处理关联确认
  const handleRelateItem = () => {
    if (selectedItem) {
      const item = availableRelateItems.find((item) => item.id === selectedItem);
      if (item) {
        onRelateItem(item.id, item.title, item.type);
        handleClose();
      }
    }
  };

  // 处理关闭
  const handleClose = () => {
    setSelectedItem("");
    onClose();
  };

  if (!open) return null;

  // 创建对话框内容
  const dialogContent = (
    <div style={dialogBaseStyles.overlay} className="dialog-overlay">
      <div style={dialogBaseStyles.content}>
        <h3 style={dialogBaseStyles.header}>关联内容</h3>

        {availableRelateItems.length > 0 ? (
          <div style={dialogBaseStyles.inputGroup}>
            <label htmlFor="relate-item" style={dialogBaseStyles.label}>
              选择要关联的内容
            </label>
            <select
              id="relate-item"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              style={dialogBaseStyles.select}
            >
              <option value="">请选择</option>
              {availableRelateItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.type})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p style={{ color: "#64748b", fontSize: "14px" }}>没有可关联的内容</p>
        )}

        <div style={dialogBaseStyles.buttonGroup}>
          <button
            type="button"
            onClick={handleClose}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.secondaryButton }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleRelateItem}
            disabled={!selectedItem}
            style={{
              ...dialogBaseStyles.button,
              ...dialogBaseStyles.primaryButton,
              opacity: !selectedItem ? 0.5 : 1,
              cursor: !selectedItem ? "not-allowed" : "pointer",
            }}
          >
            确认关联
          </button>
        </div>
      </div>
    </div>
  );

  // 使用Portal渲染到body
  return createPortal(dialogContent, document.body);
}

// 布局样式对话框组件
export function LayoutStyleDialog({
  open,
  onClose,
  onConfirm,
  currentStyle = CollectionLayoutStyle.VERTICAL,
}: LayoutStyleDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<CollectionLayoutStyle>(currentStyle);

  // 处理样式确认
  const handleConfirm = () => {
    onConfirm(selectedStyle);
    onClose();
  };

  // 处理关闭
  const handleClose = () => {
    setSelectedStyle(currentStyle);
    onClose();
  };

  // 处理布局选项的点击和键盘事件
  const handleLayoutOptionClick = (style: CollectionLayoutStyle) => {
    setSelectedStyle(style);
  };

  const handleLayoutOptionKeyDown = (e: React.KeyboardEvent, style: CollectionLayoutStyle) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedStyle(style);
    }
  };

  if (!open) return null;

  // 布局样式选项
  const layoutOptions = [
    {
      value: CollectionLayoutStyle.VERTICAL,
      label: "垂直排列",
      description: "卡片上下排列，适合阅读长内容",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>垂直排列布局</title>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
        </svg>
      ),
    },
    {
      value: CollectionLayoutStyle.HORIZONTAL,
      label: "水平排列",
      description: "卡片左右排列，适合展示多个相关项目",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>水平排列布局</title>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
          <line x1="15" y1="3" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      value: CollectionLayoutStyle.GRID,
      label: "网格排列",
      description: "卡片以网格形式排列，适合展示大量内容",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>网格排列布局</title>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      value: CollectionLayoutStyle.ADAPTIVE,
      label: "自适应排列",
      description: "根据屏幕大小自动调整布局",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>自适应排列布局</title>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
    {
      value: CollectionLayoutStyle.LIST,
      label: "列表排列",
      description: "紧凑的列表形式，适合简洁展示",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>列表排列布局</title>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
    },
  ];

  // 创建对话框内容
  const dialogContent = (
    <div style={dialogBaseStyles.overlay} className="dialog-overlay">
      <div style={dialogBaseStyles.content} className="dialog-content">
        <h3 style={dialogBaseStyles.header}>选择布局样式</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {layoutOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              style={{
                ...dialogBaseStyles.optionBox,
                ...(selectedStyle === option.value ? dialogBaseStyles.optionBoxSelected : {}),
                display: "flex",
                alignItems: "center",
                gap: "16px",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              className="dialog-option-box"
              onClick={() => handleLayoutOptionClick(option.value)}
              onKeyDown={(e) => handleLayoutOptionKeyDown(e, option.value)}
            >
              <div
                style={{
                  color: selectedStyle === option.value ? "#3b82f6" : "#64748b",
                  backgroundColor: selectedStyle === option.value ? "rgba(59, 130, 246, 0.1)" : "#f1f5f9",
                  padding: "12px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {option.icon}
              </div>
              <div style={dialogBaseStyles.optionContent}>
                <div style={dialogBaseStyles.optionTitle}>{option.label}</div>
                <p style={dialogBaseStyles.optionDescription}>{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div style={dialogBaseStyles.buttonGroup}>
          <button
            type="button"
            onClick={handleClose}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.secondaryButton }}
            className="dialog-secondary-button"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{ ...dialogBaseStyles.button, ...dialogBaseStyles.primaryButton }}
            className="dialog-primary-button"
          >
            确认
          </button>
        </div>
      </div>
      <style>{globalStyles}</style>
    </div>
  );

  // 使用Portal渲染到body
  return createPortal(dialogContent, document.body);
}
