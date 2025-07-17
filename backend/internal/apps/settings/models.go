package settings

import (
	"time"

	"novel-man/backend/internal/apps/auth"
)

// UserSetting 定义了用户的偏好设置
type UserSetting struct {
	ID                uint      `gorm:"primarykey"`
	UserID            uint      `gorm:"not null;uniqueIndex"`
	User              auth.User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	AIModel           string    `gorm:"size:255"`
	CustomAPIEndpoint string
	EditorTheme       string    `gorm:"size:100"`
	CreatedAt         time.Time `gorm:"autoCreateTime"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime"`
}

// TableName 指定 UserSetting 模型的表名
func (UserSetting) TableName() string {
	return "user_settings"
}