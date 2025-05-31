# 卡片系统演示页面

这个目录包含了卡片系统的演示页面，用于测试和展示卡片系统的功能。

## 功能特点

- 展示两种类型的卡片：编辑器类和集合类
- 演示卡片的折叠/展开、编辑标题、添加子卡片、删除等功能
- 展示集合类卡片的三种布局样式：上下排列、左右排列、自适应排列
- 演示卡片拖拽排序功能
- 展示卡片关联功能

## 如何运行

### 安装依赖

首先，确保已经安装了项目依赖：

```bash
# 在项目根目录下运行
npm install

# 或者在card-system包目录下运行
cd packages/card-system
npm install
```

### 安装开发依赖

为了运行演示页面，需要安装以下开发依赖：

```bash
npm install --save-dev webpack webpack-cli webpack-dev-server html-webpack-plugin ts-loader style-loader css-loader
```

### 运行演示页面

```bash
# 在card-system包目录下运行
npm run demo
```

这将启动一个开发服务器，并自动在浏览器中打开演示页面。

## 构建演示页面

如果你想构建演示页面而不启动开发服务器，可以运行：

```bash
npm run build:demo
```

构建后的文件将位于 `packages/card-system/src/manual-test/dist` 目录中。

## 演示页面结构

- `demo.tsx`: 演示组件的源代码
- `index.html`: 演示页面的HTML模板
- `webpack.config.js`: Webpack配置文件
- `README.md`: 本文档

## 自定义演示

你可以通过修改 `demo.tsx` 文件来自定义演示内容，例如添加更多的示例卡片、修改卡片属性等。 