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
export const CardSystemDemo: React.FC = () => {
  // 状态管理
  const [cards, setCards] = useState<BaseCardProps[]>(initialCards);

  // 当卡片系统内部状态变化时的回调函数
  const handleCardsChange = (updatedCards: BaseCardProps[]) => {
    setCards(updatedCards);
    // 这里可以添加其他需要的操作，比如保存到本地存储、发送到服务器等
    console.log("卡片状态已更新:", updatedCards);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {/* <h1 className="text-2xl font-bold mb-6" style={{ color: "bg-white" }}>
        卡片演示
      </h1> */}
      {/* <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">功能说明</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>支持两种类型卡片：编辑器类和集合类</li>
          <li>卡片可折叠、编辑标题、添加子卡片、删除</li>
          <li>集合类卡片支持三种布局样式：上下排列、左右排列、自适应排列</li>
          <li>支持卡片拖拽排序</li>
          <li>支持关联功能</li>
          <li>卡片系统内部管理状态，无需外部实现处理函数</li>
        </ul>
      </div> */}
      

      <CardSystem
        initialCards={cards}
        // title="卡片演示"
        title=""
        onCardsChange={handleCardsChange}
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
        addButtonText="添加新卡片"
        defaultCollapsed={true}
      />
    </div>
  );
};

export default CardSystemDemo;
