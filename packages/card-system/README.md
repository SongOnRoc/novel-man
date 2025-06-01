# 卡片系统组件

这是一个灵活的卡片系统组件，支持编辑器和集合两种类型的卡片，具有内部状态管理功能。

## 功能特性

- 支持编辑器卡片和集合卡片两种类型
- 支持卡片嵌套和拖拽排序
- 支持卡片折叠/展开
- 支持卡片关联功能
- 支持多种布局样式（垂直、水平、自适应、网格、列表）
- 完全可定制的按钮配置
- 内部状态管理，无需外部实现处理函数

## 安装

```bash
npm install @novel-man/card-system
```

## 使用方法

### 新版用法（推荐）

新版卡片系统内部管理状态，只需提供初始数据和变更回调：

```jsx
import { CardSystem } from '@novel-man/card-system';
import { useState } from 'react';
import type { BaseCardProps } from '@novel-man/card-system';

function App() {
  const [cards, setCards] = useState<BaseCardProps[]>([]);
  
  const handleCardsChange = (updatedCards: BaseCardProps[]) => {
    setCards(updatedCards);
    // 可以在这里添加其他操作，如保存到数据库等
  };
  
  return (
    <CardSystem
      initialCards={cards}
      title="我的卡片系统"
      onCardsChange={handleCardsChange}
      attributeOptions={[
        { value: "desc", label: "描述" },
        { value: "ability", label: "能力" }
      ]}
      availableRelateItems={[
        { id: "item1", title: "相关项1", type: "chapter" }
      ]}
      addButtonText="添加卡片"
    />
  );
}
```

### 旧版用法（已弃用）

```jsx
import { CardSystem, CardContainerType } from '@novel-man/card-system';

function App() {
  const [cards, setCards] = useState([]);
  
  const handleAddCard = (containerType, title, hideTitle) => {
    // 添加卡片的逻辑
  };
  
  const handleUpdateCard = (id, updates) => {
    // 更新卡片的逻辑
  };
  
  return (
    <CardSystem
      cards={cards}
      title="我的卡片系统"
      onAddCard={handleAddCard}
      onUpdateCard={handleUpdateCard}
    />
  );
}
```

## 主要改进

相比之前的版本，当前卡片系统有以下主要改进：

1. **内部状态管理**：卡片系统现在内部管理自己的状态，不再需要外部实现各种处理函数（如添加、更新、删除卡片等）。

2. **简化的API**：只需提供初始卡片数据和一个变更回调函数，就可以使用完整的卡片系统功能。

3. **更好的封装**：所有卡片操作逻辑都封装在卡片系统内部，使用者只需关注数据的初始化和变更。

4. **更容易集成**：通过`onCardsChange`回调，可以轻松将卡片系统集成到任何状态管理方案中。

## 属性说明

| 属性名 | 类型 | 必填 | 说明 |
|-------|------|-----|------|
| initialCards | BaseCardProps[] | 否 | 初始卡片数据 |
| title | string | 是 | 卡片系统标题 |
| onCardsChange | (cards: BaseCardProps[]) => void | 否 | 卡片状态变更回调 |
| attributeOptions | Array<{ value: string; label: string }> | 否 | 可用的属性选项 |
| availableRelateItems | Array<{ id: string; title: string; type: string }> | 否 | 可关联的项目 |
| addButtonText | string | 否 | 添加按钮文本 |
| defaultCollapsed | boolean | 否 | 新卡片默认是否折叠 |
| isMobile | boolean | 否 | 是否为移动设备 |
| buttonsConfig | CardButtonsConfig | 否 | 按钮显示配置 |

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 运行测试

使用命令行运行测试：

```bash
npm test
```

## 许可证

MIT