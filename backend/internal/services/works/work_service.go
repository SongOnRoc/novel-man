package works

import (
	"fmt"
	"mime/multipart"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/contracts/chapters"
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/logger"
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

func (s *WorkService) DeleteWithOptions(ctx context.Context, id int64, opts works.DeleteWorkOptions) error {
	return s.repo.DeleteWithOptions(ctx, id, opts)
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
	workID, err := parseWorkIDFromTask(task)
	if err != nil {
		logger.Warn(&ctx, "works stats consumer parse work id failed event_id={} task_id={} partition_key={} err={}", task.EventID, task.TaskID, task.PartitionKey, err)
		return err
	}

	jobID, _ := task.Payload["ops_job_id"].(string)
	logger.Info(&ctx, "works stats consumer received task job_id={} work_id={} event_id={} task_id={} trace_id={}", jobID, workID, task.EventID, task.TaskID, task.TraceID)

	work, err := s.GetByID(ctx, workID)
	if err != nil {
		logger.Warn(&ctx, "works stats consumer load work failed job_id={} work_id={} event_id={} task_id={} err={}", jobID, workID, task.EventID, task.TaskID, err)
		return err
	}

	filters := contracts.Filters{"work_id": work.ID}
	chapterList, _, err := s.chapter.List(ctx, 1, 100000, filters)
	if err != nil {
		logger.Warn(&ctx, "works stats consumer list chapters failed job_id={} work_id={} event_id={} task_id={} err={}", jobID, workID, task.EventID, task.TaskID, err)
		return err
	}

	totalWordCount := 0
	for _, chapter := range chapterList {
		totalWordCount += chapter.WordCount
	}
	totalChapterCount := len(chapterList)
	logger.Info(&ctx, "works stats consumer recomputed totals job_id={} work_id={} event_id={} task_id={} total_word_count={} total_chapter_count={} historical_total_word_count={} historical_total_chapter_count={}", jobID, workID, task.EventID, task.TaskID, totalWordCount, totalChapterCount, work.TotalWordCount, work.TotalChapterCount)

	if totalWordCount == work.TotalWordCount && totalChapterCount == work.TotalChapterCount {
		logger.Info(&ctx, "works stats consumer persist skipped unchanged job_id={} work_id={} event_id={} task_id={}", jobID, workID, task.EventID, task.TaskID)
		return nil
	}

	if err := s.repo.UpdateWorkStats(ctx, work.ID, totalWordCount, totalChapterCount); err != nil {
		logger.Warn(&ctx, "works stats consumer persist failed job_id={} work_id={} event_id={} task_id={} total_word_count={} total_chapter_count={} err={}", jobID, workID, task.EventID, task.TaskID, totalWordCount, totalChapterCount, err)
		return err
	}
	logger.Info(&ctx, "works stats consumer persist succeeded job_id={} work_id={} event_id={} task_id={} total_word_count={} total_chapter_count={}", jobID, workID, task.EventID, task.TaskID, totalWordCount, totalChapterCount)

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

func parseWorkIDFromTask(task events.QueueTask) (int64, error) {
	// 1) 优先从 payload.work_id 解析（适用于 chapters.* 事件）。
	if raw, ok := task.Payload["work_id"]; ok {
		switch v := raw.(type) {
		case int64:
			if v > 0 {
				return v, nil
			}
		case int:
			if v > 0 {
				return int64(v), nil
			}
		case uint:
			if v > 0 {
				return int64(v), nil
			}
		case uint64:
			if v > 0 {
				return int64(v), nil
			}
		case float64:
			if v > 0 {
				return int64(v), nil
			}
		case string:
			var parsed int64
			if _, err := fmt.Sscanf(v, "%d", &parsed); err == nil && parsed > 0 {
				return parsed, nil
			}
		}
	}

	// 2) 回退到 partition_key 解析（适用于 works.* 事件）。
	var workID int64
	_, err := fmt.Sscanf(task.PartitionKey, "work:%d:%s", &workID, new(string))
	if err == nil {
		return workID, nil
	}
	_, err = fmt.Sscanf(task.PartitionKey, "works:%d:%s", &workID, new(string))
	if err == nil {
		return workID, nil
	}
	return 0, fmt.Errorf("work_id missing in task payload and invalid partition key: %s", task.PartitionKey)
}

// Import 导入作品
func (s *WorkService) Import(ctx context.Context, file *multipart.FileHeader, userID uint) (*contracts.ImportResult, error) {
	return s.importer.Import(ctx, file, userID, func(c context.Context, w *models.Work) error {
		w.UserID = userID // 确保作品属于当前用户
		return s.Create(c, w)
	})
}
