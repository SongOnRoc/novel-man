package models

// UserAICustomSetting 存储用户自定义的AI模型连接信息。
type UserAICustomSetting struct {
	Base
	UserID    uint   `gorm:"not null;uniqueIndex:idx_user_setting_name" json:"user_id"`
	Name      string `gorm:"type:varchar(255);not null;uniqueIndex:idx_user_setting_name" json:"name"` // 用户为这个配置起的名字，e.g., "My Custom GPT-4"
	BaseURL   string `gorm:"type:varchar(255);not null" json:"base_url"`
	ModelName string `gorm:"type:varchar(255);not null" json:"model_name"`
	APIKey    string `gorm:"type:varchar(255);not null" json:"-"` // API Key 不应通过API返回给前端
	IsDefault bool   `gorm:"default:false" json:"is_default"`
}
