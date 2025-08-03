package settings

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// SettingService 通过组合基础 CRUD 接口形成
type SettingService interface {
	contracts.GenericCRUD[models.UserSetting, uint]
	// GetByUserID retrieves a setting by user ID
	GetByUserID(ctx context.Context, userID uint) (*models.UserSetting, error)
	// UpdateByUserID updates a setting by user ID
	UpdateByUserID(ctx context.Context, userID uint, setting *models.UserSetting) error
}
