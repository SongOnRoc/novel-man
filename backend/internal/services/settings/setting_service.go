package settings

import (
	"fmt"
	"novel-man/backend/internal/contracts/settings"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// SettingService 通过嵌入 GenericService 来复用代码
type SettingService struct {
	*services.GenericService[models.UserSetting, uint, settings.SettingRepository]
	repo      settings.SettingRepository
	publisher events.Publisher
	outbox    events.OutboxStore
}

func NewSettingService(repo settings.SettingRepository, publisher events.Publisher, outbox events.OutboxStore) settings.SettingService {
	return &SettingService{
		GenericService: services.NewGenericService[models.UserSetting, uint, settings.SettingRepository](repo),
		repo:           repo,
		publisher:      publisher,
		outbox:         outbox,
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

func (s *SettingService) HandleSettingTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseSettingID(task)
	if err != nil {
		return err
	}
	setting, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, setting); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleSettings,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"setting_id": setting.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *SettingService) Create(ctx context.Context, entity *models.UserSetting) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeSettingsCreate,
			AggregateType: events.AggregateTypeSetting,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerSettingsService,
			Payload:       map[string]any{"setting_id": entity.ID, "user_id": entity.UserID},
		})
	}
	return nil
}

func (s *SettingService) Update(ctx context.Context, id uint, entity *models.UserSetting) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeSettingsUpdate,
			AggregateType: events.AggregateTypeSetting,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerSettingsService,
			Payload:       map[string]any{"setting_id": id, "user_id": entity.UserID},
		})
	}
	return nil
}

func parseSettingID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["setting_id"]; ok {
		switch v := raw.(type) {
		case uint:
			return v, nil
		case int:
			if v >= 0 {
				return uint(v), nil
			}
		case int64:
			if v >= 0 {
				return uint(v), nil
			}
		case float64:
			if v >= 0 {
				return uint(v), nil
			}
		}
	}
	var id uint
	_, err := fmt.Sscanf(task.AggregateID, "%d", &id)
	if err == nil && id > 0 {
		return id, nil
	}
	return 0, fmt.Errorf("invalid setting task aggregate_id=%s", task.AggregateID)
}
