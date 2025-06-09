//  DndKitToggleDemo

import { useEffect, useState } from "react";
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
  { id: "chapter1", title: "第一章 你好", type: "chapter" },
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
type DndKitToggleDemoProps = Record<string, never>;

export const DndKitToggleDemo: React.FC<DndKitToggleDemoProps> = () => {
  // 状态管理
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);
  // useDndKit 状态不再需要，默认为 true
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkDevice = () => {
      // 根据窗口宽度判断设备类型，阈值可调整
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice(); // 组件加载时检查一次
    window.addEventListener("resize", checkDevice); // 窗口大小变化时检查

    return () => {
      window.removeEventListener("resize", checkDevice); // 组件卸载时移除监听器
    };
  }, []); // 空依赖数组确保 effect 只在挂载和卸载时运行

  // 当卡片系统内部状态变化时的回调函数
  const handleCardsChange = (updatedCards: BaseCardProps[]) => {
    setCards(updatedCards);
    // 这里可以添加其他需要的操作，比如保存到本地存储、发送到服务器等
    console.log("卡片状态已更新:", updatedCards);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">卡片系统演示</h1>
      </div> */}

      <div style={{ backgroundColor: "#E3F2FD", padding: "0px", borderRadius: "2px", marginBottom: "20px" }}>
        <p>
          当前设备:
          <strong>{isMobile ? "移动端" : "桌面端"}</strong>
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
      />
    </div>
  );
};

export default DndKitToggleDemo;
