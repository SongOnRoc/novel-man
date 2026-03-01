package worldview

import (
	"fmt"
	"novel-man/backend/internal/contracts/worldview"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

type WorldviewCategoryService struct {
	*services.GenericService[models.WorldviewCategory, uint, worldview.WorldviewCategoryRepository]
	repo        worldview.WorldviewCategoryRepository
	itemService worldview.WorldviewItemService
	publisher   events.Publisher
	outbox      events.OutboxStore
}

func NewWorldviewCategoryService(repo worldview.WorldviewCategoryRepository, itemService worldview.WorldviewItemService, publisher events.Publisher, outbox events.OutboxStore) worldview.WorldviewCategoryService {
	return &WorldviewCategoryService{
		GenericService: services.NewGenericService[models.WorldviewCategory, uint, worldview.WorldviewCategoryRepository](repo),
		repo:           repo,
		itemService:    itemService,
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *WorldviewCategoryService) GetCategoriesByUserID(ctx context.Context, userID uint) ([]models.WorldviewCategory, error) {
	return s.repo.GetCategoriesByUserID(ctx, userID)
}

func (s *WorldviewCategoryService) Delete(ctx context.Context, id uint) error {
	items, err := s.itemService.GetItemsByCategoryID(ctx, id)
	if err != nil {
		return err
	}
	for _, item := range items {
		if err := s.itemService.Delete(ctx, item.ID); err != nil {
			return err
		}
	}
	return s.GenericService.Delete(ctx, id)
}

func (s *WorldviewCategoryService) HandleWorldviewCategoryTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseWorldviewCategoryID(task)
	if err != nil {
		return err
	}
	category, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, category); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleWorldview,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"worldview_category_id": category.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *WorldviewCategoryService) Create(ctx context.Context, entity *models.WorldviewCategory) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeWorldviewCategoryCreate,
			AggregateType: events.AggregateTypeWorldviewCategory,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerWorldviewCategoryService,
			Payload:       map[string]any{"worldview_category_id": entity.ID, "user_id": entity.UserID},
		})
	}
	return nil
}

func (s *WorldviewCategoryService) Update(ctx context.Context, id uint, entity *models.WorldviewCategory) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeWorldviewCategoryUpdate,
			AggregateType: events.AggregateTypeWorldviewCategory,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerWorldviewCategoryService,
			Payload:       map[string]any{"worldview_category_id": id, "user_id": entity.UserID},
		})
	}
	return nil
}

type WorldviewItemService struct {
	*services.GenericService[models.WorldviewItem, uint, worldview.WorldviewItemRepository]
	repo      worldview.WorldviewItemRepository
	publisher events.Publisher
	outbox    events.OutboxStore
}

func NewWorldviewItemService(repo worldview.WorldviewItemRepository, publisher events.Publisher, outbox events.OutboxStore) worldview.WorldviewItemService {
	return &WorldviewItemService{
		GenericService: services.NewGenericService[models.WorldviewItem, uint, worldview.WorldviewItemRepository](repo),
		repo:           repo,
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *WorldviewItemService) GetItemsByCategoryID(ctx context.Context, categoryID uint) ([]models.WorldviewItem, error) {
	return s.repo.GetItemsByCategoryID(ctx, categoryID)
}

func (s *WorldviewItemService) HandleWorldviewItemTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseWorldviewItemID(task)
	if err != nil {
		return err
	}
	item, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, item); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleWorldview,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"worldview_item_id": item.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *WorldviewItemService) Create(ctx context.Context, entity *models.WorldviewItem) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeWorldviewItemCreate,
			AggregateType: events.AggregateTypeWorldviewItem,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerWorldviewItemService,
			Payload:       map[string]any{"worldview_item_id": entity.ID, "user_id": entity.UserID, "category_id": entity.CategoryID},
		})
	}
	return nil
}

func (s *WorldviewItemService) Update(ctx context.Context, id uint, entity *models.WorldviewItem) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeWorldviewItemUpdate,
			AggregateType: events.AggregateTypeWorldviewItem,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerWorldviewItemService,
			Payload:       map[string]any{"worldview_item_id": id, "user_id": entity.UserID, "category_id": entity.CategoryID},
		})
	}
	return nil
}

func parseWorldviewCategoryID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["worldview_category_id"]; ok {
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
	return 0, fmt.Errorf("invalid worldview category task aggregate_id=%s", task.AggregateID)
}

func parseWorldviewItemID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["worldview_item_id"]; ok {
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
	return 0, fmt.Errorf("invalid worldview item task aggregate_id=%s", task.AggregateID)
}
