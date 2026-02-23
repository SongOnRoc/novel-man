package works

import (
	"fmt"
	"mime/multipart"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/internal/services"
	"novel-man/backend/utils/context"
)

// WorkService 通过嵌入 GenericService 来复用代码
type WorkService struct {
	*services.GenericService[models.Work, int64, works.WorkRepository]
	repo      works.WorkRepository
	chapter   chapters.ChapterService
	importer  *WorkImporter
	publisher events.Publisher
}

func NewWorkService(repo works.WorkRepository, chapterService chapters.ChapterService, publisher events.Publisher) works.WorkService {
	return &WorkService{
		GenericService: services.NewGenericService[models.Work, int64, works.WorkRepository](repo),
		repo:           repo,
		chapter:        chapterService,
		importer:       NewWorkImporter(),
		publisher:      publisher,
	}
}

// 实现 Publish 特有方法
func (s *WorkService) Publish(ctx context.Context, id int64) error {
	work, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}

	work.Status = "published"
	if err := s.Update(ctx, id, work); err != nil {
		return err
	}

	return s.publishFactEvent(ctx, events.EventTypeWorksPublish, work)
}

func (s *WorkService) Create(ctx context.Context, entity *models.Work) error {
	if err := s.repo.Create(ctx, entity); err != nil {
		return err
	}
	return s.publishFactEvent(ctx, events.EventTypeWorksCreate, entity)
}

func (s *WorkService) Update(ctx context.Context, id int64, entity *models.Work) error {
	if err := s.repo.Update(ctx, id, entity); err != nil {
		return err
	}
	return s.publishFactEvent(ctx, events.EventTypeWorksUpdate, entity)
}

func (s *WorkService) HandleWorkStatsTask(ctx context.Context, task events.QueueTask) error {
	workID, err := parseWorkID(task)
	if err != nil {
		return err
	}

	work, err := s.GetByID(ctx, workID)
	if err != nil {
		return err
	}

	filters := contracts.Filters{"work_id": work.ID}
	chapterList, _, err := s.chapter.List(ctx, 1, 100000, filters)
	if err != nil {
		return err
	}

	totalWordCount := 0
	for _, chapter := range chapterList {
		totalWordCount += chapter.WordCount
	}
	totalChapterCount := len(chapterList)

	if totalWordCount == work.TotalWordCount && totalChapterCount == work.TotalChapterCount {
		return nil
	}

	if err := s.repo.UpdateWorkStats(ctx, work.ID, totalWordCount, totalChapterCount); err != nil {
		return err
	}

	work.TotalWordCount = totalWordCount
	work.TotalChapterCount = totalChapterCount
	return s.publishFactEvent(ctx, events.EventTypeWorksStatsUpdated, work)
}

func (s *WorkService) publishFactEvent(ctx context.Context, eventType string, work *models.Work) error {
	if s.publisher == nil {
		return nil
	}
	return s.publisher.PublishFactEvent(ctx, events.FactEvent{
		EventType:     eventType,
		AggregateType: events.AggregateTypeWork,
		AggregateID:   fmt.Sprintf("%d", work.ID),
		Producer:      events.ProducerWorksService,
		Payload: map[string]any{
			"work_id": work.ID,
			"user_id": work.UserID,
		},
	})
}

func parseWorkID(task events.QueueTask) (int64, error) {
	var workID int64
	_, err := fmt.Sscanf(task.PartitionKey, "work:%d:%s", &workID, new(string))
	if err == nil {
		return workID, nil
	}
	_, err = fmt.Sscanf(task.PartitionKey, "works:%d:%s", &workID, new(string))
	if err == nil {
		return workID, nil
	}
	return 0, fmt.Errorf("invalid partition key: %s", task.PartitionKey)
}

// Import 导入作品
func (s *WorkService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return s.importer.Import(ctx, file, userID, func(c context.Context, w *models.Work) error {
		w.UserID = userID // 确保作品属于当前用户
		return s.Create(c, w)
	})
}
