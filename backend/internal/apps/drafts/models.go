package drafts

import (
	"time"

	"gorm.io/gorm"
)

// Draft represents a draft of a chapter for a work.
type Draft struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Title   string `json:"title"`
	Content string `json:"content"`

	WorkID uint `json:"work_id"`
}
