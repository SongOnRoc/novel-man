# 前后端数据对接需求文档

本文档旨在明确“网络小说作家作品管理系统”前后端数据对接的具体需求，作为开发和测试的依据。

## 1. 总体原则

*   所有API请求均需遵循 `requirements/api-spec.md` 中定义的规范。
*   前端所有对后端API的请求，都应封装在 `frontend/src/lib/api` 目录下的对应模块中。
*   前端状态管理应从 `mock` 数据切换为通过API获取的真实数据。
*   所有涉及用户身份认证的API请求，都必须在请求头中携带 `Authorization: Bearer <JWT>`。

## 2. 对接模块详情

### 2.1. 用户认证 (Authentication)

*   **前端页面**:
    *   `/login`: 登录页面
    *   `/register`: 注册页面
*   **后端API**:
    *   `POST /api/v1/auth/register`: 用户注册
    *   `POST /api/v1/auth/login`: 用户登录
    *   `POST /api/v1/auth/logout`: 用户登出
    *   `GET /api/v1/auth/me`: 获取当前用户信息
*   **对接流程**:
    1.  **注册**: 用户在 `/register` 页面填写信息，前端调用 `POST /api/v1/auth/register` API。成功后跳转到登录页。
    2.  **登录**: 用户在 `/login` 页面填写信息，前端调用 `POST /api/v1/auth/login` API。成功后，将返回的 `access_token` 存储在本地（如 `localStorage`），并用于后续所有需要认证的请求。
    3.  **会话保持**: 应用加载时，前端检查本地是否存在 `access_token`。如果存在，则调用 `GET /api/v1/auth/me` API验证token有效性并获取用户信息，以维持登录状态。
    4.  **登出**: 用户点击登出按钮，前端调用 `POST /api/v1/auth/logout` API，并清除本地存储的 `access_token`。

### 2.2. 作品管理 (Works)

*   **前端页面**:
    *   `/works`: 作品列表页
    *   `/works/new`: 新建作品页
    *   `/works/[id]/edit`: 编辑作品页
*   **后端API**:
    *   `GET /api/v1/works`: 获取作品列表
    *   `POST /api/v1/works`: 创建新作品
    *   `GET /api/v1/works/{work_id}`: 获取单个作品详情
    *   `PUT /api/v1/works/{work_id}`: 更新作品信息
    *   `DELETE /api/v1/works/{work_id}`: 删除作品
*   **对接流程**:
    1.  **列表展示**: `/works` 页面加载时，调用 `GET /api/v1/works` 获取作品列表并展示。
    2.  **创建作品**: 在 `/works/new` 页面提交表单时，调用 `POST /api/v1/works`。
    3.  **编辑作品**: 在 `/works/[id]/edit` 页面加载时，调用 `GET /api/v1/works/{work_id}` 获取作品详情并填充表单。提交表单时，调用 `PUT /api/v1/works/{work_id}`。
    4.  **删除作品**: 在作品卡片上点击删除按钮时，调用 `DELETE /api/v1/works/{work_id}`。

### 2.3. 章节管理 (Chapters)

*   **前端页面**:
    *   `/chapters`: 章节列表页
    *   `/chapters/new`: 新建章节页
    *   `/chapters/[id]/edit`: 编辑章节页
*   **后端API**:
    *   `GET /api/v1/works/{work_id}/chapters`: 获取作品的章节列表
    *   `POST /api/v1/works/{work_id}/chapters`: 创建新章节
    *   `GET /api/v1/works/{work_id}/chapters/{chapter_id}`: 获取单个章节详情
    *   `PUT /api/v1/works/{work_id}/chapters/{chapter_id}`: 更新章节信息
    *   `DELETE /api/v1/works/{work_id}/chapters/{chapter_id}`: 删除章节
*   **对接流程**:
    1.  **列表展示**: `/chapters` 页面加载时，需要一个作品选择器。选择作品后，调用 `GET /api/v1/works/{work_id}/chapters` 获取章节列表。
    2.  **创建章节**: 在 `/chapters/new` 页面提交表单时，调用 `POST /api/v1/works/{work_id}/chapters`。
    3.  **编辑章节**: 在 `/chapters/[id]/edit` 页面加载时，调用 `GET /api/v1/works/{work_id}/chapters/{chapter_id}` 获取章节内容。保存时调用 `PUT /api/v1/works/{work_id}/chapters/{chapter_id}`。

### 2.4. 草稿管理 (Drafts)

*   **前端页面**:
    *   `/drafts`: 草稿箱页面
*   **后端API**:
    *   `GET /api/v1/works/{work_id}/drafts`: 获取作品的草稿列表
    *   `POST /api/v1/works/{work_id}/drafts`: 创建新草稿
    *   `GET /api/v1/works/{work_id}/drafts/{draft_id}`: 获取单个草稿详情
    *   `PUT /api/v1/works/{work_id}/drafts/{draft_id}`: 更新草稿信息
    *   `DELETE /api/v1/works/{work_id}/drafts/{draft_id}`: 删除草稿
*   **对接流程**:
    1.  **列表展示**: `/drafts` 页面加载时，需要一个作品选择器。选择作品后，调用 `GET /api/v1/works/{work_id}/drafts` 获取草稿列表。
    2.  **编辑器集成**: 在编辑器页面，"保存到草稿"功能应调用 `POST /api/v1/works/{work_id}/drafts`。

### 2.5. AI 助手 (AI Assistant)

*   **前端组件**:
    *   `AIPromptForm`
*   **后端API**:
    *   `POST /api/v1/ai/completion`
    *   `POST /api/v1/ai/polish`
    *   `POST /api/v1/ai/generate/idea`
*   **对接流程**:
    1.  **后端实现**: 后端需要将AI助手的模拟接口替换为对真实AI服务（如OpenAI, Gemini等）的调用。
    2.  **前端调用**: `AIPromptForm` 组件根据用户操作，调用相应的AI API。
