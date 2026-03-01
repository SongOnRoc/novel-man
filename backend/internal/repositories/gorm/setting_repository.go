package gorm

import (
	"novel-man/backend/internal/contracts/settings"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// SettingGormRepository 通过嵌入 GenericGormRepository 来复用代码
type SettingGormRepository struct {
	*GenericGormRepository[models.UserSetting, uint]
	db *gorm.DB
}

func NewSettingGormRepository(db *gorm.DB) settings.SettingRepository {
	return &SettingGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.UserSetting, uint](db),
		db:                    db,
	}
}

// GetByUserID retrieves a setting by user ID
func (r *SettingGormRepository) GetByUserID(ctx context.Context, userID uint) (*models.UserSetting, error) {
	var setting models.UserSetting
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&setting).Error; err != nil {
		return nil, err
	}
	return &setting, nil
}

// UpdateByUserID updates a setting by user ID
func (r *SettingGormRepository) UpdateByUserID(ctx context.Context, userID uint, setting *models.UserSetting) error {
	return r.db.WithContext(ctx).Model(&models.UserSetting{}).Where("user_id = ?", userID).Updates(setting).Error
}
