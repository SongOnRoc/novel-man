# 作品详情页 · 作品管理区 Tab 响应式改造

> 记录作品详情页（`/works/[id]`）「作品管理区」（章节/草稿/大纲/角色/设定 五个 Tab 预览）的布局问题、最终响应式方案与遗留项。
>
> **方案以代码为准**：移动端 Tab 切换采用**底部固定导航栏**（非早期计划的「顶部单栏横滑」，该计划已废弃）。
>
> 相关文件：`frontend/src/app/(main)/works/[id]/page.tsx`、`frontend/src/features/works/components/WorkOverviewHeader.tsx`、`frontend/src/features/works/components/WorkMobileStickyActions.tsx`
>
> 上游背景见 [`draft-chapter-flow.md`](./draft-chapter-flow.md)（草稿→章节流程铁律、导入为草稿 + 批量发布方案 A）。

---

## 一、定位与设计原则（已对齐）

- **作品详情页 Tab = 预览**：每个 Tab 是该元素的概览快照（最近 N 条 / 入口卡），用于快速了解"这部作品现在什么样"。
- **侧边栏导航到的页面 = 实际功能**：完整列表、搜索、分页、增删改。
- 二者**职责不同、不重复**，是"预览 vs 功能"两个层次。
- **响应式原则**：内容（列表、卡片、Hero 数据带等）一律单套 DOM + Tailwind 断点区分（见 `ui-design-language.md` 第十五节）。
  - **例外（有意为之）**：本页 **Tab 切换控件**采用平台差异化导航——桌面端顶部 pill 栏（`hidden lg:flex`）、移动端底部固定导航栏（`lg:hidden`）。二者是**不同位置/不同交互的导航控件**（顶部标签 vs 底部 app 式 tab bar），而非"同一段内容渲染两套 DOM"，因此不视为违反双 DOM 铁律。除 Tab 切换控件外，其余内容严格单套响应式。
- 视觉规范严格遵循 `ui-design-language.md`：teal 主色 token、圆角层级 16→12→8→full、按钮体系第八节、阴影极致克制、优先 shadcn/ui 组件。

---

## 二、核心问题清单

| # | 问题 | 现象 | 状态 |
|---|---|---|---|
| P1 | 桌面端"查看全部"飘在中间 | 它在 `ManagementSection` 的 action header 行，夹在 tab 栏分隔线与列表之间的空白带里，独占一行悬浮 | ✅ 已解决 |
| P2 | 章节/草稿 tab 内容区有居中的"查看全部"Button | `<ManagementSection action={Button outline}>` | ✅ 已删除（移到桌面 tab 行右端文字链 + 移动端列表底部入口） |
| P3 | 移动端无 tab 切换器 | 早期 tab 栏 `hidden lg:flex`，移动端整个隐藏且无替代 → 移动端切不了 tab | ✅ 已解决（底部固定导航栏） |
| P4 | 移动端"查看全部"入口缺失 | 桌面端的 tab 行右端文字链不适合移动端（窄、被底部导航遮挡风险） | ✅ 已解决（列表底部 `MobileViewAllLink` 整行入口） |
| P5 | 大纲/角色/设定 双标题 | `ManagementPlaceholder` 内部多包了一层 `<ManagementSection title>`，与卡片内标题重复 → 标题出现两次 | ✅ 已解决（直接返回卡片 `<Link>`） |
| P6 | 草稿 TabsContent 块脏数据 | 草稿 `ManagementSection` 残留居中 `action={Button 查看全部}`；缩进偏移 | ✅ 已解决（删 action + prettier 归位） |

---

## 三、最终响应式方案（已落地）

### 3.1 Tab 切换（平台差异化导航）
- **桌面端（`lg` ≥1024px）**：顶部 pill tab 栏，容器 `hidden border-b pb-3 lg:flex lg:items-center lg:justify-between`；`TabsList` 加 `overflow-x-auto`。右端「查看全部」文字链（见 3.2）。
- **移动端（`< lg`）**：**贴底通栏菜单**（微信式）`fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur-md pb-safe lg:hidden`——左右贴边、底部贴边、仅顶部一条分隔线（非悬浮胶囊）。内部 tab `flex-1` 等分、`mx-auto max-w-lg` 居中（平板不过宽）；每个 tab 为「**图标 + 文字**」（章节 `BookOpen` / 草稿 `FileText` / 大纲 `PenTool` / 角色 `Users` / 设定 `Settings`，与各模块入口卡图标一致），active 时图标 + 文字同变 `--primary-600`；`pb-safe` 适配 iPhone 底部安全区（`globals.css` 已定义 `.pb-safe`）。
  - 内容滚动容器加 `pb-24 lg:pb-0` 给通栏避让，移动端列表不被遮挡。
  - 历史：早期为四周留白的**悬浮胶囊**（`inset-x-3 bottom-3 rounded-2xl` + 圆点指示），因"完全悬浮、不像贴底菜单"已改为上述贴底通栏。

### 3.2 「查看全部」入口（断点区分）
- **桌面端**：tab 行右端文字链，仅 `activeTab ∈ {chapters, drafts}` 显示，`href={/works/[id]/${activeTab}}`（在 `hidden lg:flex` 容器内，移动端不渲染）。
- **移动端**：预览列表底部整行入口 `MobileViewAllLink`（`lg:hidden`），带数量：
  - 章节 → `/works/[id]/chapters`，`count = work.totalChapterCount || chapters.length`，单位「章」。
  - 草稿 → `/works/[id]/drafts`，`count = draftTotal`，单位「篇」。
  - 仅在 `list.length > 0` 分支末尾、`space-y-3` 列表内最后一项渲染。

### 3.3 Tab 内容形态（统一，去重复标题）
- **章节/草稿**：`<ManagementSection>`（无 title、无 action）+ 预览列表（响应式卡片）+ 移动端底部 `MobileViewAllLink`。
- **大纲/角色/设定**：`ManagementPlaceholder` **直接返回入口卡 `<Link>`**（图标 + 单一标题 + 描述 + "进入X ›"），已去掉内层 `ManagementSection`，标题仅出现一次。cta 文案收敛为「进入大纲 / 进入角色 / 进入设定」（≤5 字）。

### 3.4 Hero 操作按钮（已统一，保留不动）
- 桌面端：`WorkOverviewHeader` 的 `DesktopAction`（新建草稿 / 编辑 / 导入文件），`h-11 rounded-full`，主按钮实色 + 次要 ghost。
- 移动端：`WorkMobileStickyActions`（外层"新建草稿" + "更多"→底部 Sheet：章节管理 / 编辑作品 / 导入文件）。
- `导入文件` 触发受控 `ImportDialog`（`trigger={null}`，不渲染默认按钮）。

---

## 四、进度

### ✅ 已完成（全部）
- **P1/P2**：桌面端 tab 栏 `lg:flex justify-between`，"查看全部"移到 tab 行右端文字链；章节 + 草稿 `ManagementSection` 删除居中 action。
- **P3**：移动端底部固定导航栏（5 tab 圆点切换器），内容区 `pb-20` 避让。
- **P4**：章节/草稿列表底部新增 `MobileViewAllLink`（`lg:hidden`，带数量），桌面端隐藏、移动端显示，与桌面顶部文字链互补不重复。
- **P5**：`ManagementPlaceholder` 去掉内层 `ManagementSection`，直接返回卡片 `<Link>`，标题单一。
- **P6**：草稿 `ManagementSection` 删除残留 `action`；整文件 prettier 归位。
- **cta 文案收敛**：进入大纲模块/角色模块/设定模块 → 进入大纲/角色/设定。
- 导入文件入口统一到作品详情页 Hero（桌面 + 移动 Sheet）；`ImportDialog` 受控（`trigger={null}` 不出默认按钮）。
- **回归**：`npx tsc --noEmit` 筛 page.tsx 无类型错误；prettier 格式化通过。

### ⬜ 待办（可选）
1. **移动端整体验证**：移动端视口截图复核底部固定导航切换、列表底部"查看全部"、Hero Sheet、`pb-20` 避让是否充分。
2. 视觉走查桌面端 tab 行右端文字链与列表间距。

### 🚫 预存失败测试（与本次改造无关，未处理）
- `e2e/*.spec.ts`（playwright 被 vitest 误收）
- `EditorToolbar.test.tsx`、`useAIAssistant.test.tsx`、`useLookup.test.ts`（缺模块 / prop 变更）
- 全局 `/drafts`、`chapter/[chapterId]` 等页面测试（work-layout 重构遗留的陈旧断言）
- 注：`works/[id]/page.test.tsx` 不存在，本页无专门页面测试。

---

## 五、工具注意事项（重要）

- `page.tsx` 路径含 `[id]` 与 `(main)` 等特殊字符，历史上 Read/Grep/Edit 曾**间歇性返回污染内容、Edit 假报成功实际不写入**（同一批多个 Edit 只有部分落地）。
- 经验做法：
  - **Edit 后用 Grep（count 模式）或小范围 Read 复核是否真落地**，不轻信"成功"反馈。
  - 多个相邻小改动易部分失败时，**合并成一个较大的 Edit** 反而更容易整体落地；分散在不同位置的改动则逐个 Edit + 计数复核。
  - 跑 prettier / tsc 等命令时路径用引号包裹（`"src/app/(main)/works/[id]/page.tsx"`），避免 shell 把 `(`、`[` 当特殊字符。
- 当前状态：假报问题已不复现，本轮 8 处 Edit 一次性全部落地（Grep 计数复核通过），但仍建议关键改动读回确认。

---

## 六、验证方式

- 功能落地：Grep（count 模式）特征串计数——
  - `MobileViewAllLink` = 3（1 定义 + 2 调用）。
  - `进入大纲模块|进入角色模块|进入设定模块` = 0（cta 已收敛）。
  - `>查看全部` = 0（草稿残留 action 已删）。
  - `ManagementSection title` = 0（Placeholder 已去内层）。
- 类型：`cd frontend && npx tsc --noEmit 2>&1 | grep "works/\[id\]/page"`（空 = 无错）。
- 格式：`npx prettier --write "src/app/(main)/works/[id]/page.tsx"`。
- 视觉：桌面端 + 移动端两套视口截图复核（tab 行 / 底部导航 / 查看全部 / 列表间距 / Sheet）。

---

## 修订记录
- **2026-06-25**：初稿。记录 tab 区响应式改造的问题/方案/遗留项；桌面端 P1/P2 已解决，移动端 P3/P4 进行中，P5/P6 待办。
- **2026-06-25（二次，定稿）**：移动端 Tab 定为**底部固定导航栏**（废弃早期「顶部单栏横滑」计划，文档据此重写）。落地 P3（底部导航切换器）、P4（列表底部 `MobileViewAllLink`）、P5（Placeholder 去双标题）、P6（草稿删残留 action + prettier）；cta 文案收敛。tsc 对 page.tsx 无错、prettier 通过、Grep 计数复核通过。剩余仅移动端截图走查（可选）。
- **2026-06-25（三次）**：移动端底部栏从**悬浮胶囊**（`inset-x-3 bottom-3 rounded-2xl` + 圆点）改为**微信式贴底通栏**（`inset-x-0 bottom-0 border-t` + 图标/文字 + `flex-1` 等分 + `pb-safe`），见 3.1。tsc/prettier 通过。
