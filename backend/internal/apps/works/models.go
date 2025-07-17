package works

import (
	"novel-man/backend/internal/apps/auth"
	"time"
)

// Work represents the works table in the database.
type Work struct {
	ID            uint      `gorm:"primaryKey"`
	UserID        uint      `gorm:"not null"`
	User          auth.User `gorm:"foreignKey:UserID"`
	Title         string    `gorm:"not null;size:255"`
	Description   string    `gorm:"type:text"`
	CoverImageURL string    `gorm:"size:255"`
	Category      string    `gorm:"size:100"`
	Status        string    `gorm:"not null;size:50"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// TableName returns the name of the table for the Work model.
func (Work) TableName() string {
	return "works"
}
