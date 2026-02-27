package works

import (
	"fmt"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

type DraftHandling string

const (
	DraftHandlingDelete DraftHandling = "delete"
	DraftHandlingUnlink DraftHandling = "unlink"
)

type DeleteWorkOptions struct {
	// DraftHandling 为 nil 表示请求未指定该参数。
	DraftHandling *DraftHandling
}

type DraftHandlingRequiredError struct {
	DraftCount int
}

func (e *DraftHandlingRequiredError) Error() string {
	return fmt.Sprintf("draft handling required (draftCount=%d)", e.DraftCount)
}

// WorkPublish 定义了作品发布的接口
type WorkPublish interface {
	Publish(ctx context.Context, id int64) error
}

// WorkService 通过组合基础 CRUD 接口和发布接口形成
type WorkService interface {
	contracts.GenericCRUD[models.Work, int64]
	WorkPublish
	contracts.Importer
	HandleWorkStatsTask(ctx context.Context, task events.QueueTask) error

	DeleteWithOptions(ctx context.Context, id int64, opts DeleteWorkOptions) error
}
