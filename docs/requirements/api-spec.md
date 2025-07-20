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

管理作品下的章节信息。采用以资源为中心的扁平化路由设计，通过查询参数或请求体中的 `work_id` 来关联作品。

---

### 3.1. 获取章节列表

*   **端点名称**: `获取章节列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/chapters`
*   **简要描述**: 获取指定作品的章节列表，支持分页和排序。
*   **查询参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
    *   `sort_by` (string, optional, default: "order"): 排序字段。
    *   `sort_order` (string, optional, default: "asc"): 排序顺序 (`asc` 或 `desc`)。
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
              "status": "string",
              "word_count": "integer",
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
    *   `400 Bad Request`: `work_id` 未提供。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: `work_id` 对应的作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.2. 创建新章节

*   **端点名称**: `创建新章节`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/chapters`
*   **简要描述**: 在指定作品下创建一个新章节。
*   **请求体**:
    ```json
    {
      "work_id": "integer (required)",
      "title": "string (required)",
      "content": "string (optional)",
      "order": "integer (optional)",
      "status": "string (optional, default: 'draft')"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**: 返回新创建的章节对象。
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体验证失败。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: `work_id` 对应的作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 3.3. 获取章节详情

*   **端点名称**: `获取章节详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/chapters/{id}`
*   **简要描述**: 获取单个章节的详细信息。
*   **请求参数**:
    *   `id` (integer, required): 章节的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**: 返回完整的章节对象。
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 章节不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

---

### 3.4. 更新章节

*   **端点名称**: `更新章节`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/chapters/{id}`
*   **简要描述**: 更新指定ID的章节信息。
*   **请求参数**:
    *   `id` (integer, required): 章节的唯一ID。
*   **请求体**:
    ```json
    {
      "title": "string (optional)",
      "content": "string (optional)",
      "order": "integer (optional)",
      "status": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**: 返回更新后的章节对象。
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体验证失败。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 章节不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

---

### 3.5. 删除章节

*   **端点名称**: `删除章节`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/chapters/{id}`
*   **简要描述**: 删除指定ID的章节。
*   **请求参数**:
    *   `id` (integer, required): 章节的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 章节不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

## 4. Drafts (草稿)

管理作品下的草稿箱内容。采用与章节一致的扁平化路由设计。

---

### 4.1. 获取草稿列表

*   **端点名称**: `获取草稿列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/drafts`
*   **简要描述**: 获取指定作品的所有草稿，支持分页。
*   **查询参数**:
    *   `work_id` (integer, required): 作品的唯一ID。
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: `work_id` 未提供。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.2. 创建新草稿

*   **端点名称**: `创建新草稿`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/drafts`
*   **简要描述**: 在指定作品下创建一个新草稿。
*   **请求体 (Request Body)**:
    ```json
    {
      "work_id": "integer (required)",
      "title": "string (required)",
      "content": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**: 返回新创建的草稿对象。
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体验证失败。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 作品不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 4.3. 获取单个草稿详情

*   **端点名称**: `获取单个草稿详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/drafts/{id}`
*   **简要描述**: 获取指定草稿的详细信息。
*   **请求参数**:
    *   `id` (integer, required): 草稿的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**: 返回完整的草稿对象。
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 草稿不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

---

### 4.4. 更新草稿

*   **端点名称**: `更新草稿`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/drafts/{id}`
*   **简要描述**: 更新指定ID的草稿信息。
*   **请求参数**:
    *   `id` (integer, required): 草稿的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "title": "string (optional)",
      "content": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
    *   **响应体**: 返回更新后的草稿对象。
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体验证失败。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 草稿不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

---

### 4.5. 删除草稿

*   **端点名称**: `删除草稿`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/drafts/{id}`
*   **简要描述**: 删除指定的草稿。
*   **请求参数**:
    *   `id` (integer, required): 草稿的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 草稿不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

---

### 4.6. 发布草稿为新章节

*   **端点名称**: `发布草稿为新章节`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/drafts/{id}/publish`
*   **简要描述**: 将指定草稿的内容发布为一个新的章节，并删除该草稿。
*   **请求参数**:
    *   `id` (integer, required): 草稿的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
    *   **响应体**: 返回新创建的章节对象。
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 草稿不存在或不属于当前用户的作品。
*   **权限要求**: 需要认证。

## 5. Characters (角色)

管理用户的角色信息。这是一个顶级资源，不与任何作品直接关联。

---

### 5.1. 获取角色列表

*   **端点名称**: `获取角色列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/characters`
*   **简要描述**: 获取当前用户的所有角色，支持分页。
*   **请求参数**:
    *   `page` (integer, optional, default: 1): 页码。
    *   `limit` (integer, optional, default: 10): 每页数量。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
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
      "name": "string (required)",
      "description": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 5.3. 获取单个角色详情

*   **端点名称**: `获取单个角色详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/characters/{id}`
*   **简要描述**: 获取指定ID的角色详细信息。
*   **请求参数**:
    *   `id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 5.4. 更新角色信息

*   **端点名称**: `更新角色信息`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/characters/{id}`
*   **简要描述**: 更新指定ID的角色信息。
*   **请求参数**:
    *   `id` (integer, required): 角色的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string (optional)",
      "description": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 5.5. 删除角色

*   **端点名称**: `删除角色`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/characters/{id}`
*   **简要描述**: 删除指定的角色。
*   **请求参数**:
    *   `id` (integer, required): 角色的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 角色不存在或不属于当前用户。
*   **权限要求**: 需要认证。

## 6. Worldview (世界观)

管理用户的世界观设定。这是一个顶级资源，不与任何作品直接关联。它包含分类和设定条目两个子资源。

---

### 6.1. 获取世界观分类列表

*   **端点名称**: `获取世界观分类列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/worldview/categories`
*   **简要描述**: 获取当前用户的所有世界观分类。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 6.2. 创建新分类

*   **端点名称**: `创建新分类`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/worldview/categories`
*   **简要描述**: 为当前用户创建一个新的世界观分类。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string (required)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 6.3. 更新分类

*   **端点名称**: `更新分类`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/worldview/categories/{id}`
*   **简要描述**: 更新指定ID的分类信息。
*   **请求参数**:
    *   `id` (integer, required): 分类的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "name": "string (required)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 分类不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.4. 删除分类

*   **端点名称**: `删除分类`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/worldview/categories/{id}`
*   **简要描述**: 删除指定的分类及其下所有设定。
*   **请求参数**:
    *   `id` (integer, required): 分类的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 分类不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.5. 获取设定列表

*   **端点名称**: `获取设定列表`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/worldview/settings`
*   **简要描述**: 获取世界观设定，可按分类筛选。
*   **查询参数**:
    *   `category_id` (integer, optional): 按分类ID筛选。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 6.6. 创建新设定

*   **端点名称**: `创建新设定`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/worldview/settings`
*   **简要描述**: 创建一个新的世界观设定。
*   **请求体 (Request Body)**:
    ```json
    {
      "category_id": "integer (required)",
      "title": "string (required)",
      "content": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `201 Created`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 分类不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.7. 获取单个设定详情

*   **端点名称**: `获取单个设定详情`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/worldview/settings/{id}`
*   **简要描述**: 获取指定ID的设定详细信息。
*   **请求参数**:
    *   `id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.8. 更新设定

*   **端点名称**: `更新设定`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/worldview/settings/{id}`
*   **简要描述**: 更新指定ID的设定信息。
*   **请求参数**:
    *   `id` (integer, required): 设定的唯一ID。
*   **请求体 (Request Body)**:
    ```json
    {
      "category_id": "integer (optional)",
      "title": "string (optional)",
      "content": "string (optional)"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

---

### 6.9. 删除设定

*   **端点名称**: `删除设定`
*   **HTTP 方法**: `DELETE`
*   **URL 路径**: `/api/v1/worldview/settings/{id}`
*   **简要描述**: 删除指定的设定。
*   **请求参数**:
    *   `id` (integer, required): 设定的唯一ID。
*   **成功响应 (Success Response)**:
    *   **状态码**: `204 No Content`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
    *   `404 Not Found`: 设定不存在或不属于当前用户。
*   **权限要求**: 需要认证。

## 7. Settings (用户设置)

管理用户的个人偏好设置。

---

### 7.1. 获取用户设置

*   **端点名称**: `获取用户设置`
*   **HTTP 方法**: `GET`
*   **URL 路径**: `/api/v1/settings`
*   **简要描述**: 获取当前用户的个人设置，如果不存在则返回默认值。
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 7.2. 更新用户设置

*   **端点名称**: `更新用户设置`
*   **HTTP 方法**: `PUT`
*   **URL 路径**: `/api/v1/settings`
*   **简要描述**: 更新或创建 (upsert) 当前用户的个人设置。
*   **请求体 (Request Body)**:
    ```json
    {
      "theme": "string",
      "font_size": "integer"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

## 8. AI Assistant (AI助手)

提供AI辅助写作功能。

---

### 8.1. 文本补全

*   **端点名称**: `文本补全`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/ai/completions`
*   **简要描述**: 根据给定的上下文进行文本补全。
*   **请求体 (Request Body)**:
    ```json
    {
      "prompt": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 8.2. 文本润色

*   **端点名称**: `文本润色`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/ai/polish`
*   **简要描述**: 对给定的文本进行润色和改进。
*   **请求体 (Request Body)**:
    ```json
    {
      "text": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。

---

### 8.3. 创意生成

*   **端点名称**: `创意生成`
*   **HTTP 方法**: `POST`
*   **URL 路径**: `/api/v1/ai/generate-ideas`
*   **简要描述**: 根据给定的主题生成创意点子。
*   **请求体 (Request Body)**:
    ```json
    {
      "topic": "string"
    }
    ```
*   **成功响应 (Success Response)**:
    *   **状态码**: `200 OK`
*   **错误响应 (Error Response)**:
    *   `400 Bad Request`: 请求体格式错误。
    *   `401 Unauthorized`: 未提供有效的JWT。
*   **权限要求**: 需要认证。
