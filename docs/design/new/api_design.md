# 新版API接口设计文档 (V6 - 最终完整版)

本文档基于最终确认的数据结构进行设计，对现有业务场景进行了全面覆盖，并为所有接口提供了详细的JSON请求/响应示例。

---

## 1. 通用响应格式

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

---

## 2. 认证与用户 API

### `POST /api/v1/auth/register`
- **请求体**: `{"username": "user", "email": "user@example.com", "password": "password"}`
- **成功响应 (201)**: `{"code": 201, "message": "User created", "data": {"id": 1, "username": "user", "email": "user@example.com"}}`

### `POST /api/v1/auth/login`
- **请求体**: `{"identifier": "user", "password": "password"}`
- **成功响应 (200)**: `{"code": 200, "message": "Login successful", "data": {"access_token": "...", "token_type": "Bearer"}}`

### `GET /api/v1/users/me`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, "username": "user", "email": "user@example.com"}}`

### `GET /api/v1/users/me/settings`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"theme": "dark", "language": "zh-CN"}}`

### `PUT /api/v1/users/me/settings`
- **请求体**: `{"theme": "light"}`
- **成功响应 (200)**: `{"code": 200, "message": "Settings updated", "data": {"theme": "light", "language": "zh-CN"}}`

---

## 3. 创作资产 API (全局模板)

### 3.1. 角色模板 (`/characters`)

#### `POST /api/v1/characters`
- **请求体**: `{"name": "角色A", "age": 20}`
- **成功响应 (201)**: `{"code": 201, "message": "Character created", "data": {"id": 1, "name": "角色A", "age": 20, ...}}`

#### `GET /api/v1/characters`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}], "pagination": {...}}`

#### `GET /api/v1/characters/{character_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/characters/{character_id}`
- **请求体**: `{"name": "角色A-改"}`
- **成功响应 (200)**: `{"code": 200, "message": "Character updated", "data": {"id": 1, "name": "角色A-改", ...}}`

#### `DELETE /api/v1/characters/{character_id}`
- **成功响应 (204)**: (无内容)

### 3.2. 世界观 (`/worldview`)

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

## 4. 写作 API (Writing)

### 4.1. 作品 (`/works`)
*(完整的CRUD接口)*

#### `POST /api/v1/works`
- **请求体**: `{"title": "我的第一部作品", "category": "玄幻"}`
- **成功响应 (201)**: `{"code": 201, "message": "Work created", "data": {"id": 1, "title": "我的第一部作品", ...}}`

#### `GET /api/v1/works`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}], "pagination": {...}}`

#### `GET /api/v1/works/{work_id}`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": {"id": 1, ...}}`

#### `PUT /api/v1/works/{work_id}`
- **请求体**: `{"title": "我的作品（修改版）"}`
- **成功响应 (200)**: `{"code": 200, "message": "Work updated", "data": {"id": 1, "title": "我的作品（修改版）", ...}}`

#### `DELETE /api/v1/works/{work_id}`
- **成功响应 (204)**: (无内容)

### 4.2. 作品中的角色 (`/works/{work_id}/characters` & `/work-characters`)

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

### 4.3. 角色经历 (`/work-characters/{work_character_id}/experiences` & `/experiences`)

#### `POST /api/v1/work-characters/{work_character_id}/experiences`
- **请求体**: `{"content": "...", "time": "...", "characters": ["..."], "worldviews": ["..."]}`
- **成功响应 (201)**: `{"code": 201, "message": "Experience created", "data": {"id": 1, ...}}`

#### `GET /api/v1/work-characters/{work_character_id}/experiences`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `PUT /api/v1/experiences/{experience_id}`
- **请求体**: `{"content": "新内容"}`
- **成功响应 (200)**: `{"code": 200, "message": "Experience updated", "data": {"id": 1, "content": "新内容", ...}}`

#### `DELETE /api/v1/experiences/{experience_id}`
- **成功响应 (204)**: (无内容)

### 4.4. 章节与草稿

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

## 5. 关系与上下文 API

### 5.1 作品与世界观关联 (`/works/{work_id}/worldview-items`)

#### `POST /api/v1/works/{work_id}/worldview-items`
- **请求体**: `{"worldview_item_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Worldview item associated with work"}`

#### `DELETE /api/v1/works/{work_id}/worldview-items/{item_id}`
- **成功响应 (204)**: (无内容)

### 5.2 角色与世界观关联 (`/characters/{character_id}/worldview-items`)

#### `POST /api/v1/characters/{character_id}/worldview-items`
- **请求体**: `{"worldview_item_id": 1}`
- **成功响应 (201)**: `{"code": 201, "message": "Worldview item associated with character"}`

#### `DELETE /api/v1/characters/{character_id}/worldview-items/{item_id}`
- **成功响应 (204)**: (无内容)

### 5.3 通用实体关系 (`/relationships`)

#### `POST /api/v1/relationships`
- **请求体**: `{"source_entity_type": "Character", "source_entity_id": 1, "target_entity_type": "Character", "target_entity_id": 2, "relationship_type": "师徒"}`
- **成功响应 (201)**: `{"code": 201, "message": "Relationship created", "data": {"id": 1, ...}}`

#### `GET /api/v1/relationships`
- **成功响应 (200)**: `{"code": 200, "message": "Success", "data": [{"id": 1, ...}]}`

#### `DELETE /api/v1/relationships/{relationship_id}`
- **成功响应 (204)**: (无内容)

---

## 6. AI 辅助 API (`/ai`)

*(保持原有接口不变)*
- `POST /api/v1/ai/completion`
- `POST /api/v1/ai/polish`
- `POST /api/v1/ai/generate/idea`
- `POST /api/v1/ai/generate/outline`
- `POST /api/v1/ai/create/character`