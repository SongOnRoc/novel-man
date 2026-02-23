package drafts

import (
	"errors"
	"fmt"

	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// DraftService 通过嵌入 GenericService 来复用代码
type DraftService struct {
	*services.GenericService[models.Draft, uint, drafts.DraftRepository]
	repo        drafts.DraftRepository
	chapterRepo chapters.ChapterRepository
	workRepo    works.WorkRepository
	publisher   events.Publisher
	outbox      events.OutboxStore
}

func NewDraftService(
	repo drafts.DraftRepository,
	chapterRepo chapters.ChapterRepository,
	workRepo works.WorkRepository,
	publisher events.Publisher,
	outbox events.OutboxStore,
) drafts.DraftService {
	return &DraftService{
		GenericService: services.NewGenericService[models.Draft, uint, drafts.DraftRepository](repo),
		repo:           repo,
		chapterRepo:    chapterRepo,
		workRepo:       workRepo,
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *DraftService) Publish(ctx context.Context, draftID uint) (*models.Chapter, error) {
	draft, err := s.repo.GetByID(ctx, draftID)
	if err != nil {
		return nil, err
	}
	if draft.WorkID == nil {
		return nil, errors.New("draft is not associated with a work")
	}

	chapter := &models.Chapter{
		WorkID:    *draft.WorkID,
		Title:     draft.Title,
		Content:   draft.Content,
		WordCount: draft.WordCount,
		Status:    "published",
	}
	if err := s.chapterRepo.Create(ctx, chapter); err != nil {
		return nil, err
	}

	// 同步更新作品统计（总字数/总章节数）。
	// 说明：章节通过草稿发布创建时，绕过 ChapterController 的增量统计更新，
	// 导致 dashboard 依赖的 works.total_word_count / works.total_chapter_count 偏小。
	work, err := s.workRepo.GetByID(ctx, int64(*draft.WorkID))
	if err != nil {
		return nil, err
	}
	newTotalWordCount := work.TotalWordCount + draft.WordCount
	if newTotalWordCount < 0 {
		newTotalWordCount = 0
	}
	newTotalChapterCount := work.TotalChapterCount + 1
	if newTotalChapterCount < 0 {
		newTotalChapterCount = 0
	}
	if err := s.workRepo.UpdateWorkStats(ctx, work.ID, newTotalWordCount, newTotalChapterCount); err != nil {
		return nil, err
	}

	if err := s.repo.Delete(ctx, draftID); err != nil {
		return nil, err
	}

	return chapter, nil
}

func (s *DraftService) HandleDraftTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseDraftID(task)
	if err != nil {
		return err
	}
	draft, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, draft); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleDrafts,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"draft_id": draft.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *DraftService) Create(ctx context.Context, entity *models.Draft) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeDraftsCreate,
			AggregateType: events.AggregateTypeDraft,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerDraftsService,
			Payload:       map[string]any{"draft_id": entity.ID, "user_id": entity.UserID, "work_id": entity.WorkID},
		})
	}
	return nil
}

func (s *DraftService) Update(ctx context.Context, id uint, entity *models.Draft) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeDraftsUpdate,
			AggregateType: events.AggregateTypeDraft,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerDraftsService,
			Payload:       map[string]any{"draft_id": id, "user_id": entity.UserID, "work_id": entity.WorkID},
		})
	}
	return nil
}

func parseDraftID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["draft_id"]; ok {
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
	return 0, fmt.Errorf("invalid draft task aggregate_id=%s", task.AggregateID)
}
