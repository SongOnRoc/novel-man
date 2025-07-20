package models

import (
	"gorm.io/gorm"
)

type UserSetting struct {
	gorm.Model
	UserID            uint   `gorm:"uniqueIndex"`      // 每个用户只有一个设置
	AIModel           string `gorm:"type:varchar(20)"` // 'gpt-4' | 'claude-3' | 'custom'
	CustomAPIEndpoint string
	EditorTheme       string `gorm:"type:varchar(10)"` // 'light' | 'dark'
	FontSize          int
	LineHeight        float64
}
