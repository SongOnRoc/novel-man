# 智能提取功能重构

- Task：extract-character
- Type：refact
- 开始日期：2026-05-08

## 背景

当前章节分析功能（`ChapterAnalysisPanel` / `ChapterAnalysisSheet`）仅支持 `outline` / `characters` 两种类型，结果以纯文本列表展示。设计稿（桌面端 `extract-character-desktop.pen`、移动端 `extract-character-mobile-v5.pen`）要求：

1. 扩展为 3 种提取类型：角色 / 世界观 / 纲要
2. 候选结果以富卡片展示（状态徽章、匹配信息、操作按钮、身份锚点）
3. 桌面端双栏布局（阅读器 + 编排器），移动端底部 Sheet + 弹窗
4. 正文区对象词高亮（角色=绿、世界观=蓝、情节=橙）
5. 候选与已有角色/世界观模块的匹配与确认流程

## 目标

1. 重构章节智能提取 UI，完整对齐设计稿的桌面端和移动端交互
2. 桌面端优先实现，移动端通过组合式复用共享组件快速适配
3. 数据模型从 `{ heading, summary, items: string[] }` 扩展为 `ExtractCandidate[]` 富卡片
4. 复用现有 AI API + 内置固定提示词 id 机制，默认一次综合请求同时提取角色/世界观/纲要
5. 前端侧做名称匹配（已有 Character / Worldview 数据），生成"已命中/疑似/未命中"状态

## 范围

### 包含

- `ExtractKind` 类型扩展（outline → characters / worldview / outline）
- AI 调用层：默认使用一个综合提取固定 `prompt_id`；精细化管理时再使用专项固定 `prompt_id`
- 前端解析层：将 AI 返回的带标记文本映射为 `ExtractCandidate[]`
- 桌面端：双栏布局（ExtractReader + ExtractWorkflow），替换现有 `ChapterAnalysisPanel`
- 移动端：底部 Sheet 适配，替换现有 `ChapterAnalysisSheet`
- 候选卡片交互：P0 实现"查看详情"+"忽略"
- 对象词高亮：正文区角色/世界观/情节词彩标
- 现有匹配：前端侧名称匹配与置信度

### 不包含（P1 后续迭代）

- 候选操作："追加经历"（需 `updateCharacter` API 集成）
- 候选操作："新建设定"（需 `createWorldviewItem` API 集成）
- "选择候选"确认流程
- 段落选择模式（`ChapterSelectionMode`）的重构（沿用现有实现）
- 身份校验锚点的"展开"交互细节
- 跨对象线索提示的完整交互

## 验收标准

1. 桌面端双栏布局对齐设计稿 `extract-character-desktop.pen`
2. 移动端底部 Sheet + 弹窗对齐设计稿 `extract-character-mobile-v5.pen`
3. 默认一次请求返回角色/世界观/纲要三类候选；标签页仅切换前端展示，不重复请求
4. 候选卡片正确显示状态徽章（已命中/疑似/未命中）、名称、描述
5. "查看详情"按钮可跳转到对应角色/世界观详情页
6. "忽略"按钮可移除候选卡片
7. 对象词高亮功能在正文中正确标记名词条目
8. 桌面与移动端共享核心组件，差异仅限布局层

## 约束与风险

1. **AI 返回格式不确定性**：AI 输出格式可能不稳定，解析失败时进入错误态并允许重试，不使用 mock 或本地伪造结果
2. **名称匹配精度**：前端纯名称匹配可能产生误匹配，P0 仅做精确 + 前缀匹配
3. **现有组件兼容**：`ChapterAnalysisPanel` / `ChapterAnalysisSheet` 需要被新组件替代，需确保页面集成无误
4. **响应式断点**：沿用 `768px` 断点
5. **旧 AI 调用字段替换**：旧章节分析链路中仍可能存在 `assistant_type` 字段，它属于历史兼容实现，预计由固定系统提示词 `prompt_id` 替换；新智能提取链路不再依赖该字段

## 初步计划

### 阶段 1：数据模型 + AI 调用层（桌面优先）

1. 定义 `ExtractKind`、`ExtractCandidate`、`ExtractResult` 类型
2. 实现 `useExtractService` — 默认综合固定 `prompt_id` 的 `/generate` 调用；预留专项重提取入口
3. 实现 `parseExtractResponse` — 解析带标记文本为 `ExtractCandidate[]`
4. 实现 `useExtractWorkflow` — 状态管理 Hook

### 阶段 2：桌面端核心组件

5. 实现 `ExtractKindTabs`（标签行）
6. 实现 `ExtractCandidateCard`（候选卡片）
7. 实现 `ExtractModeCard`（模式说明卡）
8. 实现 `ExtractDesktopPanel`（双栏容器）
9. 实现 `ExtractReader`（带对象词高亮的阅读区）

### 阶段 3：移动端适配

10. 实现 `ExtractMobileSheet`（Sheet 包装）
11. 实现 `ExtractDetailDialog`（详情弹窗）
12. 页面集成：替换 `ChapterAnalysisPanel` / `ChapterAnalysisSheet`

### 阶段 4：匹配逻辑 + P0 交互

13. 实现名称匹配逻辑（精确 + 前缀）
14. 实现"查看详情"跳转
15. 实现"忽略"操作
