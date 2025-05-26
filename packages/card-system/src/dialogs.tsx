import { useState } from "react";
import { CollectionLayoutStyle } from "./types";
import type { AddCardDialogProps, CardProperty, LayoutStyleDialogProps, RelateDialogProps } from "./types";

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
    resetForm();
  };

  const handleAddCollection = () => {
    const props = generateProps();
    // 根据选择的属性生成tag
    let tag = "";
    if (selectedAttribute) {
      tag = selectedAttribute.replace(/\s+/g, '-').toLowerCase();
    }
    onAddCollectionCard(title, [...props, { name: "tag", value: tag }]);
    resetForm();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96 space-y-4">
        <h3 className="text-lg font-medium">添加新卡片</h3>

        <div className="space-y-3">
          <div>
            <label htmlFor="card-title" className="block text-sm font-medium">
              卡片标题
            </label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="输入卡片标题"
            />
          </div>

          {/* 属性选择 */}
          {attributeOptions.length > 0 && (
            <div>
              <label htmlFor="card-attribute" className="block text-sm font-medium">
                选择属性
              </label>
              <select
                id="card-attribute"
                value={selectedAttribute}
                onChange={(e) => handleAttributeSelect(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              >
                <option value="">不指定属性</option>
                {attributeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="custom">自定义属性</option>
              </select>
            </div>
          )}

          {/* 隐藏标题选项 */}
          <div className="flex items-center">
            <input
              id="hide-title"
              type="checkbox"
              checked={hideTitle}
              onChange={(e) => setHideTitle(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="hide-title" className="ml-2 block text-sm">
              隐藏卡片标题
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleAddEditor}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            添加编辑器卡片
          </button>
          <button
            type="button"
            onClick={handleAddCollection}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96 space-y-4">
        <h3 className="text-lg font-medium">关联项目</h3>

        <div className="space-y-3">
          {availableItems.length === 0 ? (
            <p className="text-gray-500">没有可关联的项目</p>
          ) : (
            <div>
              <label htmlFor="relate-item" className="block text-sm font-medium">
                选择要关联的项目
              </label>
              <select
                id="relate-item"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
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

        <div className="flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedItemId}
            className={`px-4 py-2 rounded-md ${
              selectedItemId
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-96 space-y-4">
        <h3 className="text-lg font-medium">选择布局样式</h3>

        <div className="space-y-3">
          <div className="flex flex-col gap-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.VERTICAL}
                checked={selectedStyle === CollectionLayoutStyle.VERTICAL}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.VERTICAL)}
                className="mr-2"
              />
              上下排列 - 卡片固定宽度，垂直滚动
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.HORIZONTAL}
                checked={selectedStyle === CollectionLayoutStyle.HORIZONTAL}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.HORIZONTAL)}
                className="mr-2"
              />
              左右排列 - 卡片固定高度，水平滚动
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="layout-style"
                value={CollectionLayoutStyle.ADAPTIVE}
                checked={selectedStyle === CollectionLayoutStyle.ADAPTIVE}
                onChange={() => setSelectedStyle(CollectionLayoutStyle.ADAPTIVE)}
                className="mr-2"
              />
              自适应排列 - 根据空间自动换行
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
