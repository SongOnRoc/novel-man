# API 接口规范 - 网络小说作家作品管理系统

本文档定义了“网络小说作家作品管理系统”MVP版本的所有RESTful API接口。所有API都以 `/api/v1` 为前缀。

## 1. Authentication (认证)

管理用户注册、登录、会话和身份验证。

---

### 1.1. 用户注册

*   **端点名称**: `用户注册`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/auth/register`
*   **简要描述**: 创建一个新用户账户。
*   **请求体 (Request Body)**:
    ```json
    {
      "username": "string",
      "email": "user@example.com",
      "password": "string"
    }
    ```
    *   `username` (string, required): 用户名，必须唯一。
    *   `email` (string, required): 电子邮箱，必须唯一。
    *   `password` (string, required): 密码，最小长度8位。
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "username": "string",
          "email": "string",
          "created_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误或缺少必要字段。
    *   `409 Conflict`: 用户名或邮箱已被注册。
*   **权限要求**: 无需认证。

---

### 1.2. 用户登录

*   **端点名称**: `用户登录`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/auth/login`
*   **简要描述**: 用户使用邮箱和密码登录，成功后返回JWT。
*   **请求体 (Request Body)**:
    ```json
    {
      "email": "user@example.com",
      "password": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "access_token": "string (JWT)",
          "token_type": "Bearer"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 邮箱或密码错误。
*   **权限要求**: 无需认证。

---

### 1.3. 用户登出

*   **端点名称**: `用户登出`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/auth/logout`
*   **简要描述**: 使当前用户的JWT失效。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "message": "Successfully logged out"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 1.4. 获取当前用户信息

*   **端点名称**: `获取当前用户信息`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/auth/me`
*   **简要描述**: 获取当前已登录用户的信息。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "username": "string",
          "email": "string"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

## 2. Works (作品)

管理用户的作品信息，包括创建、读取、更新和删除 (CRUD) 操作。

---

### 2.1. 获取作品列表

*   **端点名称**: `获取作品列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works`
*   **简要描述**: 获取当前登录用户的所有作品，支持分页。
*   **请求参数**:
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
    *   `status` (string, optional): 按作品状态筛选 ('连载中', '完结')。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "data": [
            {
              "id": "integer",
              "title": "string",
              "description": "string",
              "cover_image_url": "string",
              "category": "string",
              "status": "string",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ],
          "pagination": {
            "total": "integer",
            "page": "integer",
            "limit": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 2.2. 创建新作品

*   **端点名称**: `创建新作品`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/works`
*   **简要描述**: 为当前用户创建一个新作品。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "description": "string",
      "cover_image_url": "string (optional)",
      "category": "string (optional)",
      "status": "string (default: '连载中')"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "title": "string",
          "description": "string",
          "cover_image_url": "string",
          "category": "string",
          "status": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误或缺少 `title` 字段。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 2.3. 获取单个作品详情

*   **端点名称**: `获取单个作品详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works/{work_id}`
*   **简要描述**: 获取指定ID的作品详细信息。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "title": "string",
          "description": "string",
          "cover_image_url": "string",
          "category": "string",
          "status": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 2.4. 更新作品信息

*   **端点名称**: `更新作品信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/works/{work_id}`
*   **简要描述**: 更新指定ID的作品信息。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "description": "string",
      "cover_image_url": "string (optional)",
      "category": "string (optional)",
      "status": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "title": "string",
          "description": "string",
          "cover_image_url": "string",
          "category": "string",
          "status": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 2.5. 删除作品

*   **端点名称**: `删除作品`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/works/{work_id}`
*   **简要描述**: 删除指定ID的作品及其所有关联数据（章节、草稿等）。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

## 3. Chapters (章节)

管理特定作品下的章节信息，包括CRUD操作。所有章节操作都嵌套在作品路径下。

---

### 3.1. 获取作品的章节列表

*   **端点名称**: `获取作品的章节列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works/{work_id}/chapters`
*   **简要描述**: 获取指定作品的所有章节，支持分页和排序。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
    *   `sort_by` (string, optional, default: 'order'): 排序字段 (e.g., 'order', 'published_at')。
    *   `sort_order` (string, optional, default: 'asc'): 排序顺序 ('asc', 'desc')。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "data": [
            {
              "id": "integer",
              "work_id": "integer",
              "title": "string",
              "order": "integer",
              "word_count": "integer",
              "status": "string",
              "published_at": "timestamp",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ],
          "pagination": {
            "total": "integer",
            "page": "integer",
            "limit": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.2. 创建新章节

*   **端点名称**: `创建新章节`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/works/{work_id}/chapters`
*   **简要描述**: 在指定作品下创建一个新章节。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "content": "string",
      "order": "integer",
      "status": "string (default: '草稿')"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "order": "integer",
          "word_count": "integer",
          "status": "string",
          "published_at": null,
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.3. 获取单个章节详情

*   **端点名称**: `获取单个章节详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works/{work_id}/chapters/{chapter_id}`
*   **简要描述**: 获取指定章节的详细信息，包括内容。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `chapter_id` (integer, required): 章节的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "order": "integer",
          "word_count": "integer",
          "status": "string",
          "published_at": "timestamp",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或章节不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.4. 更新章节信息

*   **端点名称**: `更新章节信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/works/{work_id}/chapters/{chapter_id}`
*   **简要描述**: 更新指定章节的信息。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `chapter_id` (integer, required): 章节的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "content": "string",
      "order": "integer",
      "status": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "order": "integer",
          "word_count": "integer",
          "status": "string",
          "published_at": "timestamp",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或章节不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.5. 删除章节

*   **端点名称**: `删除章节`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/works/{work_id}/chapters/{chapter_id}`
*   **简要描述**: 删除指定的章节。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `chapter_id` (integer, required): 章节的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或章节不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

## 4. Drafts (草稿)

管理特定作品下的草稿箱内容，包括CRUD操作。

---

### 4.1. 获取作品的草稿列表

*   **端点名称**: `获取作品的草稿列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works/{work_id}/drafts`
*   **简要描述**: 获取指定作品的所有草稿，支持分页。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "data": [
            {
              "id": "integer",
              "work_id": "integer",
              "title": "string",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ],
          "pagination": {
            "total": "integer",
            "page": "integer",
            "limit": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.2. 创建新草稿

*   **端点名称**: `创建新草稿`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/works/{work_id}/drafts`
*   **简要描述**: 在指定作品下创建一个新草稿。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "content": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.3. 获取单个草稿详情

*   **端点名称**: `获取单个草稿详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/works/{work_id}/drafts/{draft_id}`
*   **简要描述**: 获取指定草稿的详细信息。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `draft_id` (integer, required): 草稿的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或草稿不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.4. 更新草稿信息

*   **端点名称**: `更新草稿信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/works/{work_id}/drafts/{draft_id}`
*   **简要描述**: 更新指定草稿的信息。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `draft_id` (integer, required): 草稿的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string",
      "content": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "work_id": "integer",
          "title": "string",
          "content": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或草稿不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.5. 删除草稿

*   **端点名称**: `删除草稿`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/works/{work_id}/drafts/{draft_id}`
*   **简要描述**: 删除指定的草稿。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `draft_id` (integer, required): 草稿的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或草稿不存在，或不属于当前用户。
*   **权限要求**: 需要认证。

## 5. Characters (角色)

管理用户创建的角色信息，这些角色可以关联到多个作品。

---

### 5.1. 获取用户的所有角色

*   **端点名称**: `获取用户的所有角色`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/characters`
*   **简要描述**: 获取当前登录用户创建的所有角色，支持分页。
*   **请求参数**:
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "data": [
            {
              "id": "integer",
              "name": "string",
              "alias": "string",
              "avatar_url": "string",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ],
          "pagination": {
            "total": "integer",
            "page": "integer",
            "limit": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 5.2. 创建新角色

*   **端点名称**: `创建新角色`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/characters`
*   **简要描述**: 为当前用户创建一个新角色。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string",
      "alias": "string (optional)",
      "avatar_url": "string (optional)",
      "appearance_desc": "string (optional)",
      "personality_desc": "string (optional)",
      "ability_desc": "string (optional)",
      "background_story": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "alias": "string",
          "avatar_url": "string",
          "appearance_desc": "string",
          "personality_desc": "string",
          "ability_desc": "string",
          "background_story": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误或缺少 `name` 字段。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 5.3. 获取单个角色详情

*   **端点名称**: `获取单个角色详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/characters/{character_id}`
*   **简要描述**: 获取指定ID的角色的详细信息。
*   **请求参数**:
    *   `character_id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "alias": "string",
          "avatar_url": "string",
          "appearance_desc": "string",
          "personality_desc": "string",
          "ability_desc": "string",
          "background_story": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 5.4. 更新角色信息

*   **端点名称**: `更新角色信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/characters/{character_id}`
*   **简要描述**: 更新指定ID的角色的信息。
*   **请求参数**:
    *   `character_id` (integer, required): 角色的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string",
      "alias": "string (optional)",
      "avatar_url": "string (optional)",
      "appearance_desc": "string (optional)",
      "personality_desc": "string (optional)",
      "ability_desc": "string (optional)",
      "background_story": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "alias": "string",
          "avatar_url": "string",
          "appearance_desc": "string",
          "personality_desc": "string",
          "ability_desc": "string",
          "background_story": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 5.5. 删除角色

*   **端点名称**: `删除角色`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/characters/{character_id}`
*   **简要描述**: 删除指定ID的角色。
*   **请求参数**:
    *   `character_id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 5.6. 将角色关联到作品

*   **端点名称**: `将角色关联到作品`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/works/{work_id}/characters/{character_id}`
*   **简要描述**: 在作品和角色之间创建关联。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `character_id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或角色不存在，或不属于当前用户。
    *   `409 Conflict`: 关联已存在。
*   **权限要求**: 需要认证。

---

### 5.7. 解除角色与作品的关联

*   **端点名称**: `解除角色与作品的关联`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/works/{work_id}/characters/{character_id}`
*   **简要描述**: 解除作品和角色之间的关联。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `character_id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或角色不存在，或关联不存在。
*   **权限要求**: 需要认证。

## 6. Worldview Settings (世界观设定)

管理用户创建的世界观设定，这些设定可以关联到多个作品。

---

### 6.1. 获取用户的所有世界观设定

*   **端点名称**: `获取用户的所有世界观设定`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/worldview-settings`
*   **简要描述**: 获取当前登录用户创建的所有世界观设定，支持分页和按类型筛选。
*   **请求参数**:
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
    *   `type` (string, optional): 按设定类型筛选 (e.g., '地点', '组织', '规则')。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "data": [
            {
              "id": "integer",
              "name": "string",
              "type": "string",
              "created_at": "timestamp",
              "updated_at": "timestamp"
            }
          ],
          "pagination": {
            "total": "integer",
            "page": "integer",
            "limit": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 6.2. 创建新设定

*   **端点名称**: `创建新设定`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/worldview-settings`
*   **简要描述**: 为当前用户创建一个新的世界观设定。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string",
      "type": "string",
      "description": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "type": "string",
          "description": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误或缺少必要字段。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 6.3. 获取单个设定详情

*   **端点名称**: `获取单个设定详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/worldview-settings/{setting_id}`
*   **简要描述**: 获取指定ID的世界观设定的详细信息。
*   **请求参数**:
    *   `setting_id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "type": "string",
          "description": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.4. 更新设定信息

*   **端点名称**: `更新设定信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/worldview-settings/{setting_id}`
*   **简要描述**: 更新指定ID的世界观设定的信息。
*   **请求参数**:
    *   `setting_id` (integer, required): 设定的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string",
      "type": "string",
      "description": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "id": "integer",
          "name": "string",
          "type": "string",
          "description": "string",
          "created_at": "timestamp",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.5. 删除设定

*   **端点名称**: `删除设定`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/worldview-settings/{setting_id}`
*   **简要描述**: 删除指定ID的世界观设定。
*   **请求参数**:
    *   `setting_id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.6. 将设定关联到作品

*   **端点名称**: `将设定关联到作品`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/works/{work_id}/worldview-settings/{setting_id}`
*   **简要描述**: 在作品和世界观设定之间创建关联。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `setting_id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或设定不存在，或不属于当前用户。
    *   `409 Conflict`: 关联已存在。
*   **权限要求**: 需要认证。

---

### 6.7. 解除设定与作品的关联

*   **端点名称**: `解除设定与作品的关联`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/works/{work_id}/worldview-settings/{setting_id}`
*   **简要描述**: 解除作品和世界观设定之间的关联。
*   **请求参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `setting_id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品或设定不存在，或关联不存在。
*   **权限要求**: 需要认证。

## 7. User Settings (用户偏好设置)

管理当前登录用户的个性化设置。

---

### 7.1. 获取用户偏好设置

*   **端点名称**: `获取用户偏好设置`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/settings`
*   **简要描述**: 获取当前用户的偏好设置。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "ai_model": "string",
          "custom_api_endpoint": "string",
          "editor_theme": "string",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 未找到当前用户的设置 (通常在用户首次使用时，系统应自动创建默认设置)。
*   **权限要求**: 需要认证。

---

### 7.2. 更新用户偏好设置

*   **端点名称**: `更新用户偏好设置`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/settings`
*   **简要描述**: 更新或创建当前用户的偏好设置。
*   **请求体 (Request Body)**:
    ```json
    {
      "ai_model": "string (optional)",
      "custom_api_endpoint": "string (optional)",
      "editor_theme": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "ai_model": "string",
          "custom_api_endpoint": "string",
          "editor_theme": "string",
          "updated_at": "timestamp"
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

## 8. AI Assistant (AI助手)

提供AI驱动的写作辅助功能。

---

### 8.1. AI文本处理

*   **端点名称**: `AI文本处理`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/ai/process`
*   **简要描述**: 根据指定的任务类型（如续写、润色）处理输入文本。
*   **请求体 (Request Body)**:
    ```json
    {
      "task_type": "string",
      "text": "string",
      "context": {
        "work_id": "integer (optional)",
        "chapter_id": "integer (optional)",
        "character_ids": ["integer (optional)"],
        "worldview_setting_ids": ["integer (optional)"]
      },
      "style_preference": "string (optional)"
    }
    ```
    *   `task_type` (string, required): 任务类型。枚举值: `continue_writing` (续写), `polish` (润色), `generate_idea` (生成灵感), `generate_dialogue` (生成对话)。
    *   `text` (string, required): 需要处理的源文本。
    *   `context` (object, optional): 提供AI决策的上下文信息。
    *   `style_preference` (string, optional): 用户偏好的写作风格。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**:
        ```json
        {
          "task_type": "string",
          "original_text": "string",
          "generated_text": "string",
          "usage": {
            "prompt_tokens": "integer",
            "completion_tokens": "integer",
            "total_tokens": "integer"
          }
        }
        ```
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误或 `task_type` 无效。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `503 Service Unavailable`: AI服务暂时不可用。
*   **权限要求**: 需要认证。
