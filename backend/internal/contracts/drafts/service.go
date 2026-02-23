package drafts

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// DraftService 通过组合基础 CRUD 接口形成
type DraftService interface {
	contracts.GenericCRUD[models.Draft, uint]
	Publish(ctx context.Context, draftID uint) (*models.Chapter, error)
	HandleDraftTask(ctx context.Context, task events.QueueTask) error
}
