package chapters

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// ChapterRepository 通过组合基础仓储接口形成
type ChapterRepository interface {
	contracts.GenericRepository[models.Chapter, uint]
}