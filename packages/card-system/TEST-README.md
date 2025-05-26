# 卡片系统测试说明

本文档提供了卡片系统组件的测试指南和常见问题解决方法。

## 测试文件结构

测试文件位于 `src/__tests__` 目录下，包括：

- `card-factory.test.ts` - 测试卡片工厂类
- `card-component.test.tsx` - 测试卡片组件
- `dialogs.test.tsx` - 测试对话框组件
- `card-system.test.tsx` - 测试卡片系统组件

## 运行测试

### 命令行运行

```bash
# 运行所有测试
npm test

# 运行单个测试文件
npx jest card-factory.test.ts

# 运行测试并监视文件变化
npm run test:watch
```

### 使用 VSCode 调试器运行

1. 打开 VSCode 调试视图（Ctrl+Shift+D）
2. 从下拉菜单中选择以下选项之一：
   - "Jest: 当前文件" - 运行当前打开的测试文件
   - "Jest: 所有测试" - 运行所有测试
   - "Jest: 调试卡片系统测试" - 调试模式运行所有测试
   - "运行卡片系统测试脚本" - 使用自定义脚本运行测试
3. 点击绿色的运行按钮或按 F5 开始测试

## 常见问题解决

### 类型错误

如果遇到类型错误，请确保：

1. `tsconfig.json` 中包含了正确的类型定义：
   ```json
   "compilerOptions": {
     "types": ["node", "jest", "@testing-library/jest-dom"]
   }
   ```

2. 已安装所有必要的类型定义包：
   ```bash
   npm install --save-dev @types/jest @types/testing-library__jest-dom
   ```

### 测试无法找到组件

如果测试无法找到组件，可能是因为：

1. 模块导入路径错误
2. 模块导出方式不正确
3. 模块模拟（mock）配置错误

请检查导入语句和模块导出，确保它们正确匹配。

### 测试超时

如果测试超时，可以尝试：

1. 增加超时时间：
   ```javascript
   test("my slow test", () => {
     // ...
   }, 10000); // 10秒超时
   ```

2. 检查是否有异步操作未正确处理

## 添加新测试

添加新测试时，请遵循以下步骤：

1. 在 `src/__tests__` 目录下创建新的测试文件，命名格式为 `*.test.ts` 或 `*.test.tsx`
2. 导入要测试的组件和必要的测试工具
3. 编写测试用例，确保覆盖关键功能和边缘情况
4. 运行测试确保通过

## 测试覆盖率

运行以下命令查看测试覆盖率报告：

```bash
npm test -- --coverage
```

覆盖率报告将显示在控制台中，并在 `coverage` 目录下生成详细报告。 