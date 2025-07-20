package works

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// WorkRepository 通过组合基础仓储接口形成
type WorkRepository interface {
	contracts.GenericRepository[models.Work, int64]
}