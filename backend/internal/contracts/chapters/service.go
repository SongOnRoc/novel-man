package chapters

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// ChapterService 通过组合基础 CRUD 接口形成
type ChapterService interface {
	contracts.GenericCRUD[models.Chapter, uint]
	contracts.Importer
	HandleChapterTask(ctx context.Context, task events.QueueTask) error
}
