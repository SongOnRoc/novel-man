# 卡片系统组件

这是一个灵活的卡片系统组件，支持编辑器和集合两种类型的卡片。

## 功能特性

- 支持编辑器卡片和集合卡片两种类型
- 支持卡片嵌套和拖拽排序
- 支持卡片折叠/展开
- 支持卡片关联功能
- 支持多种布局样式（垂直、水平、自适应）
- 完全可定制的按钮配置

## 安装

```bash
npm install @novel-man/card-system
```

## 使用方法

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

或者使用 VSCode 调试器运行测试：

1. 打开 VSCode 调试视图（Ctrl+Shift+D）
2. 从下拉菜单中选择以下选项之一：
   - "Jest: 当前文件" - 运行当前打开的测试文件
   - "Jest: 所有测试" - 运行所有测试
   - "Jest: 调试卡片系统测试" - 调试模式运行所有测试
   - "运行卡片系统测试脚本" - 使用自定义脚本运行测试
3. 点击绿色的运行按钮或按 F5 开始测试

## 许可证

MIT