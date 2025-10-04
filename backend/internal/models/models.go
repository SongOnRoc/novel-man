package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"gorm.io/gorm"
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

// User 代表应用的用户。
type User struct {
	Base
	Username     string `gorm:"type:varchar(255);unique;not null" json:"username"`
	Email        string `gorm:"type:varchar(255);unique;not null" json:"email"`
	PasswordHash string `gorm:"type:varchar(255);not null" json:"-"`
	Avatar       string `gorm:"type:varchar(255)" json:"avatar"`
	Description  string `gorm:"type:text" json:"description"`
	Skill        string `gorm:"type:text" json:"skill"`
}

// Character 是一个全局的角色模板，定义了角色的基础、跨作品的属性。
type Character struct {
	Base
	UserID    uint   `gorm:"not null" json:"user_id"`
	Name      string `gorm:"type:varchar(255);not null" json:"name"`
	Alias     string `gorm:"type:varchar(255)" json:"alias"`
	AvatarURL string `gorm:"type:varchar(255)" json:"avatar_url"`
	Gender    string `gorm:"type:varchar(50)" json:"gender"`
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
	UserID uint `gorm:"not null" json:"user_id"`
	// 优化：将唯一约束改为用户范围内的联合唯一约束，允许不同用户拥有同名分类。
	Name string `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_category_name" json:"name"`
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
	Works      []Work      `gorm:"many2many:work_worldview_items;" json:"-"`
	Characters []Character `gorm:"many2many:character_worldview_items;" json:"-"`
}

// Work 是单个写作项目（如小说）的聚合根。
type Work struct {
	ID                int64          `gorm:"primarykey" json:"id"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`
	UserID            uint           `gorm:"not null" json:"user_id"`
	Title             string         `gorm:"type:varchar(255);not null" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	CoverImageURL     string         `gorm:"type:varchar(255)" json:"cover_image_url"`
	Category          string         `gorm:"type:varchar(100)" json:"category"`
	Status            string         `gorm:"type:varchar(50)" json:"status"`
	Outline           string         `gorm:"type:text" json:"outline"`
	TotalWordCount    int            `gorm:"default:0" json:"total_word_count"`
	TotalChapterCount int            `gorm:"default:0" json:"total_chapter_count"`

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
	WorkID       int64      `gorm:"not null" json:"work_id"`
	VolumeID     *uint      `json:"volume_id,omitempty"`
	Title        string     `gorm:"type:varchar(255);not null" json:"title"`
	Content      string     `gorm:"type:longtext" json:"content"`
	WordCount    int        `gorm:"default:0" json:"word_count"`
	DisplayOrder int        `gorm:"default:0" json:"display_order"`
	Status       string     `gorm:"type:varchar(50)" json:"status"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
}

// Draft 是正在创作的内容的聚合根。
type Draft struct {
	Base
	UserID      uint   `gorm:"not null" json:"user_id"`
	WorkID      *int64 `json:"work_id,omitempty"`
	Title       string `gorm:"type:varchar(255);not null" json:"title"`
	Content     string `gorm:"type:longtext" json:"content"`
	Description string `gorm:"type:text" json:"description"`
	WordCount   int    `gorm:"default:0" json:"word_count"`
	Status      string `gorm:"type:varchar(50)" json:"status"`
}

// WorkCharacter 代表一个角色在一个特定作品中的实例。
// 它可以继承和覆盖全局角色的属性，并且是其所有经历的拥有者。
type WorkCharacter struct {
	Base // 包含自己的ID, CreatedAt, UpdatedAt

	// --- 核心关联 ---
	WorkID      uint `gorm:"not null;uniqueIndex:idx_work_character"`
	CharacterID uint `gorm:"not null;uniqueIndex:idx_work_character"`

	// GORM关联：这使得我们可以通过 WorkCharacter 轻松访问到全局角色模板的信息
	Character Character `gorm:"foreignKey:CharacterID" json:"-"` // json:"-" 避免在API中重复输出

	// --- 可覆盖/扩展的属性 (使用指针类型以支持'nil'值) ---
	// 这些字段允许角色在不同作品中有不同的表现。
	Alias       *string `json:"alias,omitempty"`
	Age         *int    `json:"age,omitempty"`
	Occupation  *string `json:"occupation,omitempty"`
	Appearance  *string `gorm:"type:text" json:"appearance,omitempty"`
	Personality *string `gorm:"type:text" json:"personality,omitempty"`
	Abilities   *string `gorm:"type:text" json:"abilities,omitempty"`

	// --- 作品专属属性 ---
	WorkSpecificStatus *string `gorm:"type:varchar(100)" json:"work_specific_status,omitempty"`

	// --- 核心：该角色在该作品中的所有经历 ---
	Experiences []Experience `gorm:"foreignKey:WorkCharacterID" json:"experiences,omitempty"`
}

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

// Experience 记录了一段具体的经历。
type Experience struct {
	Base // 包含 ID, CreatedAt, UpdatedAt

	WorkCharacterID uint `gorm:"not null;index" json:"work_character_id"` // 外键，明确指向所属的“作品-角色”实例

	// --- 经历的核心要素 ---
	Content string `gorm:"type:text;not null" json:"content"` // 经历的纯文本描述

	// 存储结构化、可查询的关联信息
	ExperienceContent ExperienceContentJSONB `gorm:"type:jsonb" json:"experience_content"`

	// **新增字段**：用于关联到具体的章节
	ChapterID *uint `gorm:"index" json:"chapter_id,omitempty"`
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
	WorkID           *int64 `json:"work_id,omitempty"`
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
