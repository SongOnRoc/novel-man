package works

import (
	"novel-man/backend/internal/apps/auth"
	"time"
)

// Work represents the works table in the database.
type Work struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `gorm:"not null" json:"-"`
	User          auth.User `gorm:"foreignKey:UserID" json:"-"`
	Title         string    `gorm:"not null;size:255" json:"title"`
	Description   string    `gorm:"type:text" json:"description"`
	CoverImageURL string    `gorm:"size:255" json:"cover_image_url"`
	Category      string    `gorm:"size:100" json:"category"`
	Status        string    `gorm:"not null;size:50" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// TableName returns the name of the table for the Work model.
func (Work) TableName() string {
	return "works"
}
