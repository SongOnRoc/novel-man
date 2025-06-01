import { useState } from "react";
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
    onAddCollectionCard(title, [...props, { name: "tag", value: tag }]);
    handleClose();
  };

  if (!open) return null;

  // 使用固定定位的模态对话框
  return (
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
        zIndex: 1000,
      }}
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
}

// 关联项对话框组件
export function RelateDialog({ open, onClose, onConfirm, availableItems = [] }: RelateDialogProps) {
  const [selectedItemId, setSelectedItemId] = useState("");

  const handleConfirm = () => {
    if (selectedItemId) {
      const selectedItem = availableItems.find((item) => item.id === selectedItemId);
      if (selectedItem) {
        onConfirm(selectedItem.id, selectedItem.title, selectedItem.type);
      }
    }
    setSelectedItemId("");
    onClose();
  };

  const handleClose = () => {
    setSelectedItemId("");
    onClose();
  };

  if (!open) return null;

  return (
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
        zIndex: 1000,
      }}
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
        <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "16px" }}>关联项目</h3>

        <div style={{ marginBottom: "16px" }}>
          {availableItems.length === 0 ? (
            <p style={{ color: "#6b7280" }}>没有可关联的项目</p>
          ) : (
            <div style={{ marginBottom: "12px" }}>
              <label
                htmlFor="relate-item"
                style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}
              >
                选择要关联的项目
              </label>
              <select
                id="relate-item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
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
          )}
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
            disabled={!selectedItemId}
            style={{
              padding: "8px 16px",
              backgroundColor: selectedItemId ? "#3b82f6" : "#d1d5db",
              color: selectedItemId ? "white" : "#6b7280",
              border: "none",
              borderRadius: "4px",
              cursor: selectedItemId ? "pointer" : "not-allowed",
              minWidth: "80px",
            }}
          >
            确认关联
          </button>
        </div>
      </div>
    </div>
  );
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

  return (
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
        zIndex: 1000,
      }}
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
        <h3 style={{ fontSize: "18px", fontWeight: 500, marginBottom: "16px" }}>选择布局样式</h3>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.VERTICAL}
                checked={selectedStyle === CollectionLayoutStyle.VERTICAL}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.VERTICAL)}
                style={{ marginRight: "8px" }}
              />
              上下排列 - 卡片固定宽度，垂直滚动
            </label>

            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.HORIZONTAL}
                checked={selectedStyle === CollectionLayoutStyle.HORIZONTAL}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.HORIZONTAL)}
                style={{ marginRight: "8px" }}
              />
              左右排列 - 卡片固定高度，水平滚动
            </label>

            <label style={{ display: "flex", alignItems: "center" }}>
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.ADAPTIVE}
                checked={selectedStyle === CollectionLayoutStyle.ADAPTIVE}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.ADAPTIVE)}
                style={{ marginRight: "8px" }}
              />
              自适应排列 - 根据空间自动换行
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
}
