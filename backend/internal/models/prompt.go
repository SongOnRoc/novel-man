package models

import (
	"time"

	"gorm.io/datatypes"
)

// Prompt 定义了用户或系统预设的AI提示词。
type Prompt struct {
	Base
	UserID          uint           `gorm:"not null" json:"user_id"`
	Title           string         `gorm:"type:varchar(255);not null" json:"title" json_field:"title"`
	Content         string         `gorm:"type:text;not null" json:"content" json_field:"content"`
	Description     string         `gorm:"type:text" json:"description,omitempty" json_field:"description"`
	Summary         datatypes.JSON `gorm:"type:json" json:"summary,omitempty"`
	Author          string         `gorm:"type:varchar(100)" json:"author,omitempty" json_field:"author"`
	AuthorSpecialty string         `gorm:"type:varchar(255)" json:"author_specialty,omitempty" json_field:"authorSpecialty"`
	AuthorAvatar    string         `gorm:"type:varchar(255)" json:"author_avatar,omitempty" json_field:"authorAvatar"`
	UsageCount      uint           `gorm:"default:0" json:"usage_count"`
	PrimaryTag      string         `gorm:"type:varchar(100)" json:"primary_tag,omitempty" json_field:"primaryTag"`
	Categories      datatypes.JSON `json:"categories,omitempty" json_field:"categories"`
	FooterTags      datatypes.JSON `json:"footer_tags,omitempty" json_field:"footerTags"`
	UpdatedAt       time.Time      `json:"updated_at"`
	Status          string         `gorm:"type:varchar(50);not null;default:'active'" json:"status" json_field:"status" default:"active"`
	IsSystem        bool           `gorm:"default:false" json:"is_system"`
}
