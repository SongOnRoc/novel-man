# Dashboard 整改清单（方案 C：折中）

> 配套文档：`docs/fix/ui-design-language.md`（设计语言契约）、`docs/fix/design-tokens.md`（早期硬约束，与 ui-design-language.md 冲突时以后者为准）
> 整改对象：`frontend/src/app/(main)/dashboard/page.tsx` + `components/QuickAction.tsx` + `components/RecentWorkCard.tsx`
> 其它未引用文件（`QuickActions.tsx` / `RecentWorks.tsx` / `StatCard.tsx` / `StatsCard.tsx`）本轮不动。

---

## 一、方案 C 核心原则

| 维度 | 处理 |
|---|---|
| 毛玻璃 `backdrop-blur-*` | **删** |
| 大装饰渐变球（`blur-3xl bg-primary/12` / radial-gradient 全屏装饰） | **删** |
| 自由圆角值（`rounded-[1.75rem]` 等） | **改为 token**：`rounded-2xl` (16px) / `rounded-md` (8px) / `rounded-full` |
| 自由阴影值（`shadow-[0_24px_60px_-42px...]` 等） | **改为 token**：`shadow-sm` / `shadow-md` |
| 半透明卡片底 `bg-white/82~/96` | **改为** `bg-card`（纯白） |
| 多色多段渐变（teal-50 + blue-50 + white 三色） | **改为** 单色淡底 `bg-primary/[0.04]` |
| 二段淡渐变背景（white → primary-50） | **保留** —— 方案 C 的"温润感"主要靠它 |
| Teal 主色 | **完全沿用** 项目全局 `--primary-*`，不引入第二色（设计语言禁止 `emerald/sky/amber/rose`） |
| 入场动画（`motion.div initial/animate`） | **保留** |
| Hover 上移（`hover:-translate-y-0.5`） | **保留**（仅在卡片上） |

---

## 二、配色策略（沿用全局主色调 teal）

| 用途 | Token | 说明 |
|---|---|---|
| 卡片底色 | `bg-card` | 纯白 |
| 淡渐变卡片底 | `bg-[linear-gradient(180deg,#ffffff,var(--primary-50))]` | 白 → 极淡 teal，温润感来源 |
| 主色徽章底 | `bg-primary/10` + `text-primary` | 状态徽章 / 锚点 |
| 主色嵌套淡底 | `bg-primary/[0.04]` 或 `bg-[var(--primary-50)]/60` | 「写作焦点」「最近编辑状态」内卡 |
| 主 CTA 按钮 | `bg-primary text-primary-foreground` | 「新建作品」「继续创作」 |
| 文字链 | `text-primary hover:text-primary/80` | 「全部作品」「作品草稿」 |
| 边框 | `border-[var(--border-subtle)]` | 卡片轻边 |
| 卡片暗边 | `border-white/80` | 渐变卡的视觉收口（保留） |
| 主文字 | `text-foreground` | |
| 次文字 | `text-muted-foreground` | |

**禁止**：`bg-blue-*` / `from-blue-* via-teal-* to-white` / `bg-orange-*`（除非作为 "已完结" 状态徽章的弱化辅助色，需另议）

---

## 三、逐文件改动详表

### 3.1 `dashboard/page.tsx`

#### 装饰层（必删 3 处）

| 行 | 当前 | 处理 |
|---|---|---|
| 170 | `<div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.09),transparent_28%)] xl:block" />` | **整行删除** |
| 173 | `<div className="pointer-events-none absolute -left-8 top-6 hidden h-40 w-40 rounded-full bg-primary/12 blur-3xl xl:block" />` | **整行删除** |
| 174 | `<div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[28rem] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_36%),radial-gradient(circle_at_45%_65%,rgba(20,184,166,0.07),transparent_30%)] xl:block" />` | **整行删除** |

#### 整页根容器（L169）

```diff
- <div className="relative min-h-screen animate-in fade-in overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f8fafc_34%,#f4fbfb_100%)] p-3.5 duration-500 sm:p-5 xl:p-6">
+ <div className="relative min-h-screen animate-in fade-in overflow-hidden bg-[linear-gradient(180deg,var(--bg-page)_0%,var(--bg-page)_34%,var(--primary-50)_100%)] p-3.5 duration-500 sm:p-5 xl:p-6">
```
**改点**：硬编码 hex → token 变量；视觉效果一致（极淡 teal 角点）

#### 主 hero section（L172）

```diff
- <section className="relative overflow-hidden rounded-[1.75rem] border border-border/55 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,255,255,0.93)_58%,rgba(240,253,250,0.92))] p-4 shadow-[0_26px_60px_-42px_rgba(15,23,42,0.34)] sm:p-5 xl:p-6">
+ <section className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,#ffffff,var(--primary-50))] p-4 shadow-md sm:p-5 xl:p-6">
```
**改点**：
- `rounded-[1.75rem]` → `rounded-2xl`
- 三段半透明 135deg 渐变 → 二段实色 180deg 渐变（白 → 极淡 teal）
- `shadow-[0_26px_60px_-42px...]` → `shadow-md`
- `border-border/55` → `border-[var(--border-subtle)]`

#### 桌面端 3 个数据小卡（L216 / 222 / 226）

```diff
- <div className="rounded-[1.35rem] border border-white/80 bg-white/84 px-4 py-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.42)] backdrop-blur-sm">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-card px-4 py-3 shadow-sm">
```
**改点**：
- `rounded-[1.35rem]` → `rounded-md`（小卡片用 8px）
- 删 `backdrop-blur-sm`、`bg-white/84` → `bg-card`
- 自由阴影 → `shadow-sm`
- `border-white/80` → `border-[var(--border-subtle)]`

#### 移动端 3 个数据小卡（L233 / 239 / 243）

```diff
- <div className="rounded-[1rem] border border-white/80 bg-white/90 px-3 py-2.5 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.38)] sm:px-4">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-card px-3 py-2.5 shadow-sm sm:px-4">
```

#### 移动端「最近作品」section（L272）

```diff
- <section className="rounded-[1.125rem] border border-primary/10 bg-primary/[0.025] p-3 sm:hidden">
+ <section className="rounded-2xl border border-[var(--primary-100)] bg-[var(--primary-50)]/40 p-3 sm:hidden">
```
**改点**：
- `rounded-[1.125rem]` → `rounded-2xl`（大 section）
- `border-primary/10` → `border-[var(--primary-100)]`（语义化 token）
- `bg-primary/[0.025]` → `bg-[var(--primary-50)]/40`（同等极淡感）

#### 移动端 latestWork 内卡（L303）+ 3 个嵌套小卡（L305 / 314 / 323）

```diff
- <div className="rounded-[1rem] border border-primary/8 bg-white p-2.5 shadow-sm">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-card p-2.5 shadow-sm">

- <div className="rounded-[0.875rem] border border-primary/8 bg-transparent px-2 py-1.5">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-transparent px-2 py-1.5">
```

#### 移动端 latestWork 空态（L334）

```diff
- <div className="rounded-[1.25rem] border border-dashed bg-white p-5 text-center text-sm text-muted-foreground">
+ <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-card p-5 text-center text-sm text-muted-foreground">
```

#### 桌面端「最近作品」section（L341）

```diff
- <section className="hidden rounded-[1.75rem] border border-border/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(245,251,251,0.94))] p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.36)] sm:block">
+ <section className="hidden rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,#ffffff,var(--primary-50))] p-5 shadow-md sm:block">
```

#### 「最新作品」标题徽章（L350）

```diff
- <span className="truncate rounded-full bg-primary/12 px-2.5 py-1 text-[12px] font-semibold text-primary/80">
+ <span className="truncate rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary/90">
```
**改点**：与设计语言「徽章 / 锚点」一致（`bg-primary/10 + text-primary/90`）

#### 「写作焦点」外层（L377）+ 内卡（L380）

```diff
- <div className="rounded-[1.55rem] border border-white/80 bg-white/90 p-4 shadow-[0_22px_44px_-34px_rgba(15,23,42,0.4)] backdrop-blur-sm">
+ <div className="rounded-2xl border border-[var(--border-subtle)] bg-card p-4 shadow-sm">

- <div className="rounded-[1.35rem] border border-primary/10 bg-[linear-gradient(160deg,rgba(240,253,250,0.95),rgba(239,246,255,0.82)_56%,rgba(255,255,255,0.94))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
+ <div className="rounded-2xl border border-[var(--primary-100)] bg-[var(--primary-50)]/60 p-5">
```
**改点**：
- 删 `backdrop-blur-sm`
- 删三色多段渐变（teal-50 + blue-50 + white），改为极淡 teal 单色
- 删 inset 内描边阴影

#### 「写作焦点」右侧 3 个嵌套数据小卡（L397 / 405 / 413）

```diff
- <div className="rounded-[1.1rem] border border-white/80 bg-white/88 px-3.5 py-3 shadow-[0_18px_28px_-28px_rgba(15,23,42,0.42)]">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-card px-3.5 py-3 shadow-sm">
```

#### 「快速开始」section（L433）

```diff
- <section className="rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-5">
+ <section className="rounded-2xl border border-[var(--border-subtle)] bg-card p-5 shadow-sm sm:p-5">
```

#### 「创作动态」section（L494）

```diff
- <section className="rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm sm:p-5">
+ <section className="rounded-2xl border border-[var(--border-subtle)] bg-card p-5 shadow-sm sm:p-5">
```

#### 「创作动态」内移动端占位（L503 / 506）

```diff
- <div className="rounded-[1rem] border border-border/70 bg-muted/20 px-3 py-2 text-sm font-semibold text-primary">
+ <div className="rounded-md border border-[var(--border-subtle)] bg-muted/20 px-3 py-2 text-sm font-semibold text-primary">
```

#### 「创作动态」桌面端节奏 / 事件双卡（L513 / 529）

```diff
- <div className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,251,251,0.9))] p-4 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-[0_26px_46px_-34px_rgba(15,23,42,0.42)]">
+ <div className="rounded-2xl border border-[var(--border-subtle)] bg-[linear-gradient(180deg,#ffffff,var(--primary-50))] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary-100)] hover:shadow-md">
```
**改点**：
- `rounded-[1.25rem]` → `rounded-2xl`
- 二段淡渐变保留（白 → 极淡 teal）
- 自由阴影 → `shadow-sm`、hover 自由阴影 → `hover:shadow-md`
- hover 上移保留

#### 「事件流」嵌套占位小卡（L540）

```diff
- <div className="space-y-2 rounded-[0.95rem] border border-border/70 bg-white p-3">
+ <div className="space-y-2 rounded-md border border-[var(--border-subtle)] bg-card p-3">
```

#### 「待接入」徽章（L524）

```diff
- <div className="rounded-full border border-border/70 bg-white px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
+ <div className="rounded-full border border-[var(--border-subtle)] bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
```

#### 移动端「最近编辑」section（L556 + 561）

```diff
- <div className="rounded-[1.375rem] border bg-card p-4 shadow-sm">
+ <div className="rounded-2xl border border-[var(--border-subtle)] bg-card p-4 shadow-sm">

- <div className="mt-3.5 rounded-[1.125rem] border border-primary/10 bg-primary/[0.035] p-3.5">
+ <div className="mt-3.5 rounded-2xl border border-[var(--primary-100)] bg-[var(--primary-50)]/40 p-3.5">
```

#### 桌面端 aside「最近编辑」（L587）

```diff
- <aside className="hidden space-y-4 rounded-[1.6rem] border border-border/50 bg-white/82 p-5 shadow-[0_24px_52px_-40px_rgba(15,23,42,0.34)] backdrop-blur-sm xl:block">
+ <aside className="hidden space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-card p-5 shadow-sm xl:block">
```

#### Aside「状态」内卡（L592）

```diff
- <div className="rounded-[1.25rem] border border-white/80 bg-[linear-gradient(160deg,rgba(240,253,250,0.94),rgba(239,246,255,0.82)_58%,rgba(255,255,255,0.92))] p-4 shadow-[0_20px_38px_-30px_rgba(20,184,166,0.32)]">
+ <div className="rounded-2xl border border-[var(--primary-100)] bg-[var(--primary-50)]/60 p-4 shadow-sm">
```
**改点**：三色多段渐变 → 极淡 teal 单色（与 hero 「写作焦点」内卡同款）

#### Aside「草稿箱」徽章（L600）

```diff
- <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
+ <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-primary shadow-sm">
```

---

### 3.2 `components/QuickAction.tsx`

#### Compact 模式（L31–55）

```diff
- className={cn(
-   "group flex h-full items-center gap-3 rounded-[1.35rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] px-4 py-4 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.38)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_24px_40px_-30px_rgba(15,23,42,0.42)] sm:gap-3.5 sm:px-[18px] sm:py-4",
-   className
- )}
+ className={cn(
+   "group flex h-full items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-card px-4 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary-100)] hover:shadow-md sm:gap-3.5 sm:px-[18px] sm:py-4",
+   className
+ )}
```

#### Compact 图标容器（L41）

```diff
- <div className="inline-flex shrink-0 rounded-full border border-primary/10 bg-primary/10 p-2.5 text-primary shadow-[0_14px_24px_-20px_rgba(20,184,166,0.55)]">
+ <div className="inline-flex shrink-0 rounded-full border border-[var(--primary-100)] bg-primary/10 p-2.5 text-primary">
```
**改点**：删图标容器多余阴影

#### Compact 右侧箭头容器（L50）

```diff
- <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-white/90 text-muted-foreground/70 transition-all duration-200 group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
+ <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-card text-muted-foreground/70 transition-all duration-200 group-hover:border-[var(--primary-100)] group-hover:bg-primary/5 group-hover:text-primary">
```

#### 完整模式（L65–71）

```diff
- className={cn(
-   "group flex h-full flex-col justify-between rounded-[1.55rem] border p-5 shadow-[0_22px_40px_-34px_rgba(15,23,42,0.38)] transition-all duration-200",
-   tone === "primary"
-     ? "border-primary/18 bg-[linear-gradient(160deg,rgba(240,253,250,0.95),rgba(255,255,255,0.92))] hover:border-primary/28 hover:shadow-[0_28px_46px_-34px_rgba(20,184,166,0.32)]"
-     : "border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] hover:border-primary/18 hover:shadow-[0_28px_46px_-34px_rgba(15,23,42,0.42)]",
-   className
- )}
+ className={cn(
+   "group flex h-full flex-col justify-between rounded-2xl border p-5 shadow-sm transition-all duration-200",
+   tone === "primary"
+     ? "border-[var(--primary-100)] bg-[linear-gradient(180deg,#ffffff,var(--primary-50))] hover:border-[var(--primary-200)] hover:shadow-md"
+     : "border-[var(--border-subtle)] bg-card hover:border-[var(--primary-100)] hover:shadow-md",
+   className
+ )}
```

#### 完整模式图标容器（L75–84）

```diff
- <div
-   className={cn(
-     "inline-flex shrink-0 rounded-2xl border p-3 shadow-[0_14px_24px_-20px_rgba(20,184,166,0.45)]",
-     tone === "primary"
-       ? "border-primary/10 bg-primary/10 text-primary"
-       : "border-primary/10 bg-primary/8 text-primary"
-   )}
- >
+ <div
+   className={cn(
+     "inline-flex shrink-0 rounded-md border p-3",
+     tone === "primary"
+       ? "border-[var(--primary-100)] bg-primary/10 text-primary"
+       : "border-[var(--primary-100)] bg-primary/10 text-primary"
+   )}
+ >
```
**改点**：删图标容器阴影；图标容器圆角从 `rounded-2xl` (16px) → `rounded-md` (8px)（与设计语言「输入框/小容器」对齐，避免图标容器与外卡同圆角导致同心圆视觉）

> ⚠️ 此处需要你确认：图标容器我想从「大圆角」改成「小圆角」，让外卡 (rounded-2xl) 与图标 (rounded-md) 有明确层级差。如果你想保留同款圆角观感，可改为 `rounded-2xl` → 同时取消，最终全部 `rounded-md`。请拍板。

#### 完整模式底部箭头容器（L95）

```diff
- <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/10 bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
+ <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--primary-100)] bg-primary/5 transition-colors duration-200 group-hover:bg-primary/10">
```

---

### 3.3 `components/RecentWorkCard.tsx`

#### 卡片本体（L29）

```diff
- className="rounded-[1.2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))] p-3 shadow-[0_18px_32px_-28px_rgba(15,23,42,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/18 hover:shadow-[0_24px_40px_-30px_rgba(15,23,42,0.42)]"
+ className="rounded-2xl border border-[var(--border-subtle)] bg-card p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary-100)] hover:shadow-md"
```

#### 状态徽章（L42）

```diff
- "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-[0_10px_18px_-16px_rgba(15,23,42,0.3)]",
+ "inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold",
```
**改点**：删徽章阴影（设计语言"徽章不要阴影"）

#### 状态徽章「已完结」配色（L44–46）

```diff
- work.status === "serial"
-   ? "border-primary/12 bg-primary/10 text-primary"
-   : "border-orange-200 bg-orange-50 text-orange-700"
+ work.status === "serial"
+   ? "border-[var(--primary-100)] bg-primary/10 text-primary"
+   : "border-[var(--accent-200,#fed7aa)] bg-[var(--accent-50,#fff7ed)] text-[var(--accent-700,#c2410c)]"
```
**改点**：
- "连载中" 沿用 teal 主色
- "已完结" 用 `--accent-*` (coral 系，设计语言允许的辅助色)；若你想"已完结"也用 teal 系（更克制）则统一为同色不同强度

> ⚠️ 此处需要你拍板：「已完结」用 coral 辅助色（视觉对比清晰，符合设计语言）还是统一弱化为灰系（最克制）？

---

## 四、改动总计

| 项 | 数量 |
|---|---|
| 必删的装饰层 / 阴影 / `backdrop-blur` | 13 处 |
| 自由圆角 → token | ~25 处 |
| 自由阴影 → token | ~15 处 |
| 半透明底 → `bg-card` | ~12 处 |
| 三色多段渐变 → 单色淡底 | 4 处 |
| 二段淡渐变保留并 token 化 | 6 处 |

---

## 五、需要你拍板的判断点

1. **「已完结」状态徽章配色** — 用 coral（`--accent-*` 辅助色，对比强）还是统一灰系（更克制）？
2. **QuickAction 完整模式的图标容器圆角** — 从 `rounded-2xl` 收敛到 `rounded-md` 形成层级差，还是保持大圆角观感？
3. **整页背景** — 保留极淡 teal 角点（白 → primary-50），还是干脆纯 `bg-page` 去掉所有渐变？
4. **Hover 上移效果（`hover:-translate-y-0.5`）** — 设计语言未定义，是保留（温润感）还是统一删？
5. **`motion.div` 入场动画** — 保留还是删（设计语言对入场动画未表态）？

---

## 六、与 `ui-design-language.md` 的对齐检查

| 设计语言条款 | 整改后是否符合 |
|---|---|
| 颜色全部用 token，禁止 `emerald/sky/amber/rose` | ✅（`已完结` 用 `--accent-*` 不算违规） |
| 主卡 `rounded-2xl` (16px) | ✅ |
| 卡片背景 `var(--bg-card)` 纯白 | ✅ |
| 不用阴影做分隔，用 `1px border-[var(--border-subtle)]` | ✅ |
| 禁止 `backdrop-blur` | ✅ 全删 |
| 禁止装饰渐变球 | ✅ 全删 |
| 禁止卡片白色渐变（multi-stop white/white/primary-50） | ✅ 改为 white → primary-50 二段实色 |
| 禁止大装饰阴影 | ✅ 全部 `shadow-sm` / `shadow-md` |
| 禁止 serif | ✅（dashboard 本就没有） |
| 禁止自由色板 | ✅ |
| 禁止自由圆角值 | ✅ 全部 token |
| 禁止自由阴影值 | ✅ 全部 token |
| 禁止双层 sticky header | ✅（dashboard 单层） |

---

## 七、整改完成判定

- [ ] `pnpm tsc --noEmit` 通过
- [ ] `pnpm lint` 无新增警告
- [ ] 桌面端 / 移动端肉眼对比：保留温润感，去除豪华感
- [ ] 与 `/works/[id]/chapters/[chapterId]` 章节阅读页同框对比：视觉协调
