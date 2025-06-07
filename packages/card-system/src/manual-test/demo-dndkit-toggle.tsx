//  DndKitToggleDemo

import { useState } from "react";
import { DefaultCardFactory } from "../card-factory";
import { CardSystem } from "../card-system";
import { CardContainerType } from "../types";
import type { BaseCardProps } from "../types";

// 创建卡片工厂实例
const cardFactory = new DefaultCardFactory();

// 示例属性选项
const attributeOptions = [
  { value: "desc", label: "角色描述" },
  { value: "ability", label: "角色能力" },
  { value: "experience", label: "角色经历" },
];

// 示例可关联项
const availableRelateItems = [
  { id: "chapter1", title: "第一章", type: "chapter" },
  { id: "chapter2", title: "第二章", type: "chapter" },
  { id: "volume1", title: "第一卷", type: "volume" },
];

// 示例角色卡片
const exampleRoleCard: BaseCardProps = cardFactory.createCard({
  title: "角色示例",
  containerType: CardContainerType.COLLECTION,
  tag: "role",
  props: [
    { name: "desc", value: "角色描述" },
    { name: "ability", value: "角色能力" },
    { name: "experience", value: "角色经历" },
    { name: "custom", value: "自定义" },
  ],
  isCollapsed: false,
});

// 示例场景卡片
const exampleSceneCard: BaseCardProps = cardFactory.createCard({
  title: "场景示例",
  containerType: CardContainerType.COLLECTION,
  tag: "scene",
  props: [
    { name: "location", value: "地点" },
    { name: "time", value: "时间" },
    { name: "atmosphere", value: "氛围" },
  ],
  isCollapsed: false,
});

// 示例内容卡片
const exampleContentCard: BaseCardProps = cardFactory.createCard({
  title: "编辑器示例",
  containerType: CardContainerType.EDITOR,
  isCollapsed: false,
});
// 设置编辑器卡片的内容
exampleContentCard.content =
  "这是一个编辑器类型的卡片，您可以在这里编辑文本内容。\n\n可以尝试编辑标题、折叠卡片、删除卡片等操作。";

// 初始卡片数据
const initialCards = [exampleRoleCard, exampleSceneCard, exampleContentCard];

// 演示组件
interface DndKitToggleDemoProps {
  initialUseDndKit?: boolean;
}

export const DndKitToggleDemo: React.FC<DndKitToggleDemoProps> = ({ initialUseDndKit = false }) => {
  // 状态管理
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);
  const [useDndKit, setUseDndKit] = useState<boolean>(initialUseDndKit);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 当卡片系统内部状态变化时的回调函数
  const handleCardsChange = (updatedCards: BaseCardProps[]) => {
    setCards(updatedCards);
    // 这里可以添加其他需要的操作，比如保存到本地存储、发送到服务器等
    console.log("卡片状态已更新:", updatedCards);
  };

  // 切换拖拽库
  const toggleDndKit = () => {
    setUseDndKit(!useDndKit);
  };

  // 切换设备模式
  const toggleMobile = () => {
    setIsMobile(!isMobile);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">卡片系统演示</h1>
        <div>
          <button
            type="button"
            onClick={toggleDndKit}
            style={{
              backgroundColor: useDndKit ? "#4CAF50" : "#2196F3",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            {useDndKit ? "使用 dnd-kit" : "使用 react-dnd"}
          </button>
          <button
            type="button"
            onClick={toggleMobile}
            style={{
              backgroundColor: isMobile ? "#9C27B0" : "#673AB7",
              color: "white",
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {isMobile ? "移动端模式" : "PC端模式"}
          </button>
        </div>
      </div>

      <div style={{ backgroundColor: "#FFF9C4", padding: "10px", borderRadius: "4px", marginBottom: "20px" }}>
        <p>
          当前设置：
          <strong>{useDndKit ? "DnD-Kit" : "React-DnD"}</strong> +
          <strong>{isMobile ? "移动端模式" : "PC端模式"}</strong>
        </p>
        <p style={{ marginTop: "8px", fontSize: "14px" }}>
          提示：DnD-Kit 在移动端有更好的表现，React-DnD 在 PC 端更稳定
        </p>
      </div>

      <CardSystem
        initialCards={cards}
        title="卡片演示"
        onCardsChange={handleCardsChange}
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
        addButtonText="添加新卡片"
        defaultCollapsed={true}
        isMobile={isMobile}
        useDndKit={useDndKit}
      />
    </div>
  );
};

export default DndKitToggleDemo;
