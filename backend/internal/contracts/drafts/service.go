package drafts

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// DraftService 通过组合基础 CRUD 接口形成
type DraftService interface {
	contracts.GenericCRUD[models.Draft, uint]
}
