# 决策日志
记录架构和实现决策。

---
### 错误分析 [配置错误] [2025-07-16 16:33:23] - VSCode tsserver 路径无效
**根本原因：** VS Code 工作区设置 (`.vscode/settings.json`) 中的 `typescript.tsdk` 路径错误。它指向了项目根目录下的 `node_modules`，但实际上 `node_modules` 位于 `frontend` 子目录中。
**修复方案：** 修正 `.vscode/settings.json` 文件中的 `typescript.tsdk` 路径为 `frontend/node_modules/typescript/lib`，使其与项目结构保持一致。