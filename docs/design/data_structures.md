# 当前数据结构文档

本文档旨在精确、完整地记录项目当前的数据结构设计，基于 `backend/internal/models/models.go` 的代码实现。

## 核心实体

### `User`：
系统的基本用户单位，拥有用户名、邮箱、密码、头像等属性。

| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 用户唯一标识符 (主键) |
| `Username` | `string` | `username` | 用户名 (唯一, 非空) |
| `Email` | `string` | `email` | 邮箱 (唯一, 非空) |
| `PasswordHash` | `string` | `-` | 密码哈希值 (不输出) |
| `Avatar` | `string` | `avatar` | 头像URL |
| `CreatedAt` | `time.Time` | `created_at` | 创建时间 (来自 BaseInfo) |
| `UpdatedAt` | `time.Time` | `updated_at` | 更新时间 (来自 BaseInfo) |

### `Work` ：
小说作品的基本单位，作品属于用户，作品内含总纲，分卷，章节，草稿，角色，世界观等属性。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `int64` | `id` | 作品唯一标识符 (主键) |
| `UserID` | `uint` | `user_id` | 所属用户ID |
| `Title` | `string` | `title` | 作品标题 (来自 WorkBase) |
| `Description` | `string` | `description` | 作品简介 (来自 WorkBase) |
| `Category` | `string` | `category` | 作品分类 (来自 WorkBase) |
| `Status` | `string` | `status` | 作品状态 (来自 WorkBase) |
| `CoverImageURL` | `string` | `cover_image_url` | 封面图片URL |
| `Outline` | `string` | `outline` | 作品大纲 |
| `Volumes` | `[]Volume` | `volumes,omitempty` | 关联的分卷对象切片 |
| `Chapters` | `[]Chapter` | `chapters,omitempty` | 关联的章节对象切片 (gorm:"foreignKey:WorkID") |
| `Drafts` | `[]Draft` | `drafts,omitempty` | 关联的草稿对象切片 (gorm:"foreignKey:WorkID") |
| `Characters` | `[]Character` | `characters,omitempty` | 关联的角色对象切片 (gorm:"many2many:work_characters;") |
| `WorldviewItems` | `[]WorldviewItem` | `worldview_items,omitempty` | 关联的世界观条目对象切片 (gorm:"many2many:work_worldview;") |
| `CreatedAt` | `time.Time` | `created_at` | 创建时间 (来自 BaseInfo) |
| `UpdatedAt` | `time.Time` | `updated_at` | 更新时间 (来自 BaseInfo) |

### `Volume` ： 
分卷是作品下的子属性，必须属于某个作品，否则没有任何意义。分卷之下有大纲属性和章节属性，草稿属性。
可以通过分卷对章节进行管理，是章节的可选属性，可以通过分卷对章节进行筛选。

| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 分卷唯一标识符 (主键) |
| `WorkID` | `int64` | `work_id` | 所属作品ID (来自 VolumeBase) |
| `Title` | `string` | `title` | 分卷标题 (来自 VolumeBase) |
| `Outline` | `string` | `outline` | 分卷大纲 |
| `DisplayOrder` | `int` | `display_order` | 显示顺序 |
| `Chapters` | `[]Chapter` | `chapters,omitempty` | 关联的章节对象切片 (gorm:"foreignKey:VolumeID") |
| `Drafts` | `[]Draft` | `drafts,omitempty` | 关联的草稿对象切片 (gorm:"foreignKey:VolumeID") |

### `Chapter`
作品的最小基本单位元素，可以没有分卷属性，但是必须属于某个作品，否则没有任何意义。章节无法直接创建，只能由草稿创建，但是章节可以进行编辑更新。章节表是一个自增表，且一旦在作品内创建章节，只能通过删除作品或者分卷的方式删除，不能直接删除章节，只能更新。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 章节唯一标识符 (主键) |
| `WorkID` | `int64` | `work_id` | 所属作品ID |
| `VolumeID` | `uint` | `volume_id,omitempty` | 所属分卷ID (来自 ContentBase) |
| `Title` | `string` | `title` | 章节标题 (来自 ContentBase) |
| `Content` | `string` | `content` | 正文内容 (来自 ContentBase) |
| `DisplayOrder` | `uint` | `display_order` | 显示顺序 (来自 ContentBase) |
| `Status` | `string` | `status` | 状态 (来自 ContentBase) |
| `WordCount` | `uint` | `word_count` | 字数统计 (来自 ContentBase) |
| `PublishedAt` | `string` | `published_at,omitempty` | 发布时间 (来自 ContentBase) |
| `Outline` | `string` | `outline` | 章节大纲 |

### `Draft`
草稿和章节是小说最关键的主题功能。
草稿是独立的元素，可以绑定某个作品，也可以与作品完全无关。草稿可以发布成章节，发布的行为会创建一个新的章节，在执行此行为时，必须绑定作品才能发布成功。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 草稿唯一标识符 (主键) |
| `WorkID` | `int64` | `work_id` | 所属作品ID |
| `VolumeID` | `uint` | `volume_id,omitempty` | 所属分卷ID (来自 ContentBase) |
| `Title` | `string` | `title` | 草稿标题 (来自 ContentBase) |
| `Content` | `string` | `content` | 正文内容 (来自 ContentBase) |
| `DisplayOrder` | `uint` | `display_order` | 显示顺序 (来自 ContentBase) |
| `Status` | `string` | `status` | 状态 (来自 ContentBase) |
| `WordCount` | `uint` | `word_count` | 字数统计 (来自 ContentBase) |
| `PublishedAt` | `string` | `published_at,omitempty` | 发布时间 (来自 ContentBase) |
| `Description` | `string` | `description` | 草稿描述/备注 |

### `Character`
角色是当前系统的核心重要功能，能否做好角色管理直接决定了当前系统的成功与否。
角色必须与作品绑定，但是一个角色可以出现在多个作品中。这里是角色的一个原特性。WorkCharacter作为角色的一个扩充结构，主要是从作品维度来描述角色的经历和成长，以及关系变化。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 角色唯一标识符 (主键) |
| `UserID` | `uint` | `user_id` | 所属用户ID |
| `Name` | `string` | `name` | 角色名 |
| `Alias` | `*string` | `alias,omitempty` | 角色别名 |
| `AvatarURL` | `*string` | `avatar_url,omitempty` | 角色头像URL |
| `Gender` | `*string` | `gender,omitempty` | 性别 |
| `Age` | `*int` | `age,omitempty` | 年龄 |
| `Occupation` | `*string` | `occupation,omitempty` | 职业 |
| `Personality` | `*string` | `personality,omitempty` | 性格 |
| `Abilities` | `*string` | `abilities,omitempty` | 能力 |
| `Background` | `*string` | `background,omitempty` | 背景 |
| `Appearance` | `*string` | `appearance,omitempty` | 外貌 |
| `Notes` | `*string` | `notes,omitempty` | 备注 |
| `AppearanceDesc` | `*string` | `appearance_desc,omitempty` | 外貌描述 |
| `PersonalityDesc` | `*string` | `personality_desc,omitempty` | 性格描述 |
| `AbilityDesc` | `*string` | `ability_desc,omitempty` | 能力描述 |
| `BackgroundStory` | `*string` | `background_story,omitempty` | 背景故事 |
| `Works` | `[]Work` | `works,omitempty` | 关联的作品对象切片 (gorm:"many2many:work_characters;") |

### `WorldviewCategory`
世界观的类别，比如功法体系，武器，地点，身份，集团等
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 分类唯一标识符 (主键) |
| `UserID` | `uint` | `user_id` | 所属用户ID |
| `Name` | `string` | `name` | 分类名称 |

### `WorldviewItem`
世界观是作品的核心内容，必须与作品绑定。世界观可以穿插多个作品，世界观可以与角色绑定。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 条目唯一标识符 (主键) |
| `UserID` | `uint` | `user_id` | 所属用户ID |
| `CategoryID` | `uint` | `category_id` | 所属分类ID |
| `Name` | `string` | `name` | 条目名称 |
| `Description` | `string` | `description` | 条目详细描述 |
| `CoverImageURL` | `string` | `cover_image_url` | 条目封面图片URL |

### `WorkCharacter`
作品维度的角色管理
1、角色与角色之间可能存在关系。
2、角色可能与世界观存在复杂的关联，比如江南七怪里的柯镇恶既是角色，又是江南七怪这个世界观的组成部分。又比如西游记里的七十二变，既是西游记世界观下的一种世界观（功法），又是孙悟空的核心技能。
3、角色的核心基础属性包括基础描述信息（性别，年龄，职业，性格等），角色的能力（通过是个会不断更新的列表），角色的经历（通过是个会不断更新的列表），角色的身份（通过是个会不断更新的列表）。
4、角色经历可以从章节中提取。
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `WorkID` | `int64` | `work_id` | 作品ID (主键) |
| `CharacterID` | `uint` | `character_id` | 角色ID (主键) |
| `WorkSpecificAlias` | `*string` | `work_specific_alias,omitempty` | 在该作品中的特定别名 |
| `WorkSpecificStatus` | `*string` | `work_specific_status,omitempty` | 在该作品中的状态 |
| `GrowthLog` | `datatypes.JSON` | `growth_log` | 角色在该作品中的成长履历 |

### `EntityRelationship`
表示作品里的某些基本元素的关系的一个数据结构，其中包含多类关系，比如人物关系，比如人物与世界观的关系，比如世界观与世界观的关系等
| 字段名 | Go 类型 | JSON 键 | 描述 |
| --- | --- | --- | --- |
| `ID` | `uint` | `id` | 关系唯一标识符 (主键) |
| `SourceEntityType` | `string` | `source_entity_type` | 源实体类型 |
| `SourceEntityID` | `uint` | `source_entity_id` | 源实体ID |
| `TargetEntityType` | `string` | `target_entity_type` | 目标实体类型 |
| `TargetEntityID` | `uint` | `target_entity_id` | 目标实体ID |
| `RelationshipType` | `string` | `relationship_type` | 关系类型 |
| `Description` | `string` | `description` | 关系描述 |
