package models

import (
	"gorm.io/datatypes"
)

// Prompt 定义了用户或系统预设的AI提示词。
type Prompt struct {
	Base
	UserID          uint           `gorm:"not null" json:"user_id"`
	Title           string         `gorm:"type:varchar(255);not null" json:"title"`
	Content         string         `gorm:"type:text;not null" json:"content"`
	Description     string         `gorm:"type:text" json:"description,omitempty"`
	Summary         datatypes.JSON `gorm:"type:json" json:"summary,omitempty"` 
	Author          string         `gorm:"type:varchar(100)" json:"author,omitempty"`
	AuthorSpecialty string         `gorm:"type:varchar(255)" json:"author_specialty,omitempty"`
	AuthorAvatar    string         `gorm:"type:varchar(255)" json:"author_avatar,omitempty"`
	UsageCount      uint           `gorm:"default:0" json:"usage_count"`
	PrimaryTag      string         `gorm:"type:varchar(100)" json:"primary_tag,omitempty"`
	Categories      datatypes.JSON `json:"categories,omitempty"` 
	FooterTags      datatypes.JSON `json:"footer_tags,omitempty"`
	Status          string         `gorm:"type:varchar(50);not null;default:'active'" json:"status"`
	IsSystem        bool           `gorm:"default:false" json:"is_system"`
}
