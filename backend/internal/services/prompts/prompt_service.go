package prompts

import (
	"fmt"
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/prompts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

const (
	SystemPromptIDMin uint = 10
	SystemPromptIDMax uint = 99
	UserPromptIDMin   uint = 1000
)

type promptService struct {
	*services.GenericService[models.Prompt, uint, prompts.PromptRepository]
	repo      prompts.PromptRepository
	importer  *PromptImporter
	publisher events.Publisher
	outbox    events.OutboxStore
}

func NewPromptService(repo prompts.PromptRepository, publisher events.Publisher, outbox events.OutboxStore) prompts.PromptService {
	return &promptService{
		GenericService: services.NewGenericService[models.Prompt, uint, prompts.PromptRepository](repo),
		repo:           repo,
		importer:       NewPromptImporter(),
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *promptService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return s.importer.Import(ctx, file, userID, func(c context.Context, p *models.Prompt) error {
		if p.ID < UserPromptIDMin {
			p.ID = 0
		}
		return s.Create(c, p)
	})
}

func (s *promptService) HandlePromptTask(ctx context.Context, task events.QueueTask) error {
	id, err := parsePromptID(task)
	if err != nil {
		return err
	}
	prompt, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, prompt); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModulePrompts,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"prompt_id": prompt.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *promptService) Create(ctx context.Context, entity *models.Prompt) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypePromptsCreate,
			AggregateType: events.AggregateTypePrompt,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerPromptsService,
			Payload:       map[string]any{"prompt_id": entity.ID, "user_id": entity.UserID},
		})
	}
	return nil
}

func (s *promptService) Update(ctx context.Context, id uint, entity *models.Prompt) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypePromptsUpdate,
			AggregateType: events.AggregateTypePrompt,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerPromptsService,
			Payload:       map[string]any{"prompt_id": id, "user_id": entity.UserID},
		})
	}
	return nil
}

func parsePromptID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["prompt_id"]; ok {
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
	return 0, fmt.Errorf("invalid prompt task aggregate_id=%s", task.AggregateID)
}
