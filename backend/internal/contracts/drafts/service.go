package drafts

import (
	"mime/multipart"

	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// DraftService 通过组合基础 CRUD 接口形成
type DraftService interface {
	contracts.GenericCRUD[models.Draft, uint]
	Publish(ctx context.Context, draftID uint) (*models.Chapter, error)
	// ImportDrafts 将上传文件批量导入为作品草稿（不直接生成章节）。
	ImportDrafts(ctx context.Context, file *multipart.FileHeader, userID uint, workID int64) (*contracts.ImportResult, error)
	// PublishBatch 批量发布草稿为章节，返回部分成功的汇总结果。
	PublishBatch(ctx context.Context, draftIDs []uint) (*contracts.ImportResult, error)
	HandleDraftTask(ctx context.Context, task events.QueueTask) error
}
