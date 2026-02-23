package works

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"
)

// WorkRepository 通过组合基础仓储接口形成
type WorkRepository interface {
	contracts.GenericRepository[models.Work, int64]
	UpdateWorkStats(ctx context.Context, id int64, totalWordCount, totalChapterCount int) error
}
