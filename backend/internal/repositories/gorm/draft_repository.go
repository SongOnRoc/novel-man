package gorm

import (
	"gorm.io/gorm"
	"novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/models"
)

// DraftGormRepository 通过嵌入 GenericGormRepository 来复用代码
type DraftGormRepository struct {
	*GenericGormRepository[models.Draft, uint]
	db *gorm.DB
}

func NewDraftGormRepository(db *gorm.DB) drafts.DraftRepository {
	return &DraftGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Draft, uint](db),
		db: db,
	}
}