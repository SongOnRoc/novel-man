# UI/UX 设计语言（基于 dashboard 工作台风格提炼 · v2）

> 本文档定义 novel-man 跨页面统一视觉契约。所有页面整改必须遵守。
>
> **修订背景**：原 v1（2026-05-26）基于「章节阅读页克制风」提炼，但 dashboard 等工作台页面需要更现代的 hero 表现力。v2（2026-05-28）以 dashboard 实际风格为基准，明确「工作台 / 阅读页」差异化原则。

---

## 〇、风格分层（关键前提）

novel-man 采用 **两类风格**，按页面语义选择：

| 类别 | 代表页面 | 视觉策略 |
|---|---|---|
| **工作台风**（hero） | dashboard / works / works/[id] / drafts / tools/* / settings | 半透明卡 + 毛玻璃 + 极淡渐变球 + 焦点徽章锚点，有空间感与现代感 |
| **阅读页克制风** | works/[id]/chapters/[chapterId] | 纯白卡 + 三层柔和阴影 + 章节锚点，保证阅读专注 |

**本文档以工作台风为主**。阅读页风格留待单独章节。

---

## 一、配色（来自 `modern-ui-system.css`）

| 类型 | Token | 值 | 用途 |
|---|---|---|---|
| 主品牌色 | `var(--primary-500)` | `#14b8a6` 翡翠绿 | CTA、焦点徽章实心点、锚点条、状态识别 |
| 主色 hover | `var(--primary-600)` | 深一档 teal | 按钮 hover、图标色 |
| 主色浅底 | `var(--primary-50)` / `var(--primary-100)` / `var(--primary-200)` | 浅 teal | 徽章底、卡片淡渐变、tint 区域、边框 |
| 主色深字 | `var(--primary-700)` | 深 teal | 徽章文字、强调文字、状态文字 |
| 辅助色 | `var(--accent-50/100/200/500/600/700)` | 珊瑚橙系 | 次要语义（草稿数 / 事件流 / 已完结徽章），克制使用 |
| 主文字 | `text-foreground` | slate-900 | 主标题、正文 |
| 次文字 | `text-muted-foreground` | slate-500 | 描述、元信息 |
| 弱化文字 | `text-muted-foreground/80` / `/70` | slate-400 | 标签小字、辅助说明 |
| 页面背景 | `var(--bg-page)` | slate-50 | MainLayout 底色 |
| 卡片背景 | `bg-card` 或 `bg-card/80 backdrop-blur-sm` | 白色 / 半透明 | 工作区卡 |
| 边框 | `border-[var(--border-default)]/60` 或 `border-[var(--primary-200)]/60` | 半透明 | 中性边 / 主色边 |

**规则**：颜色必须使用 token，禁止 `emerald` / `sky` / `amber` / `rose` / `purple` 等具体色名。

---

## 二、全局渐变背景（MainLayout 注入）

整页底层渐变背景由 `MainLayout.tsx` 统一注入，**所有页面共享**：

```tsx
<div className="relative isolate flex h-screen overflow-hidden">
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[var(--bg-page)]">
    <motion.div
      className="absolute -left-[10%] -top-[10%] h-[55vw] w-[55vw] rounded-full bg-primary/25 blur-[100px]"
      animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
      transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute -bottom-[15%] -right-[10%] h-[55vw] w-[55vw] rounded-full bg-accent/25 blur-[100px]"
      animate={{ x: [0, -80, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
      transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 3 }}
    />
  </div>
  ...
</div>
```

**要点**：
- `isolate` 创建独立 stacking context，确保 `-z-10` 不被父级背景遮挡
- 两个超大色块（55vw）对角分布（左上 primary / 右下 accent）
- 饱和度 `/25`，`blur-[100px]`
- framer-motion 缓慢漂浮动画（30s / 35s 周期，错开 3s）

**页面层禁止** 重复设置全局渐变层（避免叠加）。卡内可使用**极淡装饰球**（见下文）。

---

## 三、Sidebar / Header 半透明

Sidebar 与 Header 统一半透明 + 毛玻璃，让底层渐变透出，形成"浑然一体"感。

```tsx
// Sidebar
className="bg-[var(--bg-card)]/70 backdrop-blur-xl border-r border-[var(--border-subtle)]/60"

// Header
className="sticky top-0 z-30 bg-[var(--bg-card)]/70 backdrop-blur-xl border-b border-[var(--border-subtle)]/60"
```

---

## 四、卡片体系

### 4.1 大卡（外层 section）

```tsx
className="rounded-2xl border border-[var(--border-default)]/60 bg-card/80 backdrop-blur-sm p-5 sm:p-6"
```

- 圆角 `rounded-2xl` (16px)
- 边框 `border-[var(--border-default)]/60`
- 背景 `bg-card/80 backdrop-blur-sm`（让底层渐变透出）
- padding `p-5 sm:p-6`（20-24px）
- **无阴影**（hover 时可加 `hover:shadow-sm`）

### 4.2 Hero / 焦点卡（带 tint 渐变）

```tsx
className="relative overflow-hidden rounded-2xl border border-[var(--primary-200)]/60 bg-[linear-gradient(135deg,#ffffff_0%,#ffffff_50%,var(--primary-50)_100%)] p-5 sm:p-6"
```

- 渐变背景：白 → 白 → primary-50 三段对角
- 边框用 primary tint
- 仅用于：每个页面顶部 Hero 区 + dashboard 焦点卡

### 4.3 内嵌卡（次级）

```tsx
className="rounded-xl border border-[var(--border-default)]/60 bg-card p-4 sm:p-5"
```

- 圆角 `rounded-xl` (12px)
- padding `p-4 sm:p-5`

### 4.4 tint 内嵌卡（数据 / 状态）

```tsx
// primary tint
className="rounded-xl border border-[var(--primary-200)]/60 bg-[var(--primary-50)]/70 p-3 sm:p-3.5"
// accent tint
className="rounded-xl border border-[var(--accent-200)]/70 bg-[var(--accent-50)]/80 p-3 sm:p-3.5"
// neutral
className="rounded-xl border border-[var(--border-default)]/60 bg-card p-3 sm:p-3.5"
```

### 4.5 卡内装饰球（可选 · 仅 Hero 内）

```tsx
<div aria-hidden className="pointer-events-none absolute -right-8 -top-8 hidden h-44 w-44 rounded-full bg-[var(--primary-500)]/10 blur-2xl sm:block" />
```

仅在 Hero / 焦点卡内使用，**饱和度 ≤ /10**，`blur-2xl` (40px) 程度。**禁止** 多卡叠加装饰球。

---

## 五、圆角层级（核心识别规则）

形成 16→12→8→full 的清晰递减：

| 层级 | Token | 值 | 元素 |
|---|---|---|---|
| L1 大卡 | `rounded-2xl` | 16px | Hero / section 外层 / aside |
| L2 内嵌卡 | `rounded-xl` | 12px | 数据卡 / 节奏卡 / 封面 / QuickAction / RecentWorkCard |
| L3 图标块 / 嵌套小列表 | `rounded-lg` | 8px | 图标容器 / inset 表格 |
| 胶囊 | `rounded-full` | — | 徽章 / 按钮 / 状态点 |

**禁止**：`rounded-3xl` (24px) 或自由值 `rounded-[1.35rem]`。

---

## 六、阴影策略

工作台采用 **极致克制** 的阴影：

| 元素 | 阴影 |
|---|---|
| 大卡正常态 | **无** |
| 大卡 hover | **无**（仅 border 加深） |
| 内嵌卡正常态 | **无** |
| 内嵌卡 hover | `hover:shadow-sm`（轻量上浮） |
| RecentWorkCard / QuickAction hover | `hover:shadow-sm` + `hover:-translate-y-0.5` |
| 按钮 | **无**（靠 bg-primary 实色权重） |
| 徽章 / chip | **无** |

**禁止**：
- 长投影 `shadow-[0_24px_60px_-12px_...]`（登陆页风，不适合工作台）
- 主色光晕 `shadow-lg shadow-primary/20`（霓虹感）
- 自由阴影值

---

## 七、FocusAnchor 焦点徽章（核心识别符号）

每个页面 Hero 区域 + 状态/焦点位置使用统一模板：

```tsx
<div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary-200)]/60 bg-[var(--primary-50)] py-1 pl-1 pr-3">
  <span className="inline-flex h-5 min-w-[24px] items-center justify-center rounded-full bg-[var(--primary-500)] px-1 text-[10px] font-bold tracking-wider text-white">
    焦点
  </span>
  <span className="text-[11px] font-semibold tracking-wider text-[var(--primary-700)]">
    今日创作
  </span>
</div>
```

**变体**：左侧 tag 可换 `焦点` / `状态` / `今日` / 图标，右侧 label 表达具体语义。

**作品标题胶囊**（轻量化变体）：

```tsx
<span className="rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-[var(--primary-700)]">
  {workTitle}
</span>
```

---

## 八、按钮体系

| 层级 | 完整样式 | 用途 |
|---|---|---|
| **主 CTA（实色）** | `h-11 rounded-full bg-primary px-6 text-primary-foreground transition-colors hover:bg-primary/90` | 新建作品 / 继续创作 |
| **次要 outline** | `h-11 rounded-full border-[var(--border-default)]/60 px-5` | 导入 / 全部作品 |
| **文字链** | `inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80` | 全部作品 / 查看全部 |
| **ghost 工具** | `h-9 w-9 rounded-full p-0 text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)]` | 编辑器工具按钮 |
| **悬浮 AI** | 见阅读页章节 | 仅章节阅读页 |

**禁止**：按钮叠加阴影（`shadow-lg shadow-primary/20` 等）。

### 操作文案规范

- **字数**：操作按钮 2–4 字为宜，**上限 5 字**；超长必须精简。移动端窄按钮用纯图标 + `aria-label`。
- **不重复上下文**：已在作品内不写"作品"、已在草稿语境不写"草稿"（草稿列表页新建按钮 →「新建」，非"新建作品草稿"）；中性位置（如作品 hero）可用「新建草稿」明确对象。
- **动词统一**（同一动作全站同一词，不混用同义词）：

| 语义 | 统一用词 |
|---|---|
| 创建 | 新建 |
| 查看完整列表 | 查看全部 |
| 进入某模块 | 模块名（章节/大纲…）或「管理」 |
| 草稿 → 章节 | 发布 |
| 灵感 → 作品 | 引入 |
| 对话框确认 | 创建 / 确定 |

- 适用范围：所有按钮、文字链、对话框按钮、空态按钮。

---

## 九、字体

| 用途 | 字号 | 字重 | 备注 |
|---|---|---|---|
| Hero H1 | `text-3xl sm:text-4xl` (28-36px) | `font-extrabold` | `tracking-tight` |
| 区块标题 H2 | `text-lg sm:text-xl` (18-20px) | `font-bold` | `tracking-tight` |
| 卡内标题 | `text-base sm:text-lg` (16-18px) | `font-bold` | |
| 描述 | `text-sm sm:text-base` (14-16px) | `normal` | `leading-6` `text-muted-foreground` |
| 数据数字 | `text-lg sm:text-xl` (18-20px) | `font-extrabold` | `tabular-nums tracking-tight` |
| 元信息 | `text-[13px]` | `medium` | `text-muted-foreground` |
| 标签小字 | `text-[10px]` / `text-[11px]` | `font-semibold` | `uppercase tracking-[0.16em]` 或 `tracking-wider` |
| 章节锚点文字 | `text-[10px]` 数字 / `text-[11px]` 文字 | `font-bold` / `font-semibold` | |

**字体族**：默认系统 sans。**禁止** serif / 自定义中文字体。

---

## 十、间距阶梯（呼吸感）

### 10.1 整页

| 区域 | 移动端 (< sm) | 桌面端 (sm+) | xl+ | 2xl+ |
|---|---|---|---|---|
| 整页 section 间距 | `space-y-6` (24px) | `space-y-8` (32px) | — | — |
| 主 grid gap | `gap-6` (24px) | `gap-8` (32px) | `gap-10` (40px) | `gap-12` (48px) |
| Aside 列宽 | full | full | `460px` | `480px` |
| MainLayout main padding | `p-4` (16px) | `p-6` (24px) | — | — |

### 10.2 卡内

| 层级 | 移动端 | 桌面端 |
|---|---|---|
| Hero / 大 section padding | `p-5` (20px) | `p-6` (24px) |
| 内嵌卡 padding | `p-4` (16px) | `p-5` (20px) |
| 数据卡 padding | `p-3` (12px) | `p-3.5` (14px) |
| 卡内 space-y | `space-y-3` 描述紧凑 / `space-y-5` 区段松散 | 同左 |

### 10.3 grid 间距

| 用途 | 移动端 | 桌面端 |
|---|---|---|
| 卡片网格 gap | `gap-3` (12px) | `gap-4` (16px) |
| 数据卡 gap | `gap-2.5` (10px) | `gap-3` (12px) |
| 元素间小 gap | `gap-2` (8px) | — |

---

## 十一、入场动画分层

使用 `tailwindcss-animate` 内置工具类，分层错开延迟：

| 元素 | 动画 | 延迟 |
|---|---|---|
| Hero | `animate-in fade-in slide-in-from-top-4 duration-500` | 0 |
| 主内容卡 #1 | `animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150` | 0.15s |
| 主内容卡 #2 | `... delay-300` | 0.3s |
| 主内容卡 #3 | `... delay-[400ms]` | 0.4s |
| aside | `animate-in fade-in duration-500 delay-500` | 0.5s |

**列表元素**（如 RecentWorkCard）用 framer-motion 错开 `index * 0.08`。

---

## 十二、Hover 反馈

整体性 hover（不是单边 border 变粗）：

```tsx
className="transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary-200)] hover:shadow-sm hover:bg-[var(--primary-50)]/30"
```

- `translateY(-2px)` 微上移
- 边框 primary tint 加深
- 极轻阴影 `shadow-sm`
- 背景轻微 tint（可选）

---

## 十三、Teal 主色出现位置（克制识别）

仅在以下 7 类语义出现，避免泛滥：

1. **品牌识别**：FocusAnchor 实心圆点 `bg-primary-500`
2. **活跃/选中**：sidebar 当前页 `bg-primary-50 + text-primary-700`
3. **交互反馈**：ghost 按钮 hover `bg-primary-50 + text-primary-700`
4. **主 CTA**：按钮 `bg-primary text-primary-foreground`
5. **状态徽章**：连载中 `border-[var(--primary-100)] bg-primary/10 text-[var(--primary-700)]`
6. **数据锚点**：StatTile 标签前小圆点 `bg-[var(--primary-500)]`
7. **作品锚点**：RecentWorkCard 左侧 3px 实色竖条

**辅助色 accent** 用于次要语义（草稿数 / 事件流 / 已完结），克制使用。

---

## 十四、明确允许 / 明确禁止

### 允许（工作台风）

- ✅ 卡片半透明 + 毛玻璃 `bg-card/80 backdrop-blur-sm`
- ✅ Hero 卡淡渐变背景 `linear-gradient(135deg, white, white, primary-50)`
- ✅ tint 内嵌卡 `bg-[var(--primary-50)]/70`
- ✅ Hero 内极淡装饰球（`/10` 饱和度 + `blur-2xl`）
- ✅ MainLayout 全局渐变背景（统一注入）
- ✅ Sidebar / Header 半透明 + 毛玻璃
- ✅ 分层入场动画
- ✅ 整体性 hover（translateY + shadow-sm + border 变化）

### 禁止

| 禁止项 | 原因 |
|---|---|
| ❌ `rounded-3xl` (24px) 或更大圆角 | "胖糖果"感，不专业 |
| ❌ 自由圆角值 `rounded-[1.35rem]` 等 | 必须用 token |
| ❌ 主色光晕阴影 `shadow-lg shadow-primary/20` | 霓虹感，不适合工作台 |
| ❌ 长投影 `shadow-[0_24px_60px_-12px_...]` | 登陆页风，让卡"漂浮" |
| ❌ 自由阴影值 | 必须用 `shadow-sm` token 或无阴影 |
| ❌ 多卡叠加装饰球 | 喧宾夺主，堆砌感 |
| ❌ 卡内饱和度 > `/10` 的装饰球 | 颜色过浓 |
| ❌ 渐变文字 `bg-clip-text` + 多色 | "广告 banner"感 |
| ❌ 紫色 / 自由色板（`from-purple-600` 等） | 必须用 primary/accent token |
| ❌ serif 衬线字体 | 与项目其他页面 sans 风格不符 |
| ❌ 双 DOM 响应式（`sm:hidden` + `hidden sm:block`） | 维护负担翻倍，必须用响应式组件 |
| ❌ 双层 sticky header | 应用栏 + 页面级二层栏视觉割裂 |

---

## 十五、响应式原则

**一份代码 + Tailwind 断点 className**，**禁止**两套 DOM：

```tsx
// ❌ 反模式
<div className="sm:hidden">移动端版</div>
<div className="hidden sm:block">桌面端版</div>

// ✅ 正确
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
  <StatTile />
</div>
```

**断点**：
- `< sm` (< 640px) 移动端
- `sm` (640-768px) 平板竖屏
- `md` (768-1024px) 平板横屏
- `lg` (1024-1280px) 桌面端
- `xl` (1280-1536px) 大桌面
- `2xl` (≥ 1536px) 超大桌面

**移动优先**：从 375px 开始设计，每个断点 enhancement。

---

## 十六、阅读页克制风（独立章节）

`/works/[id]/chapters/[chapterId]` 章节阅读页保留独立风格：

- 整页 `bg-[var(--bg-page)]`（不参与全局渐变？待评估）
- 单张主卡 `rounded-2xl bg-[var(--bg-card)]` **纯白**
- **三层柔和阴影**：
  ```css
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px -8px rgba(15, 23, 42, 0.06),
    0 24px 48px -24px rgba(15, 23, 42, 0.08);
  ```
- 章节锚点 "01 章节" 实心 teal 徽章
- 阅读 H1 `clamp(1.5rem, 2vw, 1.75rem)` 24-28px
- 正文 18px / line-height 1.85
- 工具按钮组在头部 `bg-[var(--neutral-100)]/60` 容器
- 悬浮 AI 入口 `fixed bottom-8 right-8 z-40`

阅读页与工作台**互不影响**，由 MainLayout 通过路由判断切换风格（暂未实现，使用时手动遵守）。

---

## 整改计划

按以下顺序逐页对比、整改、验收：

| 序号 | 路径 | 状态 | 备注 |
|---|---|---|---|
| 1 | `/dashboard` | ✅ 完成 | 工作台风基准 |
| 2 | `/works` | ✅ 完成 | 作品列表 |
| 3 | `/drafts` | ✅ 完成 | 草稿箱（含 DraftCard/DraftToolbar） |
| 4 | `/tools/ai-assistant` | ✅ 完成 | AI 助手 |
| 5 | `/tools/prompts` | ✅ 完成 | 提示词管理 |
| 6 | `/settings` | ✅ 完成 | 设置 |
| 7 | `/works/[id]` | ✅ 完成 | 作品工作台（含 WorkOverviewHeader/WorkMobileActions/WorkWorkspaceLayout） |
| 8 | `/works/[id]/chapters` 等子模块 | ✅ 完成 | 复用 WorkWorkspaceLayout |
| 9 | `/works/[id]/outline` | ✅ 完成 | 看板列颜色 token 化 |
| 10 | `/works/[id]/drafts/new` | ✅ 完成 | rounded 收敛 |
| 11 | `/works/[id]/chapters/[chapterId]` | ✅ 完成 | 阅读页：纸张 UI + AI 提取（AssistantDock + ExtractReader） |
| 12 | `/works/[id]/chapters/[chapterId]/edit` | ✅ 完成 | 编辑页：还原极简（TiptapEditor 内置工具栏） |
| 13 | extract/ 子系统（8 组件） | ✅ 完成 | emerald→primary、amber→accent、rose→destructive、slate→中性 token |

**未纳入整改**（认可设计 / 第三方组件）：
- `(auth)/login`、`(auth)/register` — 认证页独立认可设计
- 编辑器 `TiptapEditor` 及内置 AI 助手（`AIChatMessage` 等）— 认可不动
- shadcn / assistant-ui 基础组件（`ui/*`、`assistant-ui/*`）

**死代码**（未被引用，可后续删除）：`dashboard/components/StatCard.tsx`、`StatsCard.tsx`、`QuickActions.tsx`、`RecentWorks.tsx`

**流程**：每页输出"差异清单 → 整改 → 验收"循环。

---

## 修订记录

- **2026-05-26**：v1 基于章节阅读页认可版首次提炼
- **2026-05-28**：v2 基于 dashboard v14 实际风格重写
  - 允许毛玻璃 backdrop-blur（sidebar/header/卡片）
  - 允许卡片淡渐变背景（white→primary-50）
  - 允许极淡装饰球（/10 + blur-2xl）
  - 删除三层柔和阴影硬性要求，工作台改为**无阴影**策略
  - 新增「全局渐变背景」「FocusAnchor」「圆角层级 16→12→8」「间距阶梯」
  - 新增风格分层：**工作台风** vs **阅读页克制风**
  - 强化禁止项：rounded-3xl / 主色光晕 / 双 DOM 响应式 / 紫色等非 token 色
