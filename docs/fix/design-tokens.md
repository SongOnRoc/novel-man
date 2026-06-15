# Design Tokens（硬约束）

> 本文件定义 novel-man 全局视觉契约。所有页面与组件必须遵守，避免再次出现"东拼西凑"。

## 一、颜色

所有颜色必须使用 token，禁止手写 `emerald / sky / amber / rose / slate` 等具体色名。

| 用途 | Token | 值 |
|---|---|---|
| 页面背景（一体化主背景） | `var(--bg-page)` | `#f8fafc` (slate-50) |
| 内容卡片背景（前景） | `var(--bg-card)` | `#ffffff` |
| 主品牌色（CTA / 活跃状态） | `var(--primary-500)` | `#14b8a6` (teal-500) |
| 辅助色（强调 / 警示） | `var(--accent-500)` | `#f97316` (coral-500) |
| 主文字 | `var(--text-primary)` | `#0f172a` |
| 次文字 | `var(--text-secondary)` | `#475569` |
| 弱化文字 | `var(--text-tertiary)` | `#94a3b8` |
| 极淡边框（区域分隔） | `var(--border-subtle)` | `#e2e8f0` |
| 默认边框 | `var(--border-default)` | `#cbd5e1` |

### 状态色映射（智能提取等）
| 类别 | 颜色 |
|---|---|
| 角色 | `var(--primary-*)` teal |
| 世界观 | `var(--neutral-500)` 中性蓝灰（暂不引入第二品牌色） |
| 纲要 | `var(--accent-*)` coral |

## 二、边界

| 用途 | 规则 |
|---|---|
| 区域间分隔线 | `1px solid var(--border-subtle)` |
| 卡片内部边界 | `1px solid var(--border-subtle)` |
| 禁止 | 用 `box-shadow` 做分隔；用多层 border |

## 三、圆角

| 用途 | Token | 值 |
|---|---|---|
| 容器 / 卡片 | `var(--radius-md)` | 8px |
| 大型展板 | `var(--radius-lg)` | 12px |
| 按钮 | `rounded-full` | 9999px |
| 输入框 | `var(--radius-md)` | 8px |
| 禁止 | `rounded-2xl / rounded-3xl` 自由手写 |

## 四、阴影

| 用途 | Token |
|---|---|
| 悬浮元素 hover | `var(--shadow-sm)` |
| 浮动按钮 / 弹窗 | `var(--shadow-md)` |
| Modal | `var(--shadow-lg)` |
| 禁止 | 自己写 `shadow-[0_12px_28px_-12px_...]`；用 shadow 做区域分隔 |

## 五、密度阶梯（垂直节奏）

| 区域 | 行高 / 容器高 |
|---|---|
| Sidebar 导航项 | 40px |
| 应用 Header | 56px（旧值 64px → 减压）|
| 阅读区段落间距 | 24px (`space-y-6`) |
| 阅读区行高 | 1.85 |
| 抽屉内卡片间距 | 12px (`space-y-3`) |
| 表单/工具行 | 32px |

## 六、字体

| 用途 | Family |
|---|---|
| UI 字体 | 系统默认 sans |
| 章节阅读正文 | 系统默认 sans（暂不引入 serif，保持全局一致性）|
| 数字 | `tabular-nums` |

## 七、布局原则

### 背景一体化
- 整页背景 = `var(--bg-page)`
- Sidebar / Header / Main 均**不**自带独立背景色（透明或同色）
- 仅"内容卡片"（如章节正文）使用 `var(--bg-card)` 作为唯一前景色
- region 之间仅靠 `1px var(--border-subtle)` 区分，不用阴影

### 单层栈
- 全页同一时刻只能有 1 个 sticky header
- 禁止页面级再叠加二层栏

### 信息节点克制
- 每个区域只承担 1 个语义角色
- 工具/状态/装饰元素必须给出存在理由，否则删除

## 八、图标

| 体系 | 来源 |
|---|---|
| 全局 | `lucide-react` 统一 |
| 线条粗细 | 默认 1.5px |
| 尺寸 | 14px / 16px / 18px 三档 |
| 禁止 | 混用其他图标库；同区域内多种尺寸混用 |

## 九、变更流程

新增 region/组件时必须：
1. 引用既有 token，不自行新建样式
2. 不引入新颜色 / 新圆角值
3. 视觉评审通过后方可合入
