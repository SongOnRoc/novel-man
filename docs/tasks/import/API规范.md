# 文件上传和导入功能 API 规范

## 1. 概述

本文档定义了文件上传和导入功能的 RESTful API 规范，包括请求格式、响应格式、错误码和示例。

## 2. 通用规范

### 2.1 基础 URL
```
https://api.example.com/api/v1
```

### 2.2 认证
所有导入 API 都需要 JWT 认证：
```
Authorization: Bearer <token>
```

### 2.3 请求格式
- Content-Type: `multipart/form-data`
- 文件字段名: `file`

### 2.4 响应格式
所有响应遵循统一格式：
```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 2.5 错误码
| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 413 | 文件过大 |
| 415 | 不支持的文件类型 |
| 500 | 服务器内部错误 |

## 3. 提示词导入 API

### 3.1 导入提示词

**端点**: `POST /api/v1/prompts/import`

**描述**: 导入一个或多个提示词

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 提示词文件 (.txt, .md, .json, .zip) |

**支持的文件格式**:

1. **TXT/MD 文件** - 单个提示词
   - 文件名作为标题
   - 文件内容作为提示词内容

2. **JSON 文件** - 批量导入
```json
[
  {
    "title": "提示词标题",
    "content": "提示词内容",
    "description": "描述信息",
    "primaryTag": "主标签",
    "categories": ["分类1", "分类2"],
    "footerTags": ["标签1", "标签2"]
  }
]
```

3. **ZIP 文件** - 批量导入
   - 包含多个 .txt, .md 或 .json 文件
   - 最多 100 个文件
   - 解压后总大小不超过 50MB

**成功响应** (200 OK):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": 5,
    "failed": 1,
    "total": 6,
    "errors": [
      "文件 'invalid.txt' 格式错误: 内容为空"
    ]
  }
}
```

**错误响应**:

400 Bad Request - 文件格式不支持:
```json
{
  "code": 400,
  "message": "不支持的文件类型",
  "data": null
}
```

401 Unauthorized - 未授权:
```json
{
  "code": 401,
  "message": "未授权访问",
  "data": null
}
```

413 Payload Too Large - 文件过大:
```json
{
  "code": 413,
  "message": "文件大小超过限制 (最大 10MB)",
  "data": null
}
```

**示例**:

使用 cURL:
```bash
curl -X POST \
  https://api.example.com/api/v1/prompts/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@prompts.json'
```

使用 JavaScript (Axios):
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await axios.post('/prompts/import', formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

## 4. 作品导入 API

### 4.1 导入作品

**端点**: `POST /api/v1/works/import`

**描述**: 导入作品元数据

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 作品元数据文件 (.json) |

**支持的文件格式**:

**JSON 文件** - 作品元数据
```json
{
  "title": "作品标题",
  "description": "作品描述",
  "category": "玄幻",
  "status": "连载中",
  "outline": "作品大纲内容..."
}
```

**成功响应** (200 OK):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": 1,
    "failed": 0,
    "total": 1,
    "errors": []
  }
}
```

**错误响应**:

400 Bad Request - 数据验证失败:
```json
{
  "code": 400,
  "message": "数据验证失败",
  "data": {
    "errors": [
      "title 字段不能为空",
      "category 字段不能为空"
    ]
  }
}
```

**示例**:

使用 cURL:
```bash
curl -X POST \
  https://api.example.com/api/v1/works/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@work.json'
```

## 5. 章节导入 API

### 5.1 导入章节

**端点**: `POST /api/v1/works/:workId/chapters/import`

**描述**: 为指定作品导入章节

**请求头**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| workId | int64 | 是 | 作品 ID |

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 章节文件 (.txt, .md, .zip) |

**支持的文件格式**:

1. **TXT/MD 文件** - 单个章节
   - 第一行作为章节标题
   - 其余内容作为章节正文内容作为章节正文

   示例:
```
第一章 开始`
第一章 开始

这是章节的正文内容...
```

2. **ZIP 文件** - 批量导入章节
   - 包含多个 .txt 或 .md 文件
   - 文件名作为章节顺序参考
   - 最多 100 个文件

**成功响应** (200 OK):
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": 3,
    "failed": 0,
    "total": 3,
    "errors": []
  }
}
```

**错误响应**:

403 Forbidden - 无权限:
```json
{
  "code": 403,
  "message": "您没有权限为此作品导入章节",
  "data": null
}
```

404 Not Found - 作品不存在:
```json
{
  "code": 404,
  "message": "作品不存在",
  "data": null
}
```

**示例**:

使用 cURL:
```bash
curl -X POST \
  https://api.example.com/api/v1/works/123/chapters/import \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@chapters.zip'
```

使用 JavaScript (Axios):
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await axios.post(`/works/${workId}/chapters/import`, formData, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  }
});
```

## 6. 导入结果数据结构

### 6.1 ImportResult

导入操作的统一返回结果：

```typescript
interface ImportResult {
  success: number;    // 成功导入的数量
  failed: number;     // 失败的数量
  total: number;      // 总数量（success + failed）
  errors?: string[];  // 错误信息列表（可选）
}
```

**字段说明**:
- `success`: 成功导入的项目数量
- `failed`: 导入失败的项目数量
- `total`: 总共尝试导入的项目数量（success + failed）
- `errors`: 失败项目的详细错误信息数组

## 7. 文件大小限制

| 文件类型 | 最大大小 |
|----------|----------|
| 单个文件 (.txt, .md, .json) | 10 MB |
| ZIP 压缩包 | 50 MB |
| ZIP 解压后总大小 | 100 MB |
| ZIP 内文件数量 | 100 个 |

## 8. 速率限制

为防止滥用，API 实施以下速率限制：

| 限制类型 | 限制值 |
|----------|--------|
| 每用户每分钟请求数 | 10 次 |
| 每用户每小时请求数 | 100 次 |
| 每用户每天请求数 | 500 次 |

超过限制时返回：
```json
{
  "code": 429,
  "message": "请求过于频繁，请稍后再试",
  "data": {
    "retryAfter": 60
  }
}
```

## 9. 最佳实践

### 9.1 文件准备
1. 确保文件编码为 UTF-8
2. JSON 文件需符合规范格式
3. 文本文件避免特殊字符
4. ZIP 文件使用标准压缩格式

### 9.2 错误处理
1. 检查响应中的 `errors` 数组
2. 根据错误信息调整文件格式
3. 对于部分失败，可重试失败的项目

### 9.3 性能优化
1. 大量数据建议分批导入
2. 使用 ZIP 格式批量导入
3. 避免在高峰期导入大文件

## 10. 示例文件

### 10.1 提示词 JSON 示例

```json
[
  {
    "title": "小说开头生成",
    "content": "请根据以下设定生成小说开头...",
    "description": "用于生成小说开头的提示词",
    "primaryTag": "创作辅助",
    "categories": ["小说", "开头"],
    "footerTags": ["玄幻", "都市"]
  },
  {
    "title": "人物描写",
    "content": "请详细描写以下人物...",
    "description": "用于生成人物描写的提示词",
    "primaryTag": "人物塑造",
    "categories": ["描写", "人物"],
    "footerTags": ["外貌", "性格"]
  }
]
```

### 10.2 作品 JSON 示例

```json
{
  "title": "修仙传奇",
  "description": "一个关于修仙的故事",
  "category": "玄幻",
  "status": "连载中",
  "outline": "主角从凡人开始修炼，经历重重困难，最终成为仙界至尊..."
}
```

### 10.3 章节 TXT 示例

```
第一章 初入江湖

少年李明站在山巅，望着远方的云海，心中充满了对未来的憧憬。

今天，是他下山的日子。师父说，是时候让他去闯荡江湖了。

"师父，我一定不会让您失望的。"李明暗暗发誓。
```

## 11. 变更日志

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 2025-01-14 | 初始版本 |
| 2.0.0 | 2025-01-16 | 更新架构为反射+标签架构 |

## 12. 联系方式

如有有问题或建议，请联系：
- 技术支持: support@example.com
- API 文档: https://docs.example.com/api