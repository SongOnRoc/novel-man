package chapters

import (
	"fmt"
	"mime/multipart"
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// ChapterService 通过嵌入 GenericService 来复用代码
type ChapterService struct {
	*services.GenericService[models.Chapter, uint, chapters.ChapterRepository]
	repo      chapters.ChapterRepository
	importer  *ChapterImporter
	publisher events.Publisher
	outbox    events.OutboxStore
}

func NewChapterService(repo chapters.ChapterRepository, publisher events.Publisher, outbox events.OutboxStore) chapters.ChapterService {
	return &ChapterService{
		GenericService: services.NewGenericService[models.Chapter, uint, chapters.ChapterRepository](repo),
		repo:           repo,
		importer:       NewChapterImporter(),
		publisher:      publisher,
		outbox:         outbox,
	}
}

func (s *ChapterService) HandleChapterTask(ctx context.Context, task events.QueueTask) error {
	id, err := parseUintID(task)
	if err != nil {
		return err
	}
	chapter, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.repo.Update(ctx, id, chapter); err != nil {
		return err
	}
	if s.outbox != nil {
		_ = s.outbox.Add(ctx, events.OutboxMessage{
			Module:  events.ModuleChapters,
			Channel: events.OutboxChannelInApp,
			Payload: map[string]any{"chapter_id": chapter.ID, "event_id": task.EventID},
			Status:  events.OutboxStatusPending,
		})
	}
	return nil
}

func (s *ChapterService) Create(ctx context.Context, entity *models.Chapter) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeChaptersCreate,
			AggregateType: events.AggregateTypeChapter,
			AggregateID:   fmt.Sprintf("%d", entity.ID),
			Producer:      events.ProducerChaptersService,
			Payload:       map[string]any{"chapter_id": entity.ID, "work_id": entity.WorkID},
		})
	}
	return nil
}

func (s *ChapterService) Update(ctx context.Context, id uint, entity *models.Chapter) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	if s.publisher != nil {
		return s.publisher.PublishFactEvent(ctx, events.FactEvent{
			EventType:     events.EventTypeChaptersUpdate,
			AggregateType: events.AggregateTypeChapter,
			AggregateID:   fmt.Sprintf("%d", id),
			Producer:      events.ProducerChaptersService,
			Payload:       map[string]any{"chapter_id": id, "work_id": entity.WorkID},
		})
	}
	return nil
}

func parseUintID(task events.QueueTask) (uint, error) {
	if raw, ok := task.Payload["chapter_id"]; ok {
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
	return 0, fmt.Errorf("invalid chapter task aggregate_id=%s", task.AggregateID)
}

// Import 导入章节
func (s *ChapterService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	// 从 context 中获取 workID，这通常由路由参数提供
	// 注意：这里假设 controller 会将 workID 放入 context 或通过其他方式传递
	// 但 GenericImporter 的 Import 方法签名固定，所以我们可能需要从 file header 或其他地方获取，或者在 controller 层处理
	// 这里的 Import 接口签名是 (ctx, file, userID)，没有 workID。
	// 这是一个问题。我们需要在 controller 中解析 workID，然后传递给 service。
	// 但是 contracts.Importer 接口定义是 Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*ImportResult, error)
	// 我们可以将 workID 放入 context 中传递。

	return s.importer.Import(ctx, file, userID, func(c context.Context, ch *models.Chapter) error {
		// 从 context 获取 workID
		if workID, ok := c.Value("workID").(uint); ok {
			ch.WorkID = int64(workID)
		}
		return s.Create(c, ch)
	})
}
