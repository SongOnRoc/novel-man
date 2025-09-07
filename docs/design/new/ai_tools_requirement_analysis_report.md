# AI 工具需求分析报告

## 1. 概述

本文档旨在对 `docs/requirements/ai-tools.md` 中提出的AI助手功能需求进行深入分析。通过结合当前项目的代码现状，本文档将详细拆解需求、评估其影响，并为后续的技术设计和开发工作提供明确的指导。

## 2. 现状分析 (As-Is)

通过对现有代码库（`backend/internal/controllers/ai/handler.go`, `backend/internal/services/ai/ai_service.go`, `frontend/src/lib/services/ai.service.ts`）的审查，我们发现当前AI功能存在以下特点：

*   **API 结构分散**: 后端提供了多个独立的API端点（如 `/ai/completion`, `/ai/polish`），每个端点对应一个具体的功能。这导致前端需要为每个功能实现独立的调用逻辑，缺乏统一性和可扩展性。
*   **核心逻辑缺失**: 后端服务层（`ai_service.go`）中的所有AI相关方法均为占位符，尚未与任何实际的AI模型进行集成。
*   **无数据持久化**: AI模块目前不涉及任何数据库操作，缺少对提示词、模型配置等关键数据的管理能力。
*   **前端功能硬编码**: 前端定义了基础AI功能类型（`AIPromptType`），但这些类型是硬编码在代码中的，无法动态配置或由用户扩展。

**结论**: 当前系统仅提供了一个AI功能的基本框架，其设计和实现均不满足新需求文档中的预期，需要进行全面的重构和功能开发。

## 3. 需求拆解与影响评估 (To-Be)

以下是对新需求的详细拆解、分析及影响评估。

### 3.1. 统一生成接口

*   **需求描述**:
    *   所有AI生成功能统一通过 `/api/generate` 接口调用。
    *   `GET /api/generate`: 获取所有可用的助手类型列表。
    *   `POST /api/generate`: 携带 `助手类型`、`提示词ID` 和 `请求文本`，返回生成的文本。
*   **影响分析**:
    *   **后端**:
        *   需要废弃现有的所有 `/ai/*` 端点。
        *   需要创建一个新的控制器来处理 `/api/generate` 的 `GET` 和 `POST` 请求。
        *   `POST` 请求的处理逻辑需要能够根据传入的“助手类型”或“提示词ID”动态地调用不同的AI模型或执行不同的提示词模板。
        *   `GET` 请求需要返回一个预设的或可配置的助手类型列表。
    *   **前端**:
        *   需要重构 `ai.service.ts`，将所有分散的API调用统一为一个 `generate(params)` 函数。
        *   需要实现一个服务来调用 `GET /api/generate` 以动态获取助手类型列表，并更新相关UI组件（如：模型选择下拉框）。
*   **开发优先级**: **高** - 这是整个新功能的核心基础。

### 3.2. 提示词管理功能

*   **需求描述**:
    *   提供完整的CRUD（创建、读取、更新、删除）功能的 `/api/prompt` 接口。
    *   定义提示词（Prompt）的数据模型，包含 `ID`, `title`, `content`, `type`, `tags` 等字段。
    *   API响应数据需经过筛选，仅返回部分安全字段。
*   **影响分析**:
    *   **后端**:
        *   **（全新功能）** 需要在数据库中创建一张 `prompts` 表。
        *   需要定义与该表对应的GORM模型。
        *   需要创建一个全新的模块，包含 `PromptController`, `PromptService`, 和 `PromptRepository`，以实现完整的CRUD逻辑。
        *   需要实现用户身份验证，确保用户只能管理自己的提示词。
    *   **前端**:
        *   **（全新功能）** 需要创建一个新的服务 `prompt.service.ts` 来调用 `/api/prompt` 接口。
        *   需要开发全新的UI界面（可能是一个弹窗或独立页面），用于展示“提示词库”，并提供新建、编辑和删除提示词的功能。
*   **开发优先级**: **高** - 这是实现“AI工具基础功能”和“提示词库”的前提。

### 3.3. 基础与高级功能

#### 3.3.1. 模型选择功能

*   **需求描述**: 前端提供助手类型选择，后端将类型名转换为具体的AI模型名。支持默认模型。
*   **影响分析**:
    *   **后端**: AI服务层需要增加一个映射逻辑，将前端传来的“助手类型”（如 "通用写作助手"）映射到内部的模型配置（如 "gpt-4"）。这个映射关系可以存储在配置文件或数据库中。
    *   **前端**: UI需要提供一个下拉菜单或其他选择器，让用户可以选择助手类型。该列表应通过 `GET /api/generate` 动态获取。

#### 3.3.2. AI工具基础功能 (内置提示词)

*   **需求描述**: 提供“扩写”、“缩写”等快捷按钮。点击按钮时，将内置的提示词ID和用户文本发送到 `/api/generate` 接口。
*   **影响分析**:
    *   **后端**: 需要在 `prompts` 表中预置一批系统级别的提示词（例如，`type` 字段可以标记为 'system'）。`/api/generate` 接口需要能处理传入 `prompt_id` 的情况。
    *   **前端**: AI工具面板的按钮需要与这些系统提示词ID进行绑定。

#### 3.3.3. 模型配置功能 (高级)

*   **需求描述**: 允许用户设置自定义的AI `base_url`, `model`, `api_key`，并命名为新的助手类型。
*   **影响分析**:
    *   **后端**:
        *   可能需要在 `user_settings` 表或一张新表中增加字段来存储用户的自定义AI配置。
        *   AI服务在处理生成请求时，需要检查所选的“助手类型”是否为用户自定义类型。如果是，则使用该用户存储的配置来调用AI服务。
    *   **前端**:
        *   需要在用户设置页面中增加一个新的表单，用于输入和保存自定义模型配置。

#### 3.3.4. 提示词库与使用 (高级)

*   **需求描述**: 用户可以在AI工具中使用自己创建或收藏的提示词。
*   **影响分析**:
    *   **前端**: AI工具面板需要增加一个“从库中选择”的按钮，点击后弹出“提示词库”界面（见3.2），供用户选择一个提示词来使用。

## 4. 初步结论与建议

新的AI工具需求是一项系统性工程，涉及前后端的重大重构和多个新功能的开发。建议采用分阶段的开发策略：

1.  **第一阶段 (核心功能)**:
    *   重构后端，实现统一的 `/api/generate` 接口。
    *   实现后端的提示词管理模块 (`/api/prompt`) 和数据库表。
    *   前端重构AI服务，并开发提示词管理界面。
    *   实现基础的“模型选择”和“AI工具基础功能”。

2.  **第二阶段 (高级功能)**:
    *   开发后端的自定义模型配置存储和调用逻辑。
    *   开发前端的用户自定义模型配置界面。
    *   将提示词库选择功能集成到AI工具面板中。

这份报告为项目的下一步规划提供了基础。建议项目团队基于此报告进行技术方案设计和任务排期。

---

## 5. 数据模型与API设计

本章节提供用于实现上述需求的具体技术设计规范。

### 5.1. 数据模型 (Data Models)

#### 5.1.1. `Prompt` 模型

该模型用于存储用户或系统预设的AI提示词。

**Go Struct 定义:**

```go
// Prompt 定义了用户或系统预设的AI提示词。
type Prompt struct {
	Base
	UserID   uint      `gorm:"not null" json:"user_id"`
	Title    string    `gorm:"type:varchar(255);not null" json:"title"`
	Content  string    `gorm:"type:text;not null" json:"content"`
	Type     string    `gorm:"type:varchar(100);not null;default:'user'" json:"type"` // e.g., 'user', 'system'
	Tags     *string   `gorm:"type:varchar(255)" json:"tags,omitempty"`               // Comma-separated tags
	Status   string    `gorm:"type:varchar(50);not null;default:'active'" json:"status"`
	IsSystem bool      `gorm:"default:false" json:"is_system"` // True for system-provided prompts like 'expand', 'summarize'
}
```

**数据库表名:** `prompts`

**字段说明:**

| 字段名   | 数据类型     | GORM 约束/标签                                 | 描述                                           |
| :------- | :----------- | :--------------------------------------------- | :--------------------------------------------- |
| `ID`     | `uint`       | `primarykey`                                   | 唯一标识符                                     |
| `UserID` | `uint`       | `not null`                                     | 所属用户的ID                                   |
| `Title`  | `string`     | `varchar(255);not null`                        | 提示词标题                                     |
| `Content`| `string`     | `text;not null`                                | 提示词的具体内容                               |
| `Type`   | `string`     | `varchar(100);not null;default:'user'`         | 类型（'user' 用户创建, 'system' 系统内置）     |
| `Tags`   | `*string`    | `varchar(255)`                                 | 逗号分隔的标签字符串，用于分类和搜索           |
| `Status` | `string`     | `varchar(50);not null;default:'active'`        | 状态 ('active', 'archived')                    |
| `IsSystem` | `bool`     | `default:false`                                | 是否为系统内置提示词，系统提示词通常不允许用户修改 |

#### 5.1.2. `UserAICustomSetting` 模型

该模型用于存储用户自定义的AI模型配置。

**Go Struct 定义:**

```go
// UserAICustomSetting 存储用户自定义的AI模型连接信息。
type UserAICustomSetting struct {
	Base
	UserID        uint   `gorm:"not null;uniqueIndex:idx_user_setting_name" json:"user_id"`
	Name          string `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_setting_name" json:"name"` // 用户为这个配置起的名字，e.g., "My Custom GPT-4"
	BaseURL       string `gorm:"type:varchar(255);not null" json:"base_url"`
	ModelName     string `gorm:"type:varchar(255);not null" json:"model_name"`
	APIKey        string `gorm:"type:varchar(255);not null" json:"-"` // API Key 不应通过API返回给前端
	IsDefault     bool   `gorm:"default:false" json:"is_default"`
}
```

**数据库表名:** `user_ai_custom_settings`


### 5.2. API 接口规范 (API Specification)

#### 5.2.1. 统一生成接口: `/api/generate`

##### `GET /api/generate`

*   **功能**: 获取所有可用的助手类型列表。
*   **认证**: 需要用户登录。
*   **响应 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "Success",
      "data": [
        { "name": "default", "label": "默认助手" },
        { "name": "creative-writing", "label": "创意写作助手" },
        { "name": "technical-writing", "label": "技术写作助手" }
      ]
    }
    ```
    *   **Go Struct 定义**:
        ```go
        // AssistantTypeResponse is the response for assistant type list.
        type AssistantTypeResponse struct {
            Name  string `json:"name"`
            Label string `json:"label"`
        }
        ```

##### `POST /api/generate`

*   **功能**: 根据指定参数生成文本。
*   **认证**: 需要用户登录。
*   **请求体**:
    ```json
    {
      "text": "这是用户输入的原始文本。",
      "assistant_type": "default",
      "prompt_id": 123,
      "context": {
        "work_id": 1,
        "style_preference": "formal"
      }
    }
    ```
    *   **Go Struct 定义**:
        ```go
        // GenerateRequest 是统一生成接口的请求体。
        type GenerateRequest struct {
            Text          string     `json:"text" binding:"required"`
            AssistantType string     `json:"assistant_type"` // Corresponds to a model name or a system prompt category
            PromptID      *uint      `json:"prompt_id,omitempty"`
            Context       *AIContext `json:"context,omitempty"`
        }
        ```
*   **响应 (200 OK)**:
    ```json
    {
      "code": 200,
      "message": "Success",
      "data": {
        "generated_text": "这是AI根据请求生成的文本。"
      }
    }
    ```
    *   **Go Struct 定义**:
        ```go
        // GenerateResponse 是统一生成接口的响应体。
        type GenerateResponse struct {
            GeneratedText string `json:"generated_text"`
        }
        ```

#### 5.2.2. 提示词管理接口: `/api/prompts`

##### `GET /api/prompts`

*   **功能**: 获取当前用户的所有提示词。
*   **认证**: 需要用户登录。
*   **查询参数**:
    *   `type` (string, optional): 按类型筛选 ('user', 'system')
    *   `tag` (string, optional): 按标签筛选
*   **响应 (200 OK)**:
    *   **Go Struct 定义**:
        ```go
        // PromptResponse defines the data structure for a prompt returned to the client.
        // It omits the full 'Content' field for brevity in list views.
        type PromptResponse struct {
            ID        uint      `json:"id"`
            Title     string    `json:"title"`
            Type      string    `json:"type"`
            Tags      *string   `json:"tags,omitempty"`
            UpdatedAt time.Time `json:"updated_at"`
            UserID    uint      `json:"user_id"`
            Status    string    `json:"status"`
            IsSystem  bool      `json:"is_system"`
        }
        ```

##### `POST /api/prompts`

*   **功能**: 创建一个新的提示词。
*   **认证**: 需要用户登录。
*   **请求体**:
    *   **Go Struct 定义**:
        ```go
        // CreatePromptRequest is the request for creating a new prompt.
        type CreatePromptRequest struct {
            Title   string  `json:"title" binding:"required"`
            Content string  `json:"content" binding:"required"`
            Type    string  `json:"type"` // Should default to 'user' if not provided
            Tags    *string `json:"tags,omitempty"`
        }
        ```
*   **响应 (201 Created)**: 返回新创建的提示词对象 (`PromptResponse`)。

##### `PUT /api/prompts/:id`

*   **功能**: 更新一个已存在的提示词。
*   **认证**: 需要用户登录，且用户必须是该提示词的所有者。
*   **请求体**:
    *   **Go Struct 定义**:
        ```go
        // UpdatePromptRequest is the request for updating an existing prompt.
        type UpdatePromptRequest struct {
            Title   *string `json:"title,omitempty"`
            Content *string `json:"content,omitempty"`
            Tags    *string `json:"tags,omitempty"`
            Status  *string `json:"status,omitempty"`
        }
        ```
*   **响应 (200 OK)**: 返回更新后的提示词对象 (`PromptResponse`)。

##### `DELETE /api/prompts/:id`

*   **功能**: 删除一个提示词。
*   **认证**: 需要用户登录，且用户必须是该提示词的所有者。
*   **响应 (204 No Content)**.

#### 5.2.3. 用户自定义AI配置接口: `/api/ai/custom-settings`

##### `GET /api/ai/custom-settings`

*   **功能**: 获取当前用户的所有自定义AI配置。
*   **认证**: 需要用户登录。
*   **响应 (200 OK)**: 返回一个 `UserAICustomSetting` 对象的列表 (不包含 `APIKey` 字段)。

##### `POST /api/ai/custom-settings`

*   **功能**: 创建一个新的自定义AI配置。
*   **认证**: 需要用户登录。
*   **请求体**: 包含 `Name`, `BaseURL`, `ModelName`, `APIKey`, `IsDefault` 字段。
*   **响应 (201 Created)**: 返回新创建的配置对象 (不包含 `APIKey` 字段)。

##### `PUT /api/ai/custom-settings/:id`

*   **功能**: 更新一个已存在的自定义AI配置。
*   **认证**: 需要用户登录，且用户是该配置的所有者。
*   **请求体**: 包含 `Name`, `BaseURL`, `ModelName`, `APIKey`, `IsDefault` 的可选字段。
*   **响应 (200 OK)**: 返回更新后的配置对象 (不包含 `APIKey` 字段)。

##### `DELETE /api/ai/custom-settings/:id`

*   **功能**: 删除一个自定义AI配置。
*   **认证**: 需要用户登录，且用户是该配置的所有者。
*   **响应 (204 No Content)**.