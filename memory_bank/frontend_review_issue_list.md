# 前端项目最终架构审计报告 (世界级标准版)

**审查日期:** 2025-08-19
**审查员:** Architect Mode
**状态:** 最终版

---

## 1. 核心目标与理念

本报告旨在提供一份全面的、可操作的、世界级标准的问题与改进清单。审查的核心理念是确保项目**严格遵守既定架构蓝图**，根除所有已知和潜在的技术债，使项目在**稳定性、可维护性、可扩展性**和**开发效率**上达到业界顶尖水平。所有问题按**严重性**和**修复优先级**进行分类。

---

## 2. `P0` - 严重架构偏差 (最高优先级)

*此类别中的问题严重违反了核心架构原则，可能导致系统性风险、维护噩梦和不可预期的关键 Bug，必须作为第一要务立即修复。*

### 2.1. `work` 模块存在双重且违规的数据获取实现

-   **问题描述:**
    `work` 模块存在两套完全独立、逻辑冲突的数据获取实现来处理“作品与角色/世界观的关联”。其中一套实现依赖一个来源不明、不符合架构规范、且物理文件无法定位的 `worksApi`，严重违反了“**`Orval` 作为唯一API代码生成来源**”的核心架构原则。这是目前项目中最大的定时炸弹。

-   **所在位置:**
    -   **违规实现:** `frontend/src/hooks/work/useWorkCharacters.ts` 和 `frontend/src/hooks/work/useWorkWorldview.ts` (依赖神秘的 `worksApi`)。
    -   **合规实现:** `frontend/src/hooks/work/useWorkService.ts` (内部的 `useWorkCharacters` 和 `useWorkWorldview`，依赖 `relationship` 模块)。

-   **修复建议:**
    1.  **调查 `worksApi` 来源:** 必须查明 `import { worksApi } from "@/lib/api/works";` 的解析方式。这可能是未受版本控制的生成文件或隐蔽的构建配置。**在任何修改前，必须先理解它。**
    2.  **决策与统一:** 在两种实现中选择一个作为标准。基于 `relationship` 的实现更符合当前架构，但需评估其是否满足所有业务需求。
    3.  **彻底移除:** 废弃并彻底删除另一套实现，包括其依赖的 `worksApi` 及相关的 hook 文件。
    4.  **代码迁移:** 将所有使用废弃 hook 的地方全部迁移到标准实现上。

### 2.2. 生产构建中忽略 ESLint 错误检查

-   **问题描述:**
    `next.config.ts` 中配置了 `eslint: { ignoreDuringBuilds: true }`，这允许包含严重语法错误、类型错误或违反代码规范的代码被成功构建并部署到生产环境，可能导致运行时崩溃或难以预料的 Bug。

-   **所在位置:**
    -   `frontend/next.config.ts`

-   **修复建议:**
    1.  **立即修复配置:** 将 `ignoreDuringBuilds` 设置为 `false` 或直接移除该配置块。
    2.  **清理 Lint 错误:** 在修改配置前，必须在本地运行 `pnpm lint --fix` 并手动解决所有现存的 ESLint 错误和警告，确保代码库是干净的。

---

## 3. `P1` - 架构与代码一致性问题 (高优先级)

*此类别中的问题破坏了代码的一致性和可维护性，是导致技术债快速累积的主要原因。*

### 3.1. `lookup` 功能架构重构

-   **问题描述:**
    当前的 `lookup`（速查）功能存在严重的架构问题：组件位置不当、逻辑耦合过紧、数据流不清晰且与既定分层架构原则相悖。`useLookup` hook 硬编码了多个数据源，并采用低效的客户端过滤。

-   **所在位置:**
    -   `frontend/src/components/common/lookup/`
    -   `frontend/src/hooks/lookup/useLookup.ts`

-   **修复建议:**
    1.  **废弃 `useLookup` Hook:** 删除 `useLookup.ts` 文件。
    2.  **组件迁移与归属:**
        -   将 `CharacterCard.tsx` 迁移至 `frontend/src/features/characters/components/`。
        -   取消 `WorldItemCard.tsx` 的注释，修复其类型依赖（使用 `WorldviewItemResponse`），重命名为 `WorldviewItemCard.tsx`，并迁移至 `frontend/src/features/worldview/components/`。
    3.  **引入“注册-发现”模式:**
        -   创建一个可复用的 `SettingsLookup` UI 框架组件。
        -   定义一个 `LookupSource` 接口，要求每个可查阅的数据源（feature）都实现此接口，提供自己的数据获取hook (`useData`) 和渲染组件 (`renderItem`)。
        -   在 `features/characters` 和 `features/worldview` 中分别实现并导出各自的 `LookupSource`。
        -   `SettingsLookup` 动态加载所有已注册的 `LookupSource`，实现功能的完全解耦和高可扩展性。

### 3.2. `chapter` 模块存在重复的 Service 和 Hook

-   **问题描述:**
    代码库中同时存在 `chapter.service.ts` / `useChapterService.ts` 和 `chapters.service.ts` / `useChapters.ts`。前者是符合架构规范的新实现，后者是应被废弃的旧实现，导致维护混乱和潜在 Bug。

-   **所在位置:**
    -   `frontend/src/lib/services/chapters.service.ts` (待删除)
    -   `frontend/src/hooks/chapter/useChapters.ts` (待删除)

-   **修复建议:**
    1.  **全局替换:** 在整个代码库中，将所有对 `useChapters` 的导入和使用替换为 `useChapterService`。
    2.  **安全删除:** 确认没有引用后，安全删除 `chapters.service.ts` 和 `useChapters.ts` 两个文件。

### 3.3. 存在违反 `features` 原则的 `page-components` 目录

-   **问题描述:**
    `app/(main)/page-components/` 目录的存在违反了“高内聚”的目录结构规范。其中的组件（`QuickActions.tsx`, `RecentWorks.tsx`, `StatsCard.tsx`）都属于 `dashboard` 页面，应归属于其路由之下。

-   **所在位置:**
    -   `frontend/src/app/(main)/page-components/`

-   **修复建议:**
    1.  **创建归属目录:** 创建 `frontend/src/app/(main)/dashboard/components/`。
    2.  **迁移组件:** 将 `page-components` 下的所有组件移动到上述新目录中。
    3.  **更新引用:** 修改 `dashboard` 页面对这些组件的导入路径。
    4.  **删除空目录:** 删除 `page-components` 目录。

---

## 4. `P2` - 未完成的功能与技术债 (中优先级)

*此类别中的问题是已知的功能缺失或临时性解决方案，需要在核心架构稳定后进行补全。*

### 4.1. `settings` 页面功能缺失

-   **问题描述:**
    整个设置页面功能被完全注释掉了，导致用户无法进行任何应用级别的设置。

-   **所在位置:**
    -   `frontend/src/app/(main)/settings/page.tsx`

-   **修复建议:**
    1.  **评估需求:** 确定 MVP 版本需要哪些设置项。
    2.  **重新实现:** 取消该文件的注释，并根据最新的 `react-hook-form`、`zod` 和 `react-query` 规范，重新实现设置的加载和保存逻辑。

### 4.2. 章节导出功能不完整

-   **问题描述:**
    在章节预览页面，导出功能中“按分卷导出”和“按全书导出”的逻辑被注释，并明确标记需要重新实现。

-   **所在位置:**
    -   `frontend/src/app/(main)/chapters/[id]/preview/page.tsx`

-   **修复建议:**
    -   恢复逻辑并适配新的 `useChapterService` hook 的数据结构。

### 4.3. 角色关系图功能缺失

-   **问题描述:**
    在角色详情页面，用于展示角色关系图的 `CharacterRelations` 组件的导入和使用被注释掉了。

-   **所在位置:**
    -   `frontend/src/app/(main)/tools/characters/[id]/page.tsx`

-   **修复建议:**
    -   评估 `CharacterRelations` 组件的可用性，恢复或重新实现该功能。

---

## 5. `P3` - 代码质量与规范提升 (低优先级)

*此类别中的问题旨在提升代码的长期健康度和开发体验。*

### 5.1. ESLint 配置过于宽松

-   **问题描述:**
    当前的 ESLint 配置缺少一些能显著提升代码质量和一致性的关键规则，且未与 Prettier 进行集成，可能导致规则冲突。

-   **所在位置:**
    -   `frontend/eslint.config.mjs`

-   **修复建议:**
    1.  **集成 Prettier:** 添加 `eslint-config-prettier` 来禁用与 Prettier 冲突的格式化规则。
    2.  **增强规则:** 引入 `eslint-plugin-import` 实现导入排序，并添加如强制显式返回类型等更严格的规则。

### 5.2. 潜在的冗余依赖

-   **问题描述:**
    `package.json` 中存在 `tw-animate-css` 依赖，其功能可能与已有的 `framer-motion` 重叠。

-   **所在位置:**
    -   `frontend/package.json`

-   **修复建议:**
    -   评估项目中 `tw-animate-css` 的使用情况。如果可以被 `framer-motion` 或纯 `Tailwind CSS` 动画替代，则移除该依赖以保持技术栈的精简。
