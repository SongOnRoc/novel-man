package characters

import (
	"fmt"
	"novel-man/backend/internal/contracts/characters"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// CharacterService 通过嵌入 GenericService 来复用代码
type CharacterService struct {
	*services.GenericService[models.Character, uint, characters.CharacterRepository]
	repo      characters.CharacterRepository
	publisher events.Publisher
	outbox    events.OutboxStore
}

func NewCharacterService(repo characters.CharacterRepository, publisher events.Publisher, outbox events.OutboxStore) characters.CharacterService {
	return &CharacterService{
		GenericService: services.NewGenericService[models.Character, uint, characters.CharacterRepository](repo),
		repo:           repo,
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *CharacterService) HandleCharacterTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseCharacterID(task)
	if err != nil {
		return err
	}
	entity, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleCharacters,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"character_id": entity.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *CharacterService) Create(ctx context.Context, entity *models.Character) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeCharactersCreate,
			AggregateType: events.AggregateTypeCharacter,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerCharactersService,
			Payload:       map[string]any{"character_id": entity.ID, "user_id": entity.UserID},
		})
	}
	return nil
}

func (s *CharacterService) Update(ctx context.Context, id uint, entity *models.Character) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeCharactersUpdate,
			AggregateType: events.AggregateTypeCharacter,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerCharactersService,
			Payload:       map[string]any{"character_id": id, "user_id": entity.UserID},
		})
	}
	return nil
}

func parseCharacterID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["character_id"]; ok {
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
	return 0, fmt.Errorf("invalid character task aggregate_id=%s", task.AggregateID)
}
