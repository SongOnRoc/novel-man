import { useState } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "../constants";
import {
  type AddCardDialogProps,
  CollectionLayoutStyle,
  type LayoutStyleDialogProps,
  type RelateDialogProps,
} from "../types";

// 对话框背景样式
const dialogBackdropStyle = (isMobile?: boolean): React.CSSProperties => ({
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: Z_INDEX.DIALOG,
  backdropFilter: "blur(4px)",
  padding: isMobile ? "16px" : "24px",
});

// 对话框内容样式
const dialogContentStyle = (isMobile?: boolean): React.CSSProperties => ({
  position: "relative",
  maxWidth: "90%",
  width: isMobile ? "92vw" : "500px",
});

// 对话框标题样式
const dialogTitleStyle = (isMobile?: boolean): React.CSSProperties => ({
  fontSize: isMobile ? "18px" : "20px",
  fontWeight: 600,
  marginBottom: isMobile ? "16px" : "20px",
  color: "#1e293b",
  textAlign: "center",
});

// 对话框按钮组样式
const dialogButtonGroupStyle = (isMobile?: boolean): React.CSSProperties => ({
  marginTop: isMobile ? "18px" : "24px",
});

// 对话框按钮样式
const dialogButtonStyle = (primary = false, isMobile?: boolean): React.CSSProperties => ({
  cursor: "pointer",
});

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
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minWidth: "40px",
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
  
  @media (max-width: 480px) {
    .dialog-button-text {
      display: none;
    }
    
    .dialog-button-icon {
      margin: 0;
    }
    
    .dialog-primary-button, .dialog-secondary-button {
      width: 40px;
      padding: 8px;
    }
  }
`;

// 添加卡片对话框组件
export function AddCardDialog({
  open,
  onClose,
  onAddEditorCard,
  onAddCollectionCard,
  defaultTitle = "",
  parentTag = "",
  parentProps = [],
  attributeOptions = [],
  isMobile = false,
}: AddCardDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [selectedAttribute, setSelectedAttribute] = useState("");
  const [hideTitle, setHideTitle] = useState(false);

  // 重置状态
  const handleClose = () => {
    setTitle(defaultTitle);
    setSelectedAttribute("");
    setHideTitle(false);
    onClose();
  };

  // 添加编辑器类型卡片
  const handleAddEditorCard = () => {
    // 如果选择了属性，则使用该属性作为标题
    const finalTitle = selectedAttribute || title || "新建编辑器";
    // 如果选择了属性，则创建对应的属性数组
    const props = selectedAttribute
      ? parentProps.filter((prop) => prop.name === selectedAttribute).map((prop) => ({ ...prop }))
      : [];
    onAddEditorCard(finalTitle, hideTitle, props);
    handleClose();
  };

  // 添加集合类型卡片
  const handleAddCollectionCard = () => {
    // 如果选择了属性，则使用该属性作为标题
    const finalTitle = selectedAttribute || title || "新建集合";
    // 如果选择了属性，则创建对应的属性数组
    const props = selectedAttribute
      ? parentProps.filter((prop) => prop.name === selectedAttribute).map((prop) => ({ ...prop }))
      : [];
    onAddCollectionCard(finalTitle, props, hideTitle);
    handleClose();
  };

  // 如果对话框未打开，则不渲染内容
  if (!open) return null;

  // 对话框样式
  const dialogStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: Z_INDEX.DIALOG,
    padding: "16px",
  };

  // 对话框内容样式
  const contentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    width: "92vw",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  };

  // 标题样式
  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    textAlign: "center",
    color: "#334155",
  };

  // 输入框容器样式
  const inputGroupStyle: React.CSSProperties = {
    marginBottom: "16px",
  };

  // 标签样式
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#475569",
  };

  // 输入框样式
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxSizing: "border-box",
  };

  // 下拉框样式
  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "40px",
  };

  // 复选框容器样式
  const checkboxContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    cursor: "pointer",
  };

  // 复选框样式
  const checkboxStyle: React.CSSProperties = {
    marginRight: "8px",
  };

  // 确定是否为小屏幕设备
  const isSmallScreen = window.innerWidth <= 480;

  // 按钮容器样式
  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isSmallScreen ? "column" : "row", // 小屏幕上垂直排列
    justifyContent: isSmallScreen ? "center" : "flex-end",
    gap: "10px",
    marginTop: "20px",
  };

  // 主要按钮样式
  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "110px",
  };

  // 次要按钮样式
  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "90px",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  return createPortal(
    <div style={dialogStyle} onClick={handleClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>添加卡片</h3>

        <div style={inputGroupStyle}>
          <label htmlFor="card-title" style={labelStyle}>
            卡片标题
          </label>
          <input
            id="card-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入卡片标题"
            style={inputStyle}
          />
        </div>

        {attributeOptions && attributeOptions.length > 0 && (
          <div style={inputGroupStyle}>
            <label htmlFor="attribute-select" style={labelStyle}>
              选择属性
            </label>
            <select
              id="attribute-select"
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
              style={selectStyle}
            >
              <option value="">无</option>
              {attributeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <label style={checkboxContainerStyle}>
          <input type="checkbox" checked={hideTitle} onChange={() => setHideTitle(!hideTitle)} style={checkboxStyle} />
          <span style={{ fontSize: "14px" }}>隐藏标题栏</span>
        </label>

        <div style={buttonGroupStyle}>
          {isSmallScreen ? (
            // 小屏幕按钮布局（垂直堆叠，主要按钮在上方）
            <>
              <button type="button" onClick={handleAddEditorCard} style={primaryButtonStyle}>
                <EditIcon />
                <span>添加编辑卡片</span>
              </button>
              <button type="button" onClick={handleAddCollectionCard} style={primaryButtonStyle}>
                <AddIcon />
                <span>添加集合卡片</span>
              </button>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
            </>
          ) : (
            // 大屏幕按钮布局（水平排列）
            <>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
              <button type="button" onClick={handleAddEditorCard} style={primaryButtonStyle}>
                <EditIcon />
                <span>添加编辑卡片</span>
              </button>
              <button type="button" onClick={handleAddCollectionCard} style={primaryButtonStyle}>
                <AddIcon />
                <span>添加集合卡片</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// 关联对话框组件
export function RelateDialog({
  open,
  onClose,
  onRelateItem,
  availableRelateItems = [],
  isMobile = false,
}: RelateDialogProps) {
  const [selectedItem, setSelectedItem] = useState("");

  // 重置状态
  const handleClose = () => {
    setSelectedItem("");
    onClose();
  };

  // 确认关联
  const handleConfirm = () => {
    if (selectedItem) {
      const item = availableRelateItems.find((item) => item.id === selectedItem);
      if (item) {
        onRelateItem(item.id, item.title, item.type);
      }
    }
    handleClose();
  };

  // 如果对话框未打开，则不渲染内容
  if (!open) return null;

  // 确定是否为小屏幕设备
  const isSmallScreen = window.innerWidth <= 480;

  // 对话框样式
  const dialogStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: Z_INDEX.DIALOG,
    padding: "16px",
  };

  // 对话框内容样式
  const contentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    width: "92vw",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  };

  // 标题样式
  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    textAlign: "center",
    color: "#334155",
  };

  // 输入框容器样式
  const inputGroupStyle: React.CSSProperties = {
    marginBottom: "16px",
  };

  // 标签样式
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#475569",
  };

  // 下拉框样式
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxSizing: "border-box",
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "16px",
    paddingRight: "40px",
  };

  // 按钮容器样式
  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isSmallScreen ? "column" : "row", // 小屏幕上垂直排列
    justifyContent: isSmallScreen ? "center" : "flex-end",
    gap: "10px",
    marginTop: "20px",
  };

  // 主要按钮样式
  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "90px",
  };

  // 次要按钮样式
  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "90px",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  return createPortal(
    <div style={dialogStyle} onClick={handleClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>关联内容</h3>

        <div style={inputGroupStyle}>
          <label htmlFor="relate-item-select" style={labelStyle}>
            选择关联项
          </label>
          <select
            id="relate-item-select"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            style={selectStyle}
          >
            <option value="">请选择</option>
            {availableRelateItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div style={buttonGroupStyle}>
          {isSmallScreen ? (
            // 小屏幕按钮布局（垂直堆叠）
            <>
              <button type="button" onClick={handleConfirm} style={primaryButtonStyle}>
                <LinkIcon />
                <span>关联</span>
              </button>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
            </>
          ) : (
            // 大屏幕按钮布局（水平排列）
            <>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
              <button type="button" onClick={handleConfirm} style={primaryButtonStyle}>
                <LinkIcon />
                <span>关联</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// 布局样式对话框组件
export function LayoutStyleDialog({
  open,
  onClose,
  onConfirm,
  currentStyle = CollectionLayoutStyle.VERTICAL,
  isMobile = false,
}: LayoutStyleDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<CollectionLayoutStyle>(currentStyle);

  // 重置状态
  const handleClose = () => {
    setSelectedStyle(currentStyle);
    onClose();
  };

  // 确认选择
  const handleConfirm = () => {
    onConfirm(selectedStyle);
    onClose();
  };

  // 如果对话框未打开，则不渲染内容
  if (!open) return null;

  // 样式选项
  const styleOptions = [
    { value: CollectionLayoutStyle.VERTICAL, label: "垂直排列", icon: "↓" },
    { value: CollectionLayoutStyle.HORIZONTAL, label: "水平排列", icon: "→" },
    { value: CollectionLayoutStyle.ADAPTIVE, label: "自适应排列", icon: "⇲" },
  ];

  // 确定是否为小屏幕设备
  const isSmallScreen = window.innerWidth <= 480;

  // 对话框样式
  const dialogStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: Z_INDEX.DIALOG,
    padding: "16px",
  };

  // 对话框内容样式
  const contentStyle: React.CSSProperties = {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    width: "92vw",
    maxWidth: "400px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
  };

  // 标题样式
  const titleStyle: React.CSSProperties = {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    textAlign: "center",
    color: "#334155",
  };

  // 选项容器样式
  const optionsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
  };

  // 按钮容器样式
  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isSmallScreen ? "column" : "row", // 小屏幕上垂直排列
    justifyContent: isSmallScreen ? "center" : "flex-end",
    gap: "10px",
    marginTop: "20px",
  };

  // 主要按钮样式
  const primaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "90px",
  };

  // 次要按钮样式
  const secondaryButtonStyle: React.CSSProperties = {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "none",
    borderRadius: "8px",
    padding: "0 16px",
    height: "40px",
    fontSize: "14px",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    cursor: "pointer",
    width: isSmallScreen ? "100%" : "auto", // 小屏幕上占满宽度
    minWidth: isSmallScreen ? "auto" : "90px",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
  };

  return createPortal(
    <div style={dialogStyle} onClick={handleClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>选择布局样式</h3>

        <div style={optionsContainerStyle}>
          {styleOptions.map((option) => (
            <label
              key={option.value}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                backgroundColor: selectedStyle === option.value ? "#e0e7ff" : "transparent",
                border: `1px solid ${selectedStyle === option.value ? "#818cf8" : "#e2e8f0"}`,
                transition: "all 0.2s ease",
              }}
            >
              <input
                type="radio"
                name="layoutStyle"
                value={option.value}
                checked={selectedStyle === option.value}
                onChange={() => setSelectedStyle(option.value)}
                style={{ marginRight: "12px" }}
              />
              <span style={{ fontSize: "14px", marginRight: "8px" }}>{option.icon}</span>
              <span style={{ fontSize: "14px" }}>{option.label}</span>
            </label>
          ))}
        </div>

        <div style={buttonGroupStyle}>
          {isSmallScreen ? (
            // 小屏幕按钮布局（垂直堆叠）
            <>
              <button type="button" onClick={handleConfirm} style={primaryButtonStyle}>
                <LayoutIcon />
                <span>确认</span>
              </button>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
            </>
          ) : (
            // 大屏幕按钮布局（水平排列）
            <>
              <button type="button" onClick={handleClose} style={secondaryButtonStyle}>
                <CloseIcon />
                <span>取消</span>
              </button>
              <button type="button" onClick={handleConfirm} style={primaryButtonStyle}>
                <LayoutIcon />
                <span>确认</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

// 图标组件定义
const AddIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>添加</title>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>编辑</title>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>取消</title>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ConfirmIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>确认</title>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const LinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>关联</title>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LayoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="dialog-button-icon"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
  >
    <title>布局</title>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);
