package gorm

import (
	"novel-man/backend/internal/contracts/works"
	"novel-man/backend/internal/models"
	"novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// WorkGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorkGormRepository struct {
	*GenericGormRepository[models.Work, int64]
	db *gorm.DB
}

func NewWorkGormRepository(db *gorm.DB) works.WorkRepository {
	return &WorkGormRepository{
		GenericGormRepository: NewGenericGormRepository[models.Work, int64](db),
		db:                    db,
	}
}

func (r *WorkGormRepository) UpdateWorkStats(ctx context.Context, id int64, totalWordCount, totalChapterCount int) error {
	return r.db.WithContext(ctx).
		Model(&models.Work{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"total_word_count":    totalWordCount,
			"total_chapter_count": totalChapterCount,
		}).Error
}
