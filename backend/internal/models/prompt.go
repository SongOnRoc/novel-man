package models

// Prompt 定义了用户或系统预设的AI提示词。
type Prompt struct {
	Base
	UserID   uint    `gorm:"not null" json:"user_id"`
	Title    string  `gorm:"type:varchar(255);not null" json:"title"`
	Content  string  `gorm:"type:text;not null" json:"content"`
	Type     string  `gorm:"type:varchar(100);not null;default:'user'" json:"type"` // e.g., 'user', 'system'
	Tags     *string `gorm:"type:varchar(255)" json:"tags,omitempty"`               // Comma-separated tags
	Status   string  `gorm:"type:varchar(50);not null;default:'active'" json:"status"`
	IsSystem bool    `gorm:"default:false" json:"is_system"` // True for system-provided prompts like 'expand', 'summarize'
}