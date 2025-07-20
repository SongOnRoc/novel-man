package settings

import (
	"novel-man/backend/internal/contracts/settings"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// SettingService 通过嵌入 GenericService 来复用代码
type SettingService struct {
	*services.GenericService[models.UserSetting, uint, settings.SettingRepository]
	repo settings.SettingRepository
}

func NewSettingService(repo settings.SettingRepository) settings.SettingService {
	return &SettingService{
		GenericService: services.NewGenericService[models.UserSetting, uint, settings.SettingRepository](repo),
		repo:           repo,
	}
}

// GetByUserID retrieves a setting by user ID
func (s *SettingService) GetByUserID(ctx context.Context, userID uint) (*models.UserSetting, error) {
	return s.repo.GetByUserID(ctx, userID)
}

// UpdateByUserID updates a setting by user ID
func (s *SettingService) UpdateByUserID(ctx context.Context, userID uint, setting *models.UserSetting) error {
	return s.repo.UpdateByUserID(ctx, userID, setting)
}