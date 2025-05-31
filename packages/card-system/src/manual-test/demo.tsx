import { useState } from "react";
import type { FC } from "react";
import { v4 as uuidv4 } from "uuid";
import { CardSystem } from "../card-system";
import { DefaultCardFactory } from "../card-factory";
import {
  CardContainerType,
  CollectionLayoutStyle
} from "../types";
import type {
  BaseCardProps,
  CardProperty
} from "../types";

// 创建卡片工厂实例
const cardFactory = new DefaultCardFactory();

// 示例属性选项
const attributeOptions = [
  { value: "desc", label: "角色描述" },
  { value: "ability", label: "角色能力" },
  { value: "experience", label: "角色经历" },
  { value: "custom", label: "自定义" }
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
    { name: "custom", value: "自定义" }
  ],
  isCollapsed: false
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
    { name: "custom", value: "自定义" }
  ],
  isCollapsed: false
});

// 示例内容卡片
const exampleContentCard: BaseCardProps = cardFactory.createCard({
  title: "编辑器示例",
  containerType: CardContainerType.EDITOR,
  isCollapsed: false
});
// 设置编辑器卡片的内容
exampleContentCard.content = "这是一个编辑器类型的卡片，您可以在这里编辑文本内容。\n\n可以尝试编辑标题、折叠卡片、删除卡片等操作。";

// 演示组件
export const CardSystemDemo: React.FC = () => {
  // 状态管理
  const [cards, setCards] = useState<BaseCardProps[]>([
    exampleRoleCard,
    exampleSceneCard,
    exampleContentCard
  ]);
  
  // 添加卡片
  const handleAddCard = (containerType: CardContainerType, title?: string, hideTitle?: boolean, props?: CardProperty[]) => {
    const newCard = cardFactory.createCard({
      title: title || (containerType === CardContainerType.EDITOR ? "新建编辑器" : "新建集合"),
      containerType,
      hideTitle,
      props,
      isCollapsed: true
    });
    
    setCards([...cards, newCard]);
  };
  
  // 更新卡片
  const handleUpdateCard = (id: string, updates: Partial<BaseCardProps>) => {
    setCards(cards.map(card => {
      if (card.id === id) {
        return { ...card, ...updates };
      }
      
      // 如果卡片有子卡片，递归更新
      if (card.childCards && card.childCards.length > 0) {
        const updatedChildCards = card.childCards.map((childCard: BaseCardProps) => {
          if (childCard.id === id) {
            return { ...childCard, ...updates };
          }
          return childCard;
        });
        
        return { ...card, childCards: updatedChildCards };
      }
      
      return card;
    }));
  };
  
  // 删除卡片
  const handleDeleteCard = (id: string) => {
    // 递归函数，用于从卡片树中删除指定ID的卡片
    const removeCardById = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
      return cardsArray.filter(card => {
        if (card.id === id) return false;
        
        if (card.childCards && card.childCards.length > 0) {
          card.childCards = removeCardById(card.childCards);
        }
        
        return true;
      });
    };
    
    setCards(removeCardById(cards));
  };
  
  // 添加子卡片
  const handleAddChildCard = (
    parentId: string, 
    containerType: CardContainerType, 
    title?: string, 
    hideTitle?: boolean,
    parentCardCount?: number
  ) => {
    // 递归函数，用于向指定ID的父卡片添加子卡片
    const addChildToParent = (cardsArray: BaseCardProps[]): BaseCardProps[] => {
      return cardsArray.map(card => {
        if (card.id === parentId) {
          // 创建子卡片
          const childCard = cardFactory.createCard({
            title: title || (containerType === CardContainerType.EDITOR ? "新建编辑器" : "新建集合"),
            containerType,
            hideTitle,
            parent: parentId,
            tag: card.tag ? `${card.tag}-child-${(card.childCards?.length || 0) + 1}` : undefined,
            isCollapsed: true
          });
          
          // 更新父卡片的子卡片列表
          return {
            ...card,
            childCards: [...(card.childCards || []), childCard],
            isCollapsed: false // 展开父卡片
          };
        }
        
        // 如果当前卡片有子卡片，递归查找
        if (card.childCards && card.childCards.length > 0) {
          return {
            ...card,
            childCards: addChildToParent(card.childCards)
          };
        }
        
        return card;
      });
    };
    
    setCards(addChildToParent(cards));
  };
  
  // 关联卡片
  const handleRelateCard = (id: string) => {
    // 在实际应用中，这里应该打开一个对话框让用户选择要关联的项目
    console.log(`关联卡片: ${id}`);
  };
  
  // 解除关联
  const handleUnrelateCard = (id: string) => {
    handleUpdateCard(id, { relatedItem: undefined });
  };
  
  // 更改布局样式
  const handleChangeLayoutStyle = (id: string, style: CollectionLayoutStyle) => {
    handleUpdateCard(id, { layoutStyle: style });
  };
  
  // 移动卡片
  const handleMoveCard = (dragIndex: number, hoverIndex: number, dragParentId?: string, hoverParentId?: string) => {
    // 如果是在同一个父容器内移动
    if (dragParentId === hoverParentId) {
      // 如果是根级别的卡片
      if (!dragParentId || dragParentId === "root") {
        const dragCard = cards[dragIndex];
        const newCards = [...cards];
        newCards.splice(dragIndex, 1);
        newCards.splice(hoverIndex, 0, dragCard);
        setCards(newCards);
      } else {
        // 在子卡片中移动
        setCards(prevCards => {
          return prevCards.map(card => {
            // 递归查找父卡片
            const findAndUpdateParent = (parentCard: BaseCardProps): BaseCardProps => {
              if (parentCard.id === dragParentId && parentCard.childCards) {
                const dragCard = parentCard.childCards[dragIndex];
                const newChildCards = [...parentCard.childCards];
                newChildCards.splice(dragIndex, 1);
                newChildCards.splice(hoverIndex, 0, dragCard);
                return { ...parentCard, childCards: newChildCards };
              }
              
              if (parentCard.childCards) {
                return {
                  ...parentCard,
                  childCards: parentCard.childCards.map(findAndUpdateParent)
                };
              }
              
              return parentCard;
            };
            
            return findAndUpdateParent(card);
          });
        });
      }
    } else {
      // 跨容器拖拽的情况
      console.log("跨容器拖拽暂未实现");
      // 实际应用中需要实现从一个父容器移动到另一个父容器的逻辑
    }
  };
  
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6" style={{color: 'red'}}>卡片系统演示</h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">功能说明</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>支持两种类型卡片：编辑器类和集合类</li>
          <li>卡片可折叠、编辑标题、添加子卡片、删除</li>
          <li>集合类卡片支持三种布局样式：上下排列、左右排列、自适应排列</li>
          <li>支持卡片拖拽排序</li>
          <li>支持关联功能</li>
        </ul>
      </div>
      
      <CardSystem
        cards={cards}
        title="卡片系统演示"
        onAddCard={handleAddCard}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
        onAddChildCard={handleAddChildCard}
        onRelateCard={handleRelateCard}
        onUnrelateCard={handleUnrelateCard}
        onChangeLayoutStyle={handleChangeLayoutStyle}
        moveCard={handleMoveCard}
        attributeOptions={attributeOptions}
        availableRelateItems={availableRelateItems}
        addButtonText="添加新卡片"
        defaultCollapsed={true}
      />
    </div>
  );
};

export default CardSystemDemo; 