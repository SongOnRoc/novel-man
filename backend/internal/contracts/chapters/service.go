package chapters

import (
	"novel-man/backend/internal/contracts"
	"novel-man/backend/internal/models"
)

// ChapterService 通过组合基础 CRUD 接口形成
type ChapterService interface {
	contracts.GenericCRUD[models.Chapter, uint]
	contracts.Importer
}
