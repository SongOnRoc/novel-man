package characters

import (
	"time"

	"novel-man/backend/internal/apps/auth"
)

// Character represents the character model.
type Character struct {
	ID              uint      `gorm:"primarykey"`
	UserID          uint      `gorm:"not null"`
	User            auth.User `gorm:"foreignKey:UserID"`
	Name            string    `gorm:"type:varchar(255);not null"`
	Alias           string    `gorm:"type:varchar(255)"`
	AvatarURL       string    `gorm:"type:varchar(255)"`
	AppearanceDesc  string    `gorm:"type:text"`
	PersonalityDesc string    `gorm:"type:text"`
	AbilityDesc     string    `gorm:"type:text"`
	BackgroundStory string    `gorm:"type:text"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}

// TableName returns the table name for the Character model.
func (Character) TableName() string {
	return "characters"
}
