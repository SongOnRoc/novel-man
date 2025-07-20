package drafts

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// DraftRepository 通过组合基础仓储接口形成
type DraftRepository interface {
	contracts.GenericRepository[models.Draft, uint]
}