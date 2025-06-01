import { v4 as uuidv4 } from "uuid";
import { type BaseCardProps, CardContainerType, type CardFactory, type CardProperty } from "./types";

/**
 * 卡片工厂实现，用于创建卡片
 */
export class DefaultCardFactory implements CardFactory {
  /**
   * 创建卡片
   * @param options 卡片选项
   * @returns 创建的卡片
   */
  createCard(options: {
    title: string;
    containerType: CardContainerType;
    tag?: string;
    parent?: string;
    props?: CardProperty[];
    hideTitle?: boolean;
    isCollapsed?: boolean;
    parentCardCount?: number;
  }): BaseCardProps {
    const {
      title,
      containerType,
      tag,
      parent,
      props = [],
      hideTitle = false,
      isCollapsed = true,
      parentCardCount,
    } = options;

    // 生成卡片ID
    const id = uuidv4();

    // 生成卡片标签
    let cardTag = tag;
    if (!cardTag && parent) {
      // 如果没有提供标签但有父卡片，则根据卡片类型和属性生成
      if (containerType === CardContainerType.COLLECTION) {
        // 集合卡片：使用父标签-属性名
        if (props.length > 0) {
          cardTag = `${parent}-${props[0].name}`;
        } else {
          cardTag = `${parent}-${Date.now().toString(36)}`;
        }
      } else {
        // 编辑器卡片
        if (props.length > 0 && props[0].name !== "custom") {
          // 有属性且不是自定义属性：使用父标签-属性名
          cardTag = `${parent}-${props[0].name}`;
        } else {
          // 没有属性或属性为custom：使用父标签-序号
          // 使用父容器中的卡片数量作为序号
          const index = parentCardCount ? parentCardCount + 1 : 1;
          cardTag = `${parent}-${index}`;
        }
      }
    }

    // 创建卡片
    const card: BaseCardProps = {
      id,
      title,
      containerType,
      tag: cardTag,
      parent,
      props,
      hideTitle,
      isCollapsed,
      isVisible: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 根据容器类型设置默认属性
    if (containerType === CardContainerType.COLLECTION) {
      card.childCards = [];
      card.showAddButton = true;
      card.showLayoutStyleButton = true;
      card.showRelateButton = false;
      card.showVisibilityButton = true;
    } else if (containerType === CardContainerType.EDITOR) {
      card.content = "";
      card.showAddButton = false;
      card.showLayoutStyleButton = false;
      card.showRelateButton = true;
      card.showVisibilityButton = false;
    }

    return card;
  }
}
