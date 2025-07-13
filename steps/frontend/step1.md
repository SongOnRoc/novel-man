## 第1步：创建项目基础结构

**执行命令**：
```
mkdir -p frontend
cd frontend
pnpm create next-app .
```

**执行目的**：
创建一个新的Next.js项目作为我们的小说管理系统前端。选择Next.js是因为：
1. 它提供了服务端渲染(SSR)和静态站点生成(SSG)能力，提高页面加载速度和SEO
2. 内置了文件系统路由，简化了路由配置
3. 提供了自动代码分割、图像优化等性能优化功能
4. 有活跃的社区和丰富的生态系统

**替代方案**：
- **Create React App**：只支持客户端渲染，不支持SSR，对SEO不友好
- **Vite + React**：开发服务器启动速度快，但缺少Next.js的SSR和文件系统路由功能
- **Gatsby**：适合内容型网站，对应用型项目支持不如Next.js全面

在创建过程中，建议选择以下选项：
- TypeScript：是（提供类型安全）
- ESLint：是（代码质量检查）
- Tailwind CSS：是（原子化CSS框架）
- src/ 目录：是（更好的代码组织）
- App Router：是（使用Next.js最新的路由系统）
- use Turbopack for `next dev`? : 是 
（Turbopack是Vercel团队开发的一个新一代JavaScript打包工具，专为Next.js项目优化。选择"Yes"意味着在开发模式下（next dev命令）使用Turbopack替代默认的webpack作为开发服务器。
Turbopack的优势：
更快的启动速度：Turbopack可以显著减少开发服务器的启动时间，特别是在大型项目中
更快的热更新：代码修改后，页面刷新速度更快
增量计算：只重新计算变化的部分，而不是整个应用
内存优化：更高效的内存使用）
