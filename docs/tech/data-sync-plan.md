# 前后端数据对接技术方案 (Data Sync Plan)

**版本:** 1.2
**日期:** 2025-07-27
**关联需求:** `requirements/data-sync-spec.md`

## 1. 概述

本技术文档为“网络小说作家作品管理系统”的后续模块开发提供具体的技术实现指导。内容包括统一的数据模型定义、API端点审查与设计、分步对接计划以及前端状态管理策略，旨在解决当前架构中的核心问题，并指导后续的开发工作。

## 2. 统一数据模型定义 (Unified Type Definitions)

为解决前后端类型不一致的问题，并推进数据模型解耦的架构目标，所有新模块和重构模块应采用以下 TypeScript 类型定义作为“单一事实来源”。后端 Go 模型应据此进行调整。

```typescript
// src/types/core/index.ts

// =================================
// 基础类型 (Base Types)
// =================================

export interface BaseEntity {
  id: number; // 使用 number 统一代替 string
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

// =================================
// 核心实体 (Core Entities)
// =================================

// 作品
export interface Work extends BaseEntity {
  userId: number;
  title: string;
  description: string;
  coverImageUrl?: string;
  category: string; // e.g., 'fantasy', 'sci-fi'
  status: 'ongoing' | 'completed' | 'on_hold';
}

// 章节 (已发布)
export interface Chapter extends BaseEntity {
  workId: number;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  status: 'published' | 'archived';
  publishedAt?: string;
}

// 草稿 (未发布)
export interface Draft extends BaseEntity {
  workId: number;
  title: string;
  content: string;
}

// 角色 (独立实体)
export interface Character extends BaseEntity {
  userId: number;
  name: string;
  alias?: string;
  avatarUrl?: string;
  appearanceDesc?: string;
  personalityDesc?: string;
  abilityDesc?: string;
  backgroundStory?: string;
}

// 世界观分类
export interface WorldviewCategory extends BaseEntity {
  userId: number;
  name: string;
}

// 世界观条目 (独立实体)
export interface WorldviewItem extends BaseEntity {
  userId: number;
  categoryId: number;
  name: string;
  description: string;
  coverImageUrl?: string;
}

// =================================
// 关系与关联 (Relations & Associations)
// =================================

// 作品与角色的关联 (成长履历)
export interface WorkCharacter {
  workId: number;
  characterId: number;

  // 在这部作品中的专属设定
  workSpecificAlias?: string; // 别名/身份，例如“黑夜骑士”
  workSpecificStatus?: string; // 状态/头衔，例如“失忆”、“王子”

  // 成长履历 (由AI或作者手动填充)
  growthLog: Array<{
    chapterId: number; // 关联章节
    eventSummary: string; // 事件摘要，例如“在XX战役中觉醒了新能力”
    characterGrowth: string; // 人物成长，例如“对XX的看法发生改变”
  }>;

  // 人物关系 (在这部作品中) - [已废弃] 由通用的 EntityRelationship 模型取代
  // relationships: Array<{...}>;
}

// 作品与世界观的关联
export interface WorkWorldview {
  workId: number;
  worldviewItemId: number;
}

// 定义系统中可以建立关系的实体类型
export type RelatableEntityType = 'Character' | 'WorldviewItem' | 'Work';

// 通用关系模型
export interface EntityRelationship extends BaseEntity {
  sourceEntityType: RelatableEntityType;
  sourceEntityId: number;

  targetEntityType: RelatableEntityType;
  targetEntityId: number;

  relationshipType: string; // 例如 "成员", "师徒", "敌对", "从属"
  description?: string; // 关系描述
}

// =================================
// 用户设置 (User Settings)
// =================================

export interface UserSettings {
  userId: number;
  aiModel: 'gpt-4' | 'claude-3' | 'custom';
  customApiEndpoint?: string;
  // API Key 不应在前端传输或存储
  editorTheme: 'light' | 'dark';
  fontSize: number;
  lineHeight: number;
}
```

---

## 3. API 端点审查与设计

### 3.1. 现有 API 问题

1.  **角色/世界观 API 耦合:** 前端 `useCharacters` 和 `useWorldbuilding` hooks 强依赖 `workId`，但后端 `Character` 和 `Worldview` 模型是用户级资源，API 也是顶级路由 (`/api/v1/characters`)。这种不匹配是当前问题的根源。
2.  **登出 Bug:** `/api/v1/auth/logout` 存在 500 错误，应在后续迭代中修复。

### 3.2. API 设计与重构建议

#### 角色管理 (`/api/v1/characters`)

-   **`GET /api/v1/characters`**: 保持不变，获取当前用户的所有角色。
-   **`POST /api/v1/characters`**: 保持不变，为当前用户创建新角色。
-   **`PUT /api/v1/characters/:id`**: 保持不变，更新角色信息。
-   **`DELETE /api/v1/characters/:id`**: 保持不变，删除角色。

#### 世界观管理 (`/api/v1/worldview`)

-   **`GET /api/v1/worldview/categories`**: 获取用户的世界观分类。
-   **`POST /api/v1/worldview/categories`**: 创建新的世界观分类。
-   **`GET /api/v1/worldview/items`**: 获取用户的所有世界观条目，支持按 `categoryId` 过滤。
-   **`POST /api/v1/worldview/items`**: 创建新的世界观条目。

#### **新增**：作品与实体的关联 API

为了实现解耦，需要为 `Work` 资源增加用于管理关联的子路由。

-   **`GET /api/v1/works/:workId/characters`**: 获取指定作品**已关联**的角色列表。
-   **`POST /api/v1/works/:workId/characters`**: 将一个或多个角色关联到作品。
    -   请求体: `{ "characterIds": [1, 2, 3] }`
-   **`DELETE /api/v1/works/:workId/characters/:characterId`**: 从作品中移除一个角色的关联。

-   **`GET /api/v1/works/:workId/worldview-items`**: 获取指定作品**已关联**的世界观条目列表。
-   **`POST /api/v1/works/:workId/worldview-items`**: 将一个或多个世界观条目关联到作品。
    -   请求体: `{ "worldviewItemIds": [1, 2, 3] }`
-   **`DELETE /api/v1/works/:workId/worldview-items/:itemId`**: 从作品中移除一个世界观条目的关联。

#### **新增**：通用实体关系 API

-   **`GET /api/v1/relationships?sourceEntityId=1&sourceEntityType=Character`**: 获取指定实体（如某个角色）的所有关系。
-   **`POST /api/v1/relationships`**: 创建一个新的关系。
    -   请求体: `{ sourceEntityType, sourceEntityId, targetEntityType, targetEntityId, relationshipType, description }`
-   **`PUT /api/v1/relationships/:id`**: 更新一个关系（例如，修改描述）。
-   **`DELETE /api/v1/relationships/:id`**: 删除一个关系。

#### 草稿发布

-   **`POST /api/v1/drafts/:id/publish`**: 保持现有逻辑。后端服务层必须使用**数据库事务**来保证“创建`Chapter`”和“删除`Draft`”的原子性。

---

## 4. 分步对接计划

### 模块一：角色管理重构

1.  **后端:**
    -   实现新增的 `/api/v1/works/:workId/characters` 相关 API。
    -   确保 `Character` 模型与统一类型定义一致。
2.  **前端 API 客户端 (`src/lib/api/`):**
    -   创建 `works.ts` API 客户端，添加 `getAssociatedCharacters`, `associateCharacters`, `dissociateCharacter` 方法。
    -   修改 `characters.ts` 客户端，移除所有 `workId` 参数。
3.  **前端 React Query Hooks (`src/hooks/`):**
    -   重构 `useCharacters.ts` hook：
        -   `fetchCharacters` 调用 `GET /api/v1/characters` 获取完整的角色库。
        -   新增 `useWorkCharacters(workId)` hook，专门用于获取和管理与特定作品关联的角色，它将调用 `GET /api/v1/works/:workId/characters`。
4.  **前端 UI 组件:**
    -   修改角色管理页面，使其直接与 `useCharacters` 交互，管理全局角色库。
    -   在作品相关页面（如大纲页），使用 `useWorkCharacters` 来展示和管理该作品的角色。提供一个“从库中添加”的弹窗，让用户从全局角色库中选择角色进行关联。

### 模块二：世界观管理重构

*对接步骤与角色管理完全相同，只是将 `Character` 替换为 `WorldviewItem` 和 `WorldviewCategory`。*

1.  **后端:** 实现 `/api/v1/works/:workId/worldview-items` API。
2.  **前端 API 客户端:** 更新/创建 `works.ts` 和 `worldview.ts` 客户端。
3.  **前端 React Query Hooks:** 重构 `useWorldbuilding.ts`，并创建新的 `useWorkWorldview(workId)` hook。
4.  **前端 UI 组件:** 调整世界观管理页面和作品内引用界面。

### 模块三：草稿与章节对接

1.  **后端:** 确认 `/api/v1/drafts/:id/publish` 接口的事务性是可靠的。
2.  **前端 API 客户端:** 实现 `publishDraft(draftId)` 方法。
3.  **前端 React Query Hooks:** 在 `useDrafts.ts` hook 中添加 `publishDraft` mutation。
4.  **前端 UI 组件:**
    -   在草稿卡片或草稿编辑页面添“发布”按钮。
    -   点击按钮后，调用 `publishDraft` mutation。
    -   成功后，应使用 `queryClient.invalidateQueries` 来使草稿列表和章节列表的缓存失效，以触发UI更新。

---

## 5. 状态管理策略 (React Query)

-   **查询键 (Query Keys):** 采用结构化的查询键，便于管理和批量失效。
    -   全局资源: `['characters']`, `['worldviewItems']`
    -   与作品相关的资源: `['works', workId, 'characters']`, `['works', workId, 'chapters']`
-   **乐观更新 (Optimistic Updates):** 对于“关联/取消关联”等轻量级操作，可以考虑使用乐观更新来提升用户体验。例如，当用户从作品中移除一个角色关联时，可以立即在UI上移除该角色，如果后端请求失败，再将其恢复。
-   **缓存失效 (Cache Invalidation):**
    -   当创建一个新角色时，应使 `['characters']` 查询失效。
    -   当将角色关联到作品时，应使 `['works', workId, 'characters']` 查询失效。
    -   当发布草稿时，应同时使 `['works', workId, 'drafts']` 和 `['works', workId, 'chapters']` 两个查询失效。