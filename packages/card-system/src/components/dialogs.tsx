import { useState } from "react";
import { createPortal } from "react-dom";
import { Z_INDEX } from "../constants";
import { CollectionLayoutStyle } from "../types";
import type { AddCardDialogProps, CardProperty, LayoutStyleDialogProps, RelateDialogProps } from "../types";

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

    // 只传递标题和属性数组
    onAddCollectionCard(title, finalProps);
    handleClose();
  };

  if (!open) return null;

  // 创建对话框内容
  const dialogContent = (
    <div
      style={{
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
      }}
      className="dialog-overlay"
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
          width: "400px",
          maxWidth: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "16px" }}>添加新卡片</h3>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label
              htmlFor="card-title"
              style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}
            >
              卡片标题
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
              placeholder="输入卡片标题"
            />
          </div>

          {/* 属性选择 */}
          {attributeOptions.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <label
                htmlFor="card-attribute"
                style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}
              >
                选择属性
              </label>
              <select
                id="card-attribute"
                value={selectedAttribute}
                onChange={(e) => handleAttributeSelect(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="custom">不指定</option>
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
          <div style={{ display: "flex", alignItems: "center" }}>
            <input
              id="hide-title"
              type="checkbox"
              checked={hideTitle}
              onChange={(e) => setHideTitle(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            <label htmlFor="hide-title" style={{ fontSize: "14px" }}>
              隐藏卡片标题
            </label>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleAddEditor}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "120px",
            }}
          >
            添加编辑器卡片
          </button>
          <button
            type="button"
            onClick={handleAddCollection}
            style={{
              padding: "8px 16px",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "120px",
            }}
          >
            添加集合卡片
          </button>
        </div>
      </div>
    </div>
  );

  // 使用Portal将对话框渲染到document.body
  return createPortal(dialogContent, document.body);
}

// 关联对话框组件
export function RelateDialog({ open, onClose, onConfirm, availableItems = [] }: RelateDialogProps) {
  const [selectedItem, setSelectedItem] = useState<string>("");

  const handleConfirm = () => {
    const item = availableItems.find((item) => item.id === selectedItem);
    if (item) {
      onConfirm(item.id, item.title, item.type);
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedItem("");
    onClose();
  };

  if (!open) return null;

  // 创建对话框内容
  const dialogContent = (
    <div
      style={{
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
      }}
      className="dialog-overlay"
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
          width: "400px",
          maxWidth: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "16px" }}>关联内容</h3>

        {availableItems.length > 0 ? (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label
                htmlFor="relate-item"
                style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}
              >
                选择要关联的内容
              </label>
              <select
                id="relate-item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              >
                <option value="">请选择</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: "16px", color: "#6b7280" }}>
            <p>没有可关联的内容。</p>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedItem}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedItem ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: selectedItem ? "pointer" : "not-allowed",
              minWidth: "80px",
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );

  // 使用Portal将对话框渲染到document.body
  return createPortal(dialogContent, document.body);
}

// 布局样式选择对话框组件
export function LayoutStyleDialog({
  open,
  onClose,
  onConfirm,
  currentStyle = CollectionLayoutStyle.VERTICAL,
}: LayoutStyleDialogProps) {
  const [selectedStyle, setSelectedStyle] = useState<CollectionLayoutStyle>(currentStyle);

  const handleConfirm = () => {
    onConfirm(selectedStyle);
    onClose();
  };

  const handleClose = () => {
    setSelectedStyle(currentStyle);
    onClose();
  };

  if (!open) return null;

  // 创建对话框内容
  const dialogContent = (
    <div
      style={{
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
      }}
      className="dialog-overlay"
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "16px",
          width: "400px",
          maxWidth: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "16px" }}>设置布局样式</h3>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label
              htmlFor="layout-style"
              style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}
            >
              选择布局样式
            </label>
            <select
              id="layout-style"
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value as CollectionLayoutStyle)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value={CollectionLayoutStyle.VERTICAL}>垂直布局</option>
              <option value={CollectionLayoutStyle.HORIZONTAL}>水平布局</option>
              <option value={CollectionLayoutStyle.ADAPTIVE}>自适应布局</option>
              <option value={CollectionLayoutStyle.GRID}>网格布局</option>
              <option value={CollectionLayoutStyle.LIST}>列表布局</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              padding: "8px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: "8px 16px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              minWidth: "80px",
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );

  // 使用Portal将对话框渲染到document.body
  return createPortal(dialogContent, document.body);
}
