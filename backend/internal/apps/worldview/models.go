package worldview

import (
	"novel-man/backend/internal/apps/auth"
	"time"
)

// WorldviewCategory 定义了世界观设定的分类
type WorldviewCategory struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	User      auth.User `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 指定 WorldviewCategory 模型对应的数据库表名
func (WorldviewCategory) TableName() string {
	return "worldview_categories"
}

// WorldviewSetting 定义了世界观设定的 GORM 模型
type WorldviewSetting struct {
	ID          uint              `gorm:"primarykey" json:"id"`
	Name        string            `gorm:"type:varchar(255);not null" json:"name"`
	Description string            `gorm:"type:text" json:"description"`
	CategoryID  uint              `gorm:"not null" json:"category_id"`
	Category    WorldviewCategory `gorm:"foreignKey:CategoryID" json:"category"`
	UserID      uint              `gorm:"not null" json:"user_id"`
	User        auth.User         `gorm:"foreignKey:UserID" json:"user"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

// TableName 指定 WorldviewSetting 模型对应的数据库表名
func (WorldviewSetting) TableName() string {
	return "worldview_settings"
}
