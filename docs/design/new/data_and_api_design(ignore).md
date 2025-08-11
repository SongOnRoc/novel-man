# 新版数据结构与API接口设计 (最终完整版)

本文档是数据结构与API接口的最终设计方案，旨在为后续开发提供清晰、完整、统一的指导。

---
---

# 第一部分：数据结构设计

**致歉声明：** 此前版本在模型组织和 `WorkCharacter` 的设计上存在严重缺陷。本最终版已根据您的指示，对文档结构和核心模型进行了彻底重构，并提供清晰的回退逻辑代码示例。

---

## 1.1 通用基础模型

```go
package models

import (
    "time"
    "gorm.io/gorm"
    "database/sql/driver"
    "encoding/json"
    "errors"
)

// Base 包含所有模型共有的ID、创建时间、更新时间和软删除字段。
type Base struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ExperienceContentJSONB 是为ExperienceContent字段定制的JSON类型。
type ExperienceContentJSONB struct {
    Time         string `json:"time"`
    CharacterIDs []uint `json:"character_ids"`
    WorldviewIDs []uint `json:"worldview_ids"`
}

// Value a GORM interface for writing data to the database.
func (ec ExperienceContentJSONB) Value() (driver.Value, error) {
    return json.Marshal(ec)
}

// Scan implements the GORM interface for reading data from the database.
func (ec *ExperienceContentJSONB) Scan(value interface{}) error {
    bytes, ok := value.([]byte)
    if !ok {
        return errors.New("type assertion to []byte failed")
    }
    return json.Unmarshal(bytes, &ec)
}
```

---

## 1.2 用户域 (User Domain)

此域定义了系统的基本用户。

```go
package models

// User 代表应用的用户。
type User struct {
	Base
	Username     string `gorm:"type:varchar(255);unique;not null" json:"username"`
	Email        string `gorm:"type:varchar(255);unique;not null" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"`
	Avatar       string `gorm:"type:varchar(255)" json:"avatar"`
}
```

---

## 1.3 创作资产域 (Creative Asset Domain)

此域定义了可跨作品复用的全局创作模板。

```go
package models

// Character 是一个全局的角色模板，定义了角色的基础、跨作品的属性。
type Character struct {
	Base
	UserID          uint   `gorm:"not null" json:"user_id"`
	Name            string `gorm:"type:varchar(255);not null" json:"name"`
	Alias           string `gorm:"type:varchar(255)" json:"alias"`
	AvatarURL       string `gorm:"type:varchar(255)" json:"avatar_url"`
	Gender          string `gorm:"type:varchar(50)" json:"gender"`
	// 注意：这里的Age是角色的基础设定年龄，在具体作品中可能会被覆盖
	Age             int    `json:"age"`
	Occupation      string `gorm:"type:varchar(255)" json:"occupation"`
	Appearance      string `gorm:"type:text" json:"appearance"`
	Personality     string `gorm:"type:text" json:"personality"`
	Abilities       string `gorm:"type:text" json:"abilities"`
	BackgroundStory string `gorm:"type:text" json:"background_story"`
	Notes           string `gorm:"type:text" json:"notes"`
}

// WorldviewCategory 用于对世界观条目进行分类。
type WorldviewCategory struct {
	Base
	UserID uint   `gorm:"not null" json:"user_id"`
	// 优化：将唯一约束改为用户范围内的联合唯一约束，允许不同用户拥有同名分类。
	Name   string `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_category_name" json:"name"`
}

// WorldviewItem 是一个全局的世界观资产。
type WorldviewItem struct {
	Base
	UserID        uint   `gorm:"not null" json:"user_id"`
	CategoryID    uint   `gorm:"not null" json:"category_id"`
	Name          string `gorm:"type:varchar(255);not null" json:"name"`
	Description   string `gorm:"type:text" json:"description"`
	CoverImageURL string `gorm:"type:varchar(255)" json:"cover_image_url"`

	// GORM 关联：一个世界观条目可以被多个作品和角色使用
	Works     []Work      `gorm:"many2many:work_worldview_items;" json:"-"`
	Characters []Character `gorm:"many2many:character_worldview_items;" json:"-"`
}
```

---

## 1.4 写作域 (Writing Domain)

此域定义了作品、章节等核心写作实体。

```go
package models

// Work 是单个写作项目（如小说）的聚合根。
type Work struct {
	Base
	UserID        uint   `gorm:"not null" json:"user_id"`
	Title         string `gorm:"type:varchar(255);not null" json:"title"`
	Description   string `gorm:"type:text" json:"description"`
	CoverImageURL string `gorm:"type:varchar(255)" json:"cover_image_url"`
	Category      string `gorm:"type:varchar(100)" json:"category"`
	Status        string `gorm:"type:varchar(50)" json:"status"`
	Outline       string `gorm:"type:text" json:"outline"`

	// 优化：使用 GORM 的 many2many 标签自动处理作品与世界观条目的关联
	WorldviewItems []WorldviewItem `gorm:"many2many:work_worldview_items;" json:"worldview_items,omitempty"`
}

// Volume 是作品内部章节的逻辑分组。
type Volume struct {
	Base
	WorkID       uint   `gorm:"not null" json:"work_id"`
	Title        string `gorm:"type:varchar(255);not null" json:"title"`
	Outline      string `gorm:"type:text" json:"outline"`
	DisplayOrder int    `gorm:"default:0" json:"display_order"`
}

// Chapter 是已发布内容的聚合根。
type Chapter struct {
	Base
	WorkID       uint   `gorm:"not null" json:"work_id"`
	VolumeID     *uint  `json:"volume_id,omitempty"`
	Title        string `gorm:"type:varchar(255);not null" json:"title"`
	Content      string `gorm:"type:longtext" json:"content"`
	WordCount    int    `gorm:"default:0" json:"word_count"`
	DisplayOrder int    `gorm:"default:0" json:"display_order"`
	Status       string `gorm:"type:varchar(50)" json:"status"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
}

// Draft 是正在创作的内容的聚合根。
type Draft struct {
	Base
	UserID      uint   `gorm:"not null" json:"user_id"`
	WorkID      *uint  `json:"work_id,omitempty"`
	Title       string `gorm:"type:varchar(255);not null" json:"title"`
	Content     string `gorm:"type:longtext" json:"content"`
	Description string `gorm:"type:text" json:"description"`
	WordCount   int    `gorm:"default:0" json:"word_count"`
	Status      string `gorm:"type:varchar(50)" json:"status"`
}
```

---

## 1.5 关系与上下文域 (Relationship & Context Domain)

**这是所有交互的核心。** 此域定义了资产在作品中的具体表现和经历。

```go
package models

// WorkCharacter 代表一个角色在一个特定作品中的实例。
// 它可以继承和覆盖全局角色的属性，并且是其所有经历的拥有者。
type WorkCharacter struct {
    Base // 包含自己的ID, CreatedAt, UpdatedAt

    // --- 核心关联 ---
    WorkID      uint `gorm:"not null;uniqueIndex:idx_work_character"`
    CharacterID uint `gorm:"not null;uniqueIndex:idx_work_character"`

    // GORM关联：这使得我们可以通过 WorkCharacter 轻松访问到全局角色模板的信息
    Character   Character `gorm:"foreignKey:CharacterID" json:"-"` // json:"-" 避免在API中重复输出

    // --- 可覆盖/扩展的属性 (使用指针类型以支持'nil'值) ---
    // 这些字段允许角色在不同作品中有不同的表现。
    Alias           *string `json:"alias,omitempty"`
    Age             *int    `json:"age,omitempty"`
    Occupation      *string `json:"occupation,omitempty"`
    Appearance      *string `gorm:"type:text" json:"appearance,omitempty"`
    Personality     *string `gorm:"type:text" json:"personality,omitempty"`
    Abilities       *string `gorm:"type:text" json:"abilities,omitempty"`

    // --- 作品专属属性 ---
    WorkSpecificStatus *string `gorm:"type:varchar(100)" json:"work_specific_status,omitempty"`

    // --- 核心：该角色在该作品中的所有经历 ---
    Experiences []Experience `gorm:"foreignKey:WorkCharacterID" json:"experiences,omitempty"`
}
```

### Getters: 回退逻辑代码示例

为了在业务逻辑中实现“为空时回退”，我们可以为 `WorkCharacter` 定义一系列的 `Getter` 方法。

```go
package models

// GetAlias 返回作品中的特定别名，如果未设置，则回退到全局角色的别名。
func (wc *WorkCharacter) GetAlias() string {
    if wc.Alias != nil {
        return *wc.Alias
    }
    // 假设 wc.Character 已经被预加载 (Preloaded)
    return wc.Character.Alias
}

// GetAge 返回作品中的特定年龄，如果未设置，则回退到全局角色的年龄。
func (wc *WorkCharacter) GetAge() int {
    if wc.Age != nil {
        return *wc.Age
    }
    return wc.Character.Age
}

// GetAppearance 返回作品中的特定外貌描述，如果未设置，则回退。
func (wc *WorkCharacter) GetAppearance() string {
    if wc.Appearance != nil {
        return *wc.Appearance
    }
    return wc.Character.Appearance
}

// ...可以为所有可覆盖字段创建类似的Getter方法...
```

### `Experience` 模型 (遵照您的范例)

```go
package models

// Experience 记录了一段具体的经历。
type Experience struct {
    Base // 包含 ID, CreatedAt, UpdatedAt

    WorkCharacterID uint `gorm:"not null;index" json:"work_character_id"` // 外键，明确指向所属的“作品-角色”实例

    // --- 经历的核心要素 ---
    Content     string    `gorm:"type:text;not null" json:"content"` // 经历的纯文本描述

    // 存储结构化、可查询的关联信息
    ExperienceContent ExperienceContentJSONB `gorm:"type:jsonb" json:"experience_content"`

    // **新增字段**：用于关联到具体的章节
    ChapterID   *uint     `gorm:"index" json:"chapter_id,omitempty"`
}

// EntityRelationship 用于固化一个长期、明确的关系，例如家族关系、师徒关系。
type EntityRelationship struct {
	Base
	SourceEntityType string `gorm:"type:varchar(100);not null" json:"source_entity_type"`
	SourceEntityID   uint   `gorm:"not null" json:"source_entity_id"`
	TargetEntityType string `gorm:"type:varchar(100);not null" json:"target_entity_type"`
	TargetEntityID   uint   `gorm:"not null" json:"target_entity_id"`
	RelationshipType string `gorm:"type:varchar(100);not null" json:"relationship_type"`
	Description      string `gorm:"type:text" json:"description"`
	WorkID           *uint  `json:"work_id,omitempty"`
}

// **新增模型**：WorkWorldview 是一个多对多关联表，用于将世界观条目绑定到作品。
type WorkWorldview struct {
    WorkID          uint `gorm:"primaryKey"`
    WorldviewItemID uint `gorm:"primaryKey"`
    CreatedAt       time.Time
}

// **新增模型**：CharacterWorldview 是一个多对多关联表，用于将世界观条目绑定到角色。
type CharacterWorldview struct {
    CharacterID     uint `gorm:"primaryKey"`
    WorldviewItemID uint `gorm:"primaryKey"`
    CreatedAt       time.Time
}
```

---
---

# 第二部分：API接口设计

本文档基于最终确认的数据结构进行设计，对现有业务场景进行了全面覆盖，并为所有接口提供了详细的JSON请求/响应示例。

---

## 2.1 通用响应格式

### 成功响应
```json
{
    "code": 200,
    "message": "Success",
    "data": {}
}
```

### 失败响应
```json
{
    "code": 400,
    "message": "Error message",
    "error": "ERROR_CODE"
}
```

### 通用错误码
| 错误码 | HTTP状态码 | 描述 |
| --- | --- | --- |
| `INVALID_PARAMETER` | 400 | 请求参数无效或缺失。 |
| `UNAUTHORIZED` | 401 | 未提供有效的认证凭证。 |
| `PERMISSION_DENIED` | 403 | 用户无权执行此操作。 |
| `RESOURCE_NOT_FOUND` | 404 | 请求的资源不存在。 |
| `METHOD_NOT_ALLOWED` | 405 | 不支持该HTTP方法。 |
| `CONFLICT` | 409 | 资源冲突（例如，创建已存在的唯一资源）。 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误。 |

---

## 2.2 认证与用户 API

### `POST /api/v1/auth/register`
- **请求体**: `{"username": "user", "email": "user@example.com", "password": "password"}`
- **成功响应 (201)**: `{"code": 201, "message": "User created", "data": {"id": 1, "username": "user", "email": "user@example.com"}}`

### `POST /api/v1/auth/login`
- **请求体**: `{"identifier": "user", "password": "password"}`
- **成功响应 (200)**: `{"code": 200, "message": "Login successful", "data": {"access_token": "...", "token_type": "Bearer", "expires_in": 7200}}`

### `GET /api/v1/users/me`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, "username": "user", "email": "user@example.com"}}`

### `GET /api/v1/users/me/settings`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"theme": "dark", "language": "zh-CN"}}`

### `PUT /api/v1/users/me/settings`
- **请求体**: `{"theme": "light"}`
- **成功响应 (200)**: `{"code": 200, "message": "Settings updated", "data": {"theme": "light", "language": "zh-CN"}}`

---

## 2.3 创作资产 API (全局模板)

### 2.3.1 角色模板 (`/characters`)

#### `POST /api/v1/characters`
- **请求体**: `{"name": "角色A", "age": 20}`
- **成功响应 (201)**: `{"code": 201, "message": "Character created", "data": {"id": 1, "name": "角色A", "age": 20, ...}}`

#### `GET /api/v1/characters`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}], "pagination": {"total": 100, "page": 1, "page_size": 20}}`

#### `GET /api/v1/characters/{character_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/characters/{character_id}`
- **请求体**: `{"name": "角色A-改"}`
- **成功响应 (200)**: `{"code": 200, "message": "Character updated", "data": {"id": 1, "name": "角色A-改", ...}}`

#### `DELETE /api/v1/characters/{character_id}`
- **成功响应 (204)**: (无内容)

### 2.3.2 世界观 (`/worldview`)

#### `POST /api/v1/worldview/categories`
- **请求体**: `{"name": "功法体系"}`
- **成功响应 (201)**: `{"code": 201, "message": "Category created", "data": {"id": 1, "name": "功法体系"}}`

#### `GET /api/v1/worldview/categories`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, "name": "功法体系"}]}`

#### `POST /api/v1/worldview/items`
- **请求体**: `{"category_id": 1, "name": "七十二变", "description": "..."}`
- **成功响应 (201)**: `{"code": 201, "message": "Item created", "data": {"id": 1, "name": "七十二变", ...}}`

#### `GET /api/v1/worldview/items`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}], "pagination": {...}}`

#### `GET /api/v1/worldview/items/{item_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/worldview/items/{item_id}`
- **请求体**: `{"name": "三十六变"}`
- **成功响应 (200)**: `{"code": 200, "message": "Item updated", "data": {"id": 1, "name": "三十六变", ...}}`

#### `DELETE /api/v1/worldview/items/{item_id}`
- **成功响应 (204)**: (无内容)

---

## 2.3.3 通用列表查询参数
所有返回列表的 `GET` 请求都应支持以下查询参数，以实现分页、排序和过滤功能。

- **分页**:
  - `page` (int, default: 1): 请求的页码。
  - `page_size` (int, default: 20): 每页返回的条目数。
- **排序**:
  - `sort_by` (string, default: "created_at"): 用于排序的字段名。
  - `order` (string, default: "desc"): 排序顺序，可选值为 `asc` (升序) 或 `desc` (降序)。
- **过滤**:
  - 具体的过滤参数取决于各个API端点，例如 `GET /api/v1/characters?name=孙悟空&gender=男`。

**示例**: `GET /api/v1/works?page=2&page_size=10&sort_by=updated_at&order=asc`

---

## 2.4 写作 API (Writing)

### 2.4.1 作品 (`/works`)

#### `POST /api/v1/works`
- **请求体**: `{"title": "我的第一部作品", "category": "玄幻"}`
- **成功响应 (201)**: `{"code": 201, "message": "Work created", "data": {"id": 1, "title": "我的第一部作品", ...}}`

#### `GET /api/v1/works`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, "title": "...", ...}], "pagination": {...}}`
- **备注**: 为提高性能，此接口返回的 `Work` 对象中可能不包含 `outline` 等大型字段。

#### `GET /api/v1/works/{work_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/works/{work_id}`
- **请求体**: `{"title": "我的作品（修改版）"}`
- **成功响应 (200)**: `{"code": 200, "message": "Work updated", "data": {"id": 1, "title": "我的作品（修改版）", ...}}`

#### `DELETE /api/v1/works/{work_id}`
- **成功响应 (204)**: (无内容)

### 2.4.2 作品中的角色 (`/works/{work_id}/characters` & `/work-characters`)

#### `POST /api/v1/works/{work_id}/characters`
- **请求体**: `{"character_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Character added to work", "data": {"id": 1, "work_id": 1, "character_id": 1, ...}}`

#### `GET /api/v1/works/{work_id}/characters`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `GET /api/v1/work-characters/{work_character_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/work-characters/{work_character_id}`
- **请求体**: `{"alias": "新别名"}`
- **成功响应 (200)**: `{"code": 200, "message": "WorkCharacter updated", "data": {"id": 1, "alias": "新别名", ...}}`

#### `DELETE /api/v1/work-characters/{work_character_id}`
- **成功响应 (204)**: (无内容)

### 2.4.3 角色经历 (`/work-characters/{work_character_id}/experiences` & `/experiences`)

#### `POST /api/v1/work-characters/{work_character_id}/experiences`
- **请求体**: `{"content": "...", "experience_content": {"time": "...", "character_ids": [2, 3], "worldview_ids": [5, 8]}}`
- **成功响应 (201)**: `{"code": 201, "message": "Experience created", "data": {"id": 1, ...}}`

#### `GET /api/v1/work-characters/{work_character_id}/experiences`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `PUT /api/v1/experiences/{experience_id}`
- **请求体**: `{"content": "新内容"}`
- **成功响应 (200)**: `{"code": 200, "message": "Experience updated", "data": {"id": 1, "content": "新内容", ...}}`

#### `DELETE /api/v1/experiences/{experience_id}`
- **成功响应 (204)**: (无内容)

### 2.4.4 章节与草稿

#### `POST /api/v1/works/{work_id}/chapters`
- **备注**: 只能通过发布草稿创建，此接口可能不直接提供。

#### `GET /api/v1/works/{work_id}/chapters`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `GET /api/v1/chapters/{chapter_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/chapters/{chapter_id}`
- **请求体**: `{"title": "新标题", "content": "新内容"}`
- **成功响应 (200)**: `{"code": 200, "message": "Chapter updated", "data": {"id": 1, ...}}`

#### `DELETE /api/v1/chapters/{chapter_id}`
- **成功响应 (204)**: (无内容)

#### `POST /api/v1/drafts`
- **请求体**: `{"title": "新草稿", "content": "...", "work_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Draft created", "data": {"id": 1, ...}}`

#### `GET /api/v1/drafts`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `PUT /api/v1/drafts/{draft_id}`
- **请求体**: `{"title": "修改草稿"}`
- **成功响应 (200)**: `{"code": 200, "message": "Draft updated", "data": {"id": 1, ...}}`

#### `DELETE /api/v1/drafts/{draft_id}`
- **成功响应 (204)**: (无内容)

#### `POST /api/v1/drafts/{draft_id}/publish`
- **请求体**: `{"work_id": 1, "title": "第一章"}`
- **成功响应 (201)**: `{"code": 201, "message": "Draft published", "data": {"id": 1, "title": "第一章", ...}}` (返回的是新创建的Chapter)

---

## 2.5 关系与上下文 API

### 2.5.1 作品与世界观关联 (`/works/{work_id}/worldview-items`)

#### `POST /api/v1/works/{work_id}/worldview-items`
- **请求体**: `{"worldview_item_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Worldview item associated with work"}`

#### `DELETE /api/v1/works/{work_id}/worldview-items/{item_id}`
- **成功响应 (204)**: (无内容)

### 2.5.2 角色与世界观关联 (`/characters/{character_id}/worldview-items`)

#### `POST /api/v1/characters/{character_id}/worldview-items`
- **请求体**: `{"worldview_item_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Worldview item associated with character"}`

#### `DELETE /api/v1/characters/{character_id}/worldview-items/{item_id}`
- **成功响应 (204)**: (无内容)

### 2.5.3 通用实体关系 (`/relationships`)

#### `POST /api/v1/relationships`
- **请求体**: `{"source_entity_type": "Character", "source_entity_id": 1, "target_entity_type": "Character", "target_entity_id": 2, "relationship_type": "师徒"}`
- **成功响应 (201)**: `{"code": 201, "message": "Relationship created", "data": {"id": 1, ...}}`

#### `GET /api/v1/relationships`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `DELETE /api/v1/relationships/{relationship_id}`
- **成功响应 (204)**: (无内容)

---

## 2.6 AI 辅助 API (`/ai`)

*(保持原有接口不变)*
- `POST /api/v1/ai/completion`
- `POST /api/v1/ai/polish`
- `POST /api/v1/ai/generate/idea`
- `POST /api/v1/ai/generate/outline`
- `POST /api/v1/ai/create/character`
