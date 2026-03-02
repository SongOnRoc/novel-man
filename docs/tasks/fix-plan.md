# 项目问题清单与修复计划

> 基于 `docs/tasks/improve.md` 中列出的12个问题进行分类和修复计划制定
> 最后更新: 2026-02-13
> 状态: 待修复

---

## 一、问题分类总览

| 类别 | 问题编号 | 问题数量 | 优先级 |
|------|---------|---------|--------|
| A. AI 助手交互问题 | #1, #2, #3, #4, #5 | 5 | P0 (高) |
| B. 浏览器兼容性 & 渲染问题 | #6, #9, #10 | 3 | P1 (中高) |
| C. 移动端适配问题 | #7 | 1 | P2 (中) |
| D. 提示词功能问题 | #8 | 1 | P1 (中高) |
| E. 作品管理逻辑问题 | #11, #12 | 2 | P0 (高) |

---

## 二、问题详情与分析

### A. AI 助手交互问题 (P0)

#### A1. [#1] 选中文字未自动添加到 AI 对话内容

- **描述**: 编辑器中选中的文字没有自动添加到 AI 对话内容里
- **涉及文件**:
  - `frontend/src/features/editor/components/TiptapEditor.tsx` — 编辑器组件，负责获取选中文本并传递 `selectedText`
  - `frontend/src/features/ai/components/chat/AIChatInterface.tsx` — AI 聊天接口组件，接收 `selectedText` prop
  - `frontend/src/components/assistant-ui/thread.tsx` — Thread 组件，使用 `selectedText`
  - `frontend/src/lib/ai/runtime.tsx` — AI Runtime，负责构建请求
- **根因分析**: `selectedText` 通过 props 传递到 `AIChatInterface`，但在用户发送消息时未将 `selectedText` 自动拼接到用户输入中或作为上下文发送
- **修复方案**:
  1. 在 `AIChatInterface` 或 `thread.tsx` 中，当 `selectedText` 存在时，在发送消息前自动将选中文本作为引用上下文附加到用户消息中
  2. 在 Runtime 的 `chatModelAdapter.run()` 中，将 `selectedText` 注入到 `messages` 或 `context` 字段
  3. UI 上显示已选中文本的预览提示

#### A2. [#2] 提示词选择仅对本轮对话有效

- **描述**: 选择的提示词只对本轮对话有效，预期是提示词选择后持续生效
- **涉及文件**:
  - `frontend/src/features/ai/components/prompt-selector/useSelectedPromptStore.ts` — Zustand store，管理选中的 prompt ID
  - `frontend/src/components/assistant-ui/assistant-runtime-provider.tsx` — RuntimeConfig 中的 `getSelectedPromptId` 和 `onMessageSent`
  - `frontend/src/lib/ai/runtime.tsx` — 发送消息后调用 `onMessageSent` 清除选中状态
- **根因分析**: `runtime.tsx` 中 `onMessageSent` 回调在每次发送消息后调用 `clearSelectedPrompt()`，导致提示词被清除
- **修复方案**:
  1. 移除 `onMessageSent` 中自动清除提示词的逻辑
  2. 在 `useSelectedPromptStore` 中增加 `persistent` 标志，区分"持续使用"和"单次使用"模式
  3. 提供 UI 开关让用户选择提示词是否持续生效，默认为持续生效
  4. 仅在用户手动取消选择或切换提示词时才清除

#### A3. [#3] 空白内容提示词显示逻辑问题

- **描述**: 空白内容提示词需要修改；提示词不需要在每一个空行都显示，光标所在的空白行显示即可
- **涉及文件**:
  - `frontend/src/features/editor/components/TiptapEditor.tsx` — 编辑器组件
  - `frontend/src/features/ai/components/mobile/MobileQuickActions.tsx` — 快捷操作组件
- **根因分析**: 当前可能在所有空行都渲染了提示词浮动框，而不是仅在光标所在行
- **修复方案**:
  1. 监听编辑器光标位置变化事件（Tiptap `onSelectionUpdate`）
  2. 仅在光标所在的空白行显示提示词浮动框
  3. 当光标移到非空行或有内容的行时隐藏浮动框
  4. 优化空白内容提示词的文案

#### A4. [#4] "问问AI"遮挡正文

- **描述**: 需要解决问问AI遮挡正文的问题
- **涉及文件**:
  - `frontend/src/features/ai/components/AIFloatingButton.tsx` — AI 浮动按钮
  - `frontend/src/features/ai/components/AISidebar.tsx` — AI 侧边栏
  - `frontend/src/features/editor/components/SidePanelContainer.tsx` — 侧面板容器
  - `frontend/src/features/editor/components/TiptapEditor.tsx` — 编辑器布局
- **根因分析**: AI 对话面板（侧边栏或浮动窗口）使用了绝对定位或 overlay 模式，覆盖在编辑器正文之上
- **修复方案**:
  1. 将 AI 面板改为侧边栏推挤布局模式（而非覆盖）——展开时编辑器区域自动缩小
  2. 或提供可拖拽/调整大小的分栏布局（使用 `resizable` 组件）
  3. 移动端保持沉浸式全屏模式不变

#### A5. [#5] "问问AI"框的编辑按钮考虑去掉

- **描述**: 问问AI框的编辑按钮考虑去掉
- **涉及文件**:
  - `frontend/src/features/ai/components/AIFloatingButton.tsx` — 浮动按钮组件
  - `frontend/src/features/ai/components/mobile/MobileAIFloatingBar.tsx` — 移动端浮动栏
- **修复方案**:
  1. 移除 AI 浮动框中的编辑按钮
  2. 简化浮动框 UI，仅保留核心交互入口

---

### B. 浏览器兼容性 & 渲染问题 (P1)

#### B1. [#6] 部分浏览器沉浸页面首次展开不可见 & 顶部空白

- **描述**: 部分浏览器问问AI沉浸页面第一次展开不可见，以及顶部空白问题
- **涉及文件**:
  - `frontend/src/features/ai/components/mobile/MobileAIImmersive.tsx` — 移动端沉浸式组件
  - `frontend/src/features/ai/components/mobile/hooks/useMobileViewport.ts` — 视口 hook
  - `frontend/src/styles/modern-ui-system.css` — UI 系统样式
- **根因分析**: 可能是 CSS 动画/transition 初始状态问题，或视口高度计算在某些浏览器上不准确
- **修复方案**:
  1. 检查沉浸式页面的初始 CSS 状态（opacity、transform、visibility）
  2. 使用 `requestAnimationFrame` 或 `setTimeout` 延迟首次动画触发
  3. 修复视口高度计算，使用 `window.visualViewport` API 替代 `window.innerHeight`
  4. 添加浏览器兼容性前缀

#### B2. [#9] 编辑页面顶部不显示（疑似卡输入法 / 顶部状态栏问题）

- **描述**: 编辑页面会出现顶部不显示的情况，疑似卡输入法，换浏览器发现顶部状态栏在顶层但没有显示出来
- **涉及文件**:
  - `frontend/src/features/editor/components/EditorToolbar.tsx` — 编辑器工具栏
  - `frontend/src/features/editor/components/TiptapEditor.tsx` — 编辑器主组件
  - `frontend/src/app/(main)/layout.tsx` — 主布局
- **根因分析**: 顶部工具栏/状态栏可能存在 z-index 层叠问题，或在输入法唤起时布局被压缩
- **修复方案**:
  1. 检查并修复顶部工具栏的 `z-index` 层级
  2. 确保工具栏使用 `position: sticky` 并正确设置 `top` 值
  3. 添加输入法唤起时的视口变化监听和布局调整
  4. 测试 Edge、Chrome、Firefox 下的表现

#### B3. [#10] Edge 浏览器顶层渲染问题

- **描述**: 要确认下为什么在Edge里面顶层有时候无法渲染出来
- **涉及文件**: 同 B2
- **根因分析**: 可能是 Edge 特有的渲染引擎问题，与 `backdrop-filter` 或 CSS 动画相关
- **修复方案**:
  1. 排查 Edge 浏览器的 CSS 兼容性问题（特别是 `backdrop-filter`、`will-change`）
  2. 添加 `-webkit-` 前缀和 fallback 样式
  3. 检查是否有 GPU 加速相关的渲染 Bug
  4. 在 `liquid-glass.css` 和 `modern-ui-system.css` 中增加 Edge 兼容处理

---

### C. 移动端适配问题 (P2)

#### C1. [#7] 移动端选择模型空间太多

- **描述**: 移动端选择模型空间太多，建议只显示图标或者缩小
- **涉及文件**:
  - `frontend/src/features/ai/components/chat/AIChatInterface.tsx` — 模型选择 UI
  - `frontend/src/components/assistant-ui/ai-settings-dialog.tsx` — AI 设置对话框
  - `frontend/src/hooks/ai/useAIModels.ts` — 模型数据 hook
- **修复方案**:
  1. 在移动端使用 `useMediaQuery` 检测设备宽度
  2. 移动端模型选择器仅显示图标 + 简短名称，或使用下拉选择
  3. 减小模型选择区域的 padding 和 font-size
  4. 考虑将模型选择折叠到设置面板中

---

### D. 提示词功能问题 (P1)

#### D1. [#8] 提示词界面无法预览/收藏 + 显示逻辑错误

- **描述**: 选择提示词界面无法预览无法收藏；内置提示词不需要预览收藏按钮，应该显示描述而不是 content
- **涉及文件**:
  - `frontend/src/features/ai/components/prompt-selector/PromptSelector.tsx` — 提示词选择器
  - `frontend/src/features/ai/components/prompt-selector/PromptPreviewCard.tsx` — 提示词预览卡片
  - `frontend/src/features/ai/components/prompt-selector/PromptItem.tsx` — 提示词列表项
  - `frontend/src/features/ai/components/prompt-selector/PromptListContainer.tsx` — 列表容器
- **修复方案**:
  1. **预览功能**: 在 `PromptSelector` 中实现 hover 或点击预览，显示 `PromptPreviewCard`
  2. **收藏功能**: 确保 `onToggleFavorite` 回调正确连接到后端 API（`favorites` 模块）
  3. **内置提示词处理**:
     - 使用 `builtInPromptIds` 判断是否为内置提示词
     - 内置提示词：隐藏预览和收藏按钮，显示 `description` 字段
     - 用户提示词：显示预览和收藏按钮，显示 `content` 字段摘要
  4. 在 `PromptItem` 中根据 `isBuiltIn` 条件渲染不同的 UI

---

### E. 作品管理逻辑问题 (P0)

#### E1. [#11] 作品管理混乱：章节列表缺失 & 草稿隔离问题

- **描述**: 作品管理里很糟糕——章节没有章节列表，整个管理逻辑紊乱，新建的作品里竟然能看到其他草稿
- **涉及文件**:
  - `frontend/src/app/(main)/works/[id]/chapters/page.tsx` — 章节页面
  - `frontend/src/app/(main)/works/[id]/chapters/components/chapter-list.tsx` — 章节列表组件
  - `frontend/src/app/(main)/works/[id]/page.tsx` — 作品详情页
  - `frontend/src/hooks/chapter/useChapterService.ts` — 章节服务 hook
  - `frontend/src/hooks/draft/useDraftService.ts` — 草稿服务 hook
  - `frontend/src/app/(main)/drafts/page.tsx` — 草稿页面
- **根因分析**:
  1. 章节列表页面可能未正确渲染或路由配置有问题
  2. 草稿查询时 `work_id` 过滤参数未正确传递，导致显示了所有用户的草稿而非当前作品的草稿
- **修复方案**:
  1. **章节列表**: 确保 `works/[id]/chapters/page.tsx` 正确调用 `useChapterList({ workId })` 并渲染章节列表
  2. **草稿隔离**: 在作品详情页或草稿标签页中，确保查询草稿时携带 `work_id` 参数进行过滤
  3. **导航逻辑**: 梳理作品详情页的导航卡片，确保"章节管理"链接正确跳转
  4. **数据验证**: 后端 API `/drafts?work_id=xxx` 需确认正确过滤

#### E2. [#12] 作品功能全面梳理

- **描述**: 整个作品里的功能都需要重新梳理一遍
- **涉及文件**:
  - `frontend/src/app/(main)/works/` — 作品相关所有页面
  - `frontend/src/features/works/` — 作品功能组件
  - `frontend/src/features/chapters/` — 章节功能组件
  - `frontend/src/features/worldview/` — 世界观功能
  - `frontend/src/features/characters/` — 角色功能
- **修复方案**:
  1. **功能审计**: 逐页检查作品模块下所有子页面的功能完整性
     - `/works` — 作品列表
     - `/works/new` — 新建作品
     - `/works/[id]` — 作品详情（导航中心）
     - `/works/[id]/edit` — 编辑作品信息
     - `/works/[id]/chapters` — 章节管理
     - `/works/[id]/chapters/[chapterId]` — 章节详情
     - `/works/[id]/chapters/[chapterId]/edit` — 章节编辑
     - `/works/[id]/characters` — 角色管理
     - `/works/[id]/outline` — 大纲管理
     - `/works/[id]/world` — 世界观管理
  2. **导航一致性**: 确保每个子页面都有返回父页面的面包屑和导航
  3. **CRUD 完整性**: 验证每个模块的创建、读取、更新、删除操作都正常工作
  4. **数据隔离**: 确保所有子模块的数据都正确关联到当前作品 (`work_id`)

---

## 三、修复计划

### 第一阶段：P0 紧急修复 (预计 3-5 天)

| 序号 | 任务 | 问题编号 | 预计工时 |
|------|------|---------|---------|
| 1.1 | 修复选中文字未注入 AI 对话 | #1 (A1) | 4h |
| 1.2 | 修复提示词持续生效逻辑 | #2 (A2) | 3h |
| 1.3 | 修复"问问AI"遮挡正文 | #4 (A4) | 6h |
| 1.4 | 修复作品管理章节列表 & 草稿隔离 | #11 (E1) | 8h |
| 1.5 | 作品功能全面梳理与修复 | #12 (E2) | 16h |

### 第二阶段：P1 重要修复 (预计 2-3 天)

| 序号 | 任务 | 问题编号 | 预计工时 |
|------|------|---------|---------|
| 2.1 | 修复提示词预览/收藏/显示逻辑 | #8 (D1) | 6h |
| 2.2 | 修复沉浸页面首次展开不可见 | #6 (B1) | 4h |
| 2.3 | 修复编辑页面顶部不显示 | #9 (B2) | 4h |
| 2.4 | 排查 Edge 浏览器渲染问题 | #10 (B3) | 3h |

### 第三阶段：P2 体验优化 (预计 1-2 天)

| 序号 | 任务 | 问题编号 | 预计工时 |
|------|------|---------|---------|
| 3.1 | 空白内容提示词仅光标行显示 | #3 (A3) | 4h |
| 3.2 | 移除AI框编辑按钮 | #5 (A5) | 1h |
| 3.3 | 移动端模型选择器优化 | #7 (C1) | 3h |

---

## 四、附加发现的技术债务

通过 TypeScript 编译检查 (`tsc --noEmit`)，还发现以下代码质量问题需要一并修复：

### T1. 测试文件类型错误

- `frontend/src/features/editor/components/EditorToolbar.test.tsx` — `EditorToolbarProps` 接口变更后测试未更新，缺少 `title`, `settings`, `onSettingsChange` 属性 (20+ 处错误)
- `frontend/src/hooks/ai/useAIAssistant.test.tsx` — 引用了不存在的模块 `@/lib/api/ai` 和 `@/types/ai`
- `frontend/src/hooks/lookup/useLookup.test.ts` — 引用了不存在的模块 `./useLookup`、`@/hooks/worldbuilding/useWorldbuilding`、`@/types/character`、`@/types/worldbuilding`
- `frontend/src/hooks/prompt/usePromptService.test.tsx` — 缺少 `vi` 命名空间引用（Vitest 类型配置问题）

### T2. 技术债务修复建议

| 序号 | 任务 | 预计工时 |
|------|------|---------|
| T2.1 | 更新 `EditorToolbar.test.tsx` 适配新 Props | 2h |
| T2.2 | 修复 `useAIAssistant.test.tsx` 模块路径 | 1h |
| T2.3 | 修复或删除 `useLookup.test.ts` 无效测试 | 1h |
| T2.4 | 修复 `usePromptService.test.tsx` Vitest 类型配置 | 1h |

---

## 五、执行原则

1. **每个修复任务独立分支**: 使用 `fix/issue-{编号}` 命名
2. **修复前先读取当前代码**: 不可凭空想象代码内容
3. **修复后必须验证**: 运行 `tsc --noEmit` 确保无类型错误
4. **记录到 steps**: 每个修复完成后在 `docs/steps/frontend/` 追加对应 step 文件
5. **更新 Memory Bank**: 完成修复后更新 `memory_bank/activeContext.md`
