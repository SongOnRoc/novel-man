package chapters

import (
	"novel-man/backend/internal/apps/works"
	"time"
)

// Chapter represents the chapters table in the database.
type Chapter struct {
	ID          uint       `gorm:"primaryKey"`
	WorkID      int64      `gorm:"not null"`
	Work        works.Work `gorm:"foreignKey:WorkID"`
	Title       string     `gorm:"not null;size:255"`
	Content     string     `gorm:"type:text"`
	Order       int        `gorm:"not null"`
	WordCount   int        `gorm:"not null"`
	Status      string     `gorm:"not null;size:50"`
	PublishedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName returns the name of the table for the Chapter model.
func (Chapter) TableName() string {
	return "chapters"
}
