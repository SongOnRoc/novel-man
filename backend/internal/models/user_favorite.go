package models

import "time"

// ResourceType 资源类型枚举
type ResourceType string

const (
	ResourceTypePrompt   ResourceType = "prompt"   // 提示词
	ResourceTypeSnippet  ResourceType = "snippet"  // 小说片段
	ResourceTypeSentence ResourceType = "sentence" // 句子素材
	//可扩展更多类型...
)

// UserFavorite 用户收藏（通用）
// 采用多态关联设计，一张表支持收藏多种类型的资源
// UserFavorite 用户收藏（通用）
// 采用多态关联设计，一张表支持收藏多种类型的资源
type UserFavorite struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	UserID       uint         `gorm:"not null;uniqueIndex:uk_user_resource" json:"user_id"`
	ResourceType ResourceType `gorm:"size:50;not null;uniqueIndex:uk_user_resource" json:"resource_type"`
	ResourceID   uint         `gorm:"not null;uniqueIndex:uk_user_resource" json:"resource_id"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}
func (UserFavorite) TableName() string {
	return "user_favorites"
}