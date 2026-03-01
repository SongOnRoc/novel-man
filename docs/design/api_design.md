# 当前API接口文档

本文档旨在精确、完整地记录项目当前API接口的设计，基于 `backend/internal/apps/` 目录下的代码实现。

## 标准响应格式

所有API的响应都将遵循以下标准JSON格式。这确保了客户端可以有一致的方式来处理API的返回结果。

```json
{
  "code": 0,
  "data": {},
  "message": "OK",
  "sourceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "traceId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

- **`code`** (`int`): 业务状态码。`0` 代表成功，非 `0` 代表各种业务错误。
- **`data`** (`object`, 可选): 成功时返回的主要数据负载。如果请求失败或没有数据返回，此字段可能不存在。
- **`message`** (`string`): 对响应的描述。成功时通常为 `"OK"`，失败时为详细的错误信息。
- **`sourceId`** (`string`): 由服务端为每次响应生成的唯一ID，用于追踪和日志记录。
- **`traceId`** (`string`): 由客户端在请求时通过 `X-Trace-ID` 请求头传入的唯一ID，用于端到端追踪。如果客户端未提供，此字段可能为空。

---
## 模块: Auth (认证)

### `POST /api/v1/auth/register`
- **描述**: 注册新用户。
- **请求体**: `{"username": "string", "email": "string", "password": "string"}`
- **成功响应 (201)**: `{"id": uint, "username": "string", "email": "string", "created_at": "time.Time"}`
- **失败响应 (400)**: `{"error": "Invalid request body"}`
- **失败响应 (409)**: `{"error": "Username or email already exists"}`
- **失败响应 (500)**: `{"error": "Failed to create user"}`

### `POST /api/v1/auth/login`
- **描述**: 用户登录。
- **请求体**: `{"identifier": "string", "password": "string"}`
- **成功响应 (200)**: `{"access_token": "string", "token_type": "Bearer"}`
- **失败响应 (401)**: `{"error": "Invalid identifier or password"}`
- **失败响应 (500)**: `{"error": "Failed to generate token"}`

### `GET /api/v1/auth/me`
- **描述**: 获取当前用户信息。
- **成功响应 (200)**: `{"id": uint, "username": "string", "email": "string"}`
- **失败响应 (401)**: `{"error": "Unauthorized: ..."}`
- **失败响应 (404)**: `{"error": "User not found"}`

### `POST /api/v1/auth/logout`
- **描述**: 用户登出。
- **成功响应 (200)**: `{"message": "Successfully logged out"}`

## 模块: Works (作品)

### `GET /api/v1/works`
- **描述**: 获取当前用户的作品列表。
- **查询参数**: `page` (int), `limit` (int), `status` (string)
- **成功响应 (200)**: `{"data": [Work], "pagination": {"total": int64, "page": int, "limit": int}}`
- **失败响应 (500)**: `{"error": "Failed to retrieve works"}`

### `POST /api/v1/works`
- **描述**: 创建新作品。
- **请求体**: `{"title": "string", "description": "string", "category": "string", "status": "string", "cover_image_url": "string", "outline": "string"}`
- **成功响应 (201)**: `{"data": Work}`
- **失败响应 (400)**: `{"error": "Invalid request body: ..."}`
- **失败响应 (500)**: `{"error": "Failed to create work"}`

### `GET /api/v1/works/{id}`
- **描述**: 获取单个作品详情。
- **成功响应 (200)**: `{"data": Work}`
- **失败响应 (404)**: `{"error": "Work not found"}`

### `PUT /api/v1/works/{id}`
- **描述**: 更新作品。
- **请求体**: `{"title": "string", "description": "string", "category": "string", "status": "string", "outline": "string"}`
- **成功响应 (200)**: `{"data": Work}`
- **失败响应 (404)**: `{"error": "Work not found"}`

### `DELETE /api/v1/works/{id}`
- **描述**: 删除作品。
- **成功响应 (200)**: `{"message": "Resource deleted successfully"}`
- **失败响应 (404)**: `{"error": "Work not found"}`
## 模块: Chapters (章节)

### `GET /api/v1/chapters`
- **描述**: 获取指定作品的章节列表。
- **查询参数**: `work_id` (int64, 必填), `page` (int), `limit` (int)
- **成功响应 (200)**: `{"data": [Chapter], "pagination": {"total": int64, "page": int, "limit": int}}`
- **失败响应 (400)**: `{"error": "work_id is required"}`

### `POST /api/v1/chapters`
- **描述**: 创建新章节。
- **请求体**: `{"work_id": int64, "title": "string", "content": "string", ...}`
- **成功响应 (201)**: `{"data": Chapter}`
- **失败响应 (500)**: `{"error": "Failed to create chapter"}`

### `GET /api/v1/chapters/{id}`
- **描述**: 获取单个章节详情。
- **成功响应 (200)**: `{"data": Chapter}`
- **失败响应 (404)**: `{"error": "Chapter not found"}`

### `PUT /api/v1/chapters/{id}`
- **描述**: 更新章节。
- **请求体**: `{"title": "string", ...}`
- **成功响应 (200)**: `{"data": Chapter}`
- **失败响应 (404)**: `{"error": "Chapter not found"}`

### `DELETE /api/v1/chapters/{id}`
- **描述**: 删除章节。
- **成功响应 (200)**: `{"message": "Resource deleted successfully"}`
- **失败响应 (404)**: `{"error": "Chapter not found"}`

## 模块: Drafts (草稿)

### `POST /api/v1/drafts/:id/publish`
- **描述**: 发布草稿为章节。
- **成功响应 (200)**: `Chapter`
- **失败响应 (500)**: `{"error": "Failed to publish draft"}`
## 模块: Characters (角色)

### `GET /api/v1/characters`
- **描述**: 获取当前用户的所有角色。
- **成功响应 (200)**: `[Character]`

### `POST /api/v1/characters`
- **描述**: 创建一个新角色。
- **请求体**: `Character` (除ID和UserID外所有字段)
- **成功响应 (201)**: `Character`

### `GET /api/v1/characters/{id}`
- **描述**: 获取指定ID的角色。
- **成功响应 (200)**: `Character`
- **失败响应 (404)**: `{"error": "Character not found"}`

### `PUT /api/v1/characters/{id}`
- **描述**: 更新指定ID的角色。
- **请求体**: `Character` (部分字段)
- **成功响应 (200)**: `Character`

### `DELETE /api/v1/characters/{id}`
- **描述**: 删除指定ID的角色。
- **成功响应 (200)**: `{"message": "Character deleted successfully"}`

## 模块: Worldview (世界观)

### `GET /api/v1/worldview/categories`
- **描述**: 获取当前用户的所有世界观分类。
- **成功响应 (200)**: `[WorldviewCategory]`

### `POST /api/v1/worldview/categories`
- **描述**: 创建一个新的世界观分类。
- **请求体**: `{"name": "string"}`
- **成功响应 (201)**: `WorldviewCategory`

### `GET /api/v1/worldview/items`
- **描述**: 根据分类ID获取世界观条目。
- **查询参数**: `category_id` (uint, 必填)
- **成功响应 (200)**: `[WorldviewItem]`

### `POST /api/v1/worldview/items`
- **描述**: 创建一个新的世界观条目。
- **请求体**: `{"category_id": uint, "name": "string", "description": "string", ...}`
- **成功响应 (201)**: `WorldviewItem`

## 模块: Relationships (关系)

### `POST /api/v1/relationships`
- **描述**: 创建一个新的实体关系。
- **请求体**: `EntityRelationship`
- **成功响应 (201)**: `EntityRelationship`

### `GET /api/v1/relationships`
- **描述**: 获取实体关系列表。
- **查询参数**: `sourceEntityId` (uint), `sourceEntityType` (string)
- **成功响应 (200)**: `[EntityRelationship]`

## 模块: Settings (设置)

### `GET /api/v1/settings`
- **描述**: 获取设置列表 (支持分页)。
- **成功响应 (200)**: `{"data": [UserSetting], "pagination": ...}`

### `POST /api/v1/settings`
- **描述**: 创建新设置。
- **请求体**: `{"ai_model": "string", ...}`
- **成功响应 (201)**: `{"data": UserSetting}`

### `GET /api/v1/settings/{id}`
- **描述**: 获取指定 ID 的设置。
- **成功响应 (200)**: `{"data": UserSetting}`

### `PUT /api/v1/settings/{id}`
- **描述**: 更新指定 ID 的设置。
- **请求体**: `{"ai_model": "string", ...}`
- **成功响应 (200)**: `{"data": UserSetting}`

### `DELETE /api/v1/settings/{id}`
- **描述**: 删除指定 ID 的设置。
- **成功响应 (200)**: `{"message": "Resource deleted successfully"}`

### `GET /api/v1/settings/user/{user_id}`
- **描述**: 获取指定用户的设置。
- **成功响应 (200)**: `{"data": UserSetting}`

### `PUT /api/v1/settings/user/{user_id}`
- **描述**: 更新指定用户的设置。
- **请求体**: `{"ai_model": "string", ...}`
- **成功响应 (200)**: `{"data": UserSetting}`

### `PUT /api/v1/settings/{user_id}/ai-model`
- **描述**: 更新指定用户的AI模型设置。
- **请求体**: `{"ai_model": "string"}`
- **成功响应 (200)**: `{"data": UserSetting}`

## 模块: AI (人工智能)

### `POST /api/v1/ai/completion`
- **描述**: 请求文本补全。
- **请求体**: `models.CompletionRequest`
- **成功响应 (200)**: `{"data": models.CompletionResponse}`

### `POST /api/v1/ai/polish`
- **描述**: 请求文本润色。
- **请求体**: `models.PolishRequest`
- **成功响应 (200)**: `{"data": models.PolishResponse}`

### `POST /api/v1/ai/generate-idea`
- **描述**: 生成想法。
- **请求体**: `models.GenerateIdeaRequest`
- **成功响应 (200)**: `{"data": models.GenerateIdeaResponse}`

### `POST /api/v1/ai/generate-outline`
- **描述**: 生成大纲。
- **请求体**: `models.GenerateOutlineRequest`
- **成功响应 (200)**: `{"data": models.GenerateOutlineResponse}`

### `POST /api/v1/ai/create-character`
- **描述**: 创建角色。
- **请求体**: `models.CreateCharacterRequest`
- **成功响应 (200)**: `{"data": models.CreateCharacterResponse}`