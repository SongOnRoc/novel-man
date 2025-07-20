# 数据结构设计 - 网络小说作家作品管理系统

本文档详细定义了“网络小说作家作品管理系统”MVP版本所需的核心数据实体的结构、字段和关系。设计遵循 `technical-spec-backend.md` 中定义的技术规范。

## 1. 实体关系图 (ER Diagram)

使用 Mermaid.js 绘制的实体关系图如下，展示了核心实体之间的主从关系和多对多关系。

```mermaid
erDiagram
    users {
        bigint id PK "用户ID (自增主键)"
        varchar(255) username UK "用户名 (唯一)"
        varchar(255) email UK "邮箱 (唯一)"
        varchar(255) password_hash "密码哈希"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    user_settings {
        bigint id PK "设置ID (自增主键)"
        bigint user_id FK "用户ID"
        varchar(255) ai_model "AI模型偏好"
        text custom_api_endpoint "自定义API接口"
        varchar(100) editor_theme "编辑器主题"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    works {
        bigint id PK "作品ID (自增主键)"
        bigint user_id FK "作者的用户ID"
        varchar(255) title "作品标题"
        text description "作品简介"
        varchar(255) cover_image_url "封面图片URL"
        varchar(100) category "作品分类"
        varchar(50) status "状态 (连载中, 完结)"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    chapters {
        bigint id PK "章节ID (自增主键)"
        bigint work_id FK "所属作品ID"
        varchar(255) title "章节标题"
        text content "章节内容"
        int "order" "显示顺序"
        int word_count "字数"
        varchar(50) status "状态 (已发布, 草稿)"
        timestamp_tz published_at "发布时间"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    drafts {
        bigint id PK "草稿ID (自增主键)"
        bigint work_id FK "所属作品ID"
        varchar(255) title "草稿标题"
        text content "草稿内容"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    characters {
        bigint id PK "角色ID (自增主键)"
        bigint user_id FK "创建者用户ID"
        varchar(255) name "角色姓名"
        varchar(255) alias "别名"
        varchar(255) avatar_url "头像URL"
        text appearance_desc "外貌描述"
        text personality_desc "性格描述"
        text ability_desc "能力描述"
        text background_story "背景故事"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    worldview_settings {
        bigint id PK "设定ID (自增主键)"
        bigint user_id FK "创建者用户ID"
        varchar(255) name "设定名称"
        varchar(100) type "设定类型 (地点, 组织, 规则)"
        text description "详细描述"
        timestamp_tz created_at "创建时间"
        timestamp_tz updated_at "更新时间"
    }

    work_characters {
        bigint work_id FK "作品ID"
        bigint character_id FK "角色ID"
    }

    work_worldview_settings {
        bigint work_id FK "作品ID"
        bigint worldview_setting_id FK "世界观设定ID"
    }

    users ||--o{ works : "拥有"
    users ||--o{ characters : "创建"
    users ||--o{ worldview_settings : "创建"
    users ||--o| user_settings : "拥有"

    works ||--o{ chapters : "包含"
    works ||--o{ drafts : "包含"
    works }o--o{ characters : "关联 (通过 work_characters)"
    works }o--o{ worldview_settings : "关联 (通过 work_worldview_settings)"

    work_characters ||--|{ works : "关联"
    work_characters ||--|{ characters : "关联"
    work_worldview_settings ||--|{ works : "关联"
    work_worldview_settings ||--|{ worldview_settings : "关联"
```

## 2. 数据表结构

### 2.1. `users` - 用户表

存储用户信息。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 用户ID, 自增主键 (Primary Key) |
| `username` | `VARCHAR(255)` | `NOT NULL` | 用户名, 唯一 (Unique) |
| `email` | `VARCHAR(255)` | `NOT NULL` | 邮箱, 唯一 (Unique) |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | 哈希后的密码 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.2. `user_settings` - 用户偏好设置表

存储用户的个性化设置。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 设置ID, 自增主键 (Primary Key) |
| `user_id` | `BIGINT` | `NOT NULL` | 用户ID, 外键关联 `users(id)` (Foreign Key) |
| `ai_model` | `VARCHAR(255)` | `NULL` | AI模型偏好 |
| `custom_api_endpoint` | `TEXT` | `NULL` | 自定义AI API接口地址 |
| `editor_theme` | `VARCHAR(100)` | `NULL` | 编辑器主题 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.3. `works` - 作品表

存储作品的核心信息。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 作品ID, 自增主键 (Primary Key) |
| `user_id` | `BIGINT` | `NOT NULL` | 作者的用户ID, 外键关联 `users(id)` (Foreign Key) |
| `title` | `VARCHAR(255)` | `NOT NULL` | 作品标题 |
| `description` | `TEXT` | `NULL` | 作品简介 |
| `cover_image_url` | `VARCHAR(255)` | `NULL` | 封面图片URL |
| `category` | `VARCHAR(100)` | `NULL` | 作品类型/分类 |
| `status` | `VARCHAR(50)` | `NOT NULL` | 状态 (e.g., '连载中', '完结'), 建议加索引 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.4. `chapters` - 章节表

存储作品的章节内容。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 章节ID, 自增主键 (Primary Key) |
| `work_id` | `BIGINT` | `NOT NULL` | 所属作品ID, 外键关联 `works(id)` (Foreign Key) |
| `title` | `VARCHAR(255)` | `NOT NULL` | 章节标题 |
| `content` | `TEXT` | `NULL` | 章节内容 |
| `order` | `INT` | `NOT NULL` | 显示顺序, 用于排序 |
| `word_count` | `INT` | `NOT NULL` | 字数 |
| `status` | `VARCHAR(50)` | `NOT NULL` | 状态 (e.g., '已发布', '草稿') |
| `published_at` | `TIMESTAMP WITH TIME ZONE` | `NULL` | 发布时间 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.5. `drafts` - 草稿表

存储与作品关联的草稿。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 草稿ID, 自增主键 (Primary Key) |
| `work_id` | `BIGINT` | `NOT NULL` | 所属作品ID, 外键关联 `works(id)` (Foreign Key) |
| `title` | `VARCHAR(255)` | `NOT NULL` | 草稿标题 |
| `content` | `TEXT` | `NULL` | 草稿内容 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.6. `characters` - 角色表

存储用户创建的角色信息。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 角色ID, 自增主键 (Primary Key) |
| `user_id` | `BIGINT` | `NOT NULL` | 创建者用户ID, 外键关联 `users(id)` (Foreign Key) |
| `name` | `VARCHAR(255)` | `NOT NULL` | 角色姓名 |
| `alias` | `VARCHAR(255)` | `NULL` | 别名 |
| `avatar_url` | `VARCHAR(255)` | `NULL` | 头像URL |
| `appearance_desc` | `TEXT` | `NULL` | 外貌描述 |
| `personality_desc` | `TEXT` | `NULL` | 性格描述 |
| `ability_desc` | `TEXT` | `NULL` | 能力描述 |
| `background_story` | `TEXT` | `NULL` | 背景故事 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.7. `worldview_settings` - 世界观设定表

存储用户创建的世界观设定。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | 设定ID, 自增主键 (Primary Key) |
| `user_id` | `BIGINT` | `NOT NULL` | 创建者用户ID, 外键关联 `users(id)` (Foreign Key) |
| `name` | `VARCHAR(255)` | `NOT NULL` | 设定名称 |
| `type` | `VARCHAR(100)` | `NOT NULL` | 设定类型 (e.g., '地点', '组织', '规则') |
| `description` | `TEXT` | `NULL` | 详细描述 |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 创建时间 |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `NOT NULL` | 更新时间 |

### 2.8. `work_characters` - 作品与角色关联表

处理作品和角色之间的多对多关系。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `work_id` | `BIGINT` | `NOT NULL` | 作品ID, 外键关联 `works(id)` (Foreign Key) |
| `character_id` | `BIGINT` | `NOT NULL` | 角色ID, 外键关联 `characters(id)` (Foreign Key) |
| **复合主键** | `(work_id, character_id)` | | |

### 2.9. `work_worldview_settings` - 作品与世界观设定关联表

处理作品和世界观设定之间的多对多关系。

| 字段名 | 数据类型 | 是否可空 | 注释 |
| :--- | :--- | :--- | :--- |
| `work_id` | `BIGINT` | `NOT NULL` | 作品ID, 外键关联 `works(id)` (Foreign Key) |
| `worldview_setting_id` | `BIGINT` | `NOT NULL` | 世界观设定ID, 外键关联 `worldview_settings(id)` (Foreign Key) |
| **复合主键** | `(work_id, worldview_setting_id)` | | |